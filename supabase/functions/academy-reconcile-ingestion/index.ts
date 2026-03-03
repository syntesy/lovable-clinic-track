import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// ═══════════════════════════════════════════════════════════
// academy-reconcile-ingestion — Watchdog for stuck papers (Etapa 5)
// Enhanced: PMC retry policy (24h/5 attempts before ERROR)
// ═══════════════════════════════════════════════════════════

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const JOB_STALE_MINUTES = 15;
const PMC_MAX_ATTEMPTS = 5;
const PMC_MAX_AGE_HOURS = 24;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Check admin role
    const { data: roleData } = await supabase
      .from("academy_user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const isAdmin = roleData?.role === "admin_academy";
    if (!isAdmin) {
      const { data: generalRole } = await supabase
        .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!generalRole) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const staleCutoff = new Date(Date.now() - JOB_STALE_MINUTES * 60 * 1000).toISOString();
    const pmcAgeCutoff = new Date(Date.now() - PMC_MAX_AGE_HOURS * 60 * 60 * 1000).toISOString();

    const reconciled: any[] = [];
    const errors: string[] = [];

    // 1. Find papers stuck in INGESTING with stale locks
    const { data: stuckPapers } = await supabase
      .from("academy_papers")
      .select("id, title, curation_status, locked_for_processing, processing_started_at, created_at")
      .eq("curation_status", "ingesting")
      .is("deleted_at", null)
      .lt("processing_started_at", staleCutoff)
      .limit(50);

    // 2. Find pending PDF jobs that are stale
    const { data: staleJobs } = await supabase
      .from("academy_paper_ingestion")
      .select("id, paper_id, job_id, created_at, status")
      .eq("status", "pending")
      .eq("route_used", "pdf_grobid")
      .not("job_id", "is", null)
      .lt("created_at", staleCutoff)
      .limit(50);

    // 3. PMC retry policy: papers stuck in ingesting with PMC failures
    const { data: pmcStuckPapers } = await supabase
      .from("academy_papers")
      .select("id, title, created_at")
      .eq("curation_status", "ingesting")
      .is("deleted_at", null)
      .lt("created_at", pmcAgeCutoff)
      .limit(50);

    // Release stuck locks
    if (stuckPapers && stuckPapers.length > 0) {
      for (const paper of stuckPapers) {
        try {
          // Check if this paper has PMC attempts — apply PMC policy
          const { data: pmcAttempts } = await supabase
            .from("academy_paper_ingestion")
            .select("id")
            .eq("paper_id", paper.id)
            .eq("route_used", "pmc_xml")
            .eq("status", "fail");

          const pmcFailCount = pmcAttempts?.length || 0;

          if (pmcFailCount < PMC_MAX_ATTEMPTS) {
            // Just release lock, keep as ingesting for retry
            await supabase.from("academy_papers").update({
              locked_for_processing: false,
              processing_started_at: null,
            }).eq("id", paper.id);
            reconciled.push({ paper_id: paper.id, action: "released_lock_for_pmc_retry", pmc_fails: pmcFailCount, title: paper.title });
          } else {
            // Max PMC attempts reached — mark ERROR
            await supabase.from("academy_papers").update({
              locked_for_processing: false,
              processing_started_at: null,
              curation_status: "error",
              error_code: "PMC_MAX_RETRIES_EXCEEDED",
            }).eq("id", paper.id);

            await supabase.from("academy_review_task").insert({
              paper_id: paper.id,
              reason: "parser_error",
              status: "open",
              created_by: user.id,
            });

            reconciled.push({ paper_id: paper.id, action: "errored_pmc_max_retries", pmc_fails: pmcFailCount, title: paper.title });
          }
        } catch (e: any) {
          errors.push(`paper ${paper.id}: ${e.message}`);
        }
      }
    }

    // PMC age policy: papers older than 24h still in ingesting
    if (pmcStuckPapers && pmcStuckPapers.length > 0) {
      for (const paper of pmcStuckPapers) {
        try {
          const { data: alreadyErrored } = await supabase
            .from("academy_papers")
            .select("curation_status")
            .eq("id", paper.id)
            .single();

          if (alreadyErrored?.curation_status === "ingesting") {
            await supabase.from("academy_papers").update({
              locked_for_processing: false,
              processing_started_at: null,
              curation_status: "error",
              error_code: "STUCK_INGESTING_24H",
            }).eq("id", paper.id);

            await supabase.from("academy_review_task").insert({
              paper_id: paper.id,
              reason: "parser_error",
              status: "open",
              created_by: user.id,
            });

            reconciled.push({ paper_id: paper.id, action: "errored_24h_timeout", title: paper.title });
          }
        } catch (e: any) {
          errors.push(`paper_24h ${paper.id}: ${e.message}`);
        }
      }
    }

    // Handle stale PDF jobs
    if (staleJobs && staleJobs.length > 0) {
      for (const job of staleJobs) {
        try {
          await supabase.from("academy_paper_ingestion").update({
            status: "fail",
            error_message: `Job stale after ${JOB_STALE_MINUTES} minutes`,
            raw_payload: { job: { job_id: job.job_id, status: "timeout" } },
          }).eq("id", job.id);

          reconciled.push({ paper_id: job.paper_id, job_id: job.job_id, action: "marked_job_timeout" });
        } catch (e: any) {
          errors.push(`job ${job.id}: ${e.message}`);
        }
      }
    }

    console.log(JSON.stringify({
      event: "reconcile_complete",
      stuck_papers: stuckPapers?.length || 0,
      stale_jobs: staleJobs?.length || 0,
      pmc_stuck: pmcStuckPapers?.length || 0,
      reconciled: reconciled.length,
      errors: errors.length,
    }));

    return new Response(JSON.stringify({
      ok: true,
      stuck_papers_found: stuckPapers?.length || 0,
      stale_jobs_found: staleJobs?.length || 0,
      pmc_stuck_found: pmcStuckPapers?.length || 0,
      reconciled,
      errors: errors.length > 0 ? errors : undefined,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Reconcile error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
