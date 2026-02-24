import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DELAY_MS = 500;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check — must be admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check admin role
    const { data: roleData } = await supabaseService
      .from("academy_user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleData?.role !== "admin_academy") {
      // Also check user_roles for admin
      const { data: urData } = await supabaseService
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!urData) {
        return new Response(JSON.stringify({ error: "Apenas administradores podem executar migrações." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json();
    const batchSize = Math.min(body.batch_size || 10, 50);
    const dryRun = body.dry_run === true;

    // Find published papers without REM layers
    const { data: candidates, error: fetchErr } = await supabaseService
      .from("academy_papers")
      .select("id, title, curation_data, curation_status")
      .eq("curation_status", "published")
      .is("deleted_at", null)
      .limit(batchSize);

    if (fetchErr) throw new Error(`Erro ao buscar papers: ${fetchErr.message}`);

    // Filter to those without REM layers
    const papersToMigrate = (candidates || []).filter((p: any) => {
      const rem = p.curation_data?.reghen_evidence_method?.layers;
      return !rem;
    });

    if (dryRun) {
      return new Response(JSON.stringify({
        dry_run: true,
        would_process: papersToMigrate.length,
        paper_ids: papersToMigrate.map((p: any) => p.id),
        papers: papersToMigrate.map((p: any) => ({ id: p.id, title: p.title })),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process each paper
    const results: { paper_id: string; status: string; error?: string }[] = [];
    let updated = 0;
    let failed = 0;

    for (const paper of papersToMigrate) {
      try {
        // Call academy-generate-curation via service role
        const curationResp = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/academy-generate-curation`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ paper_id: paper.id }),
          }
        );

        if (!curationResp.ok) {
          const errText = await curationResp.text();
          throw new Error(`Curation failed (${curationResp.status}): ${errText}`);
        }

        const curationResult = await curationResp.json();

        // Log revision as method_migration
        await supabaseService.from("academy_paper_revisions").insert({
          paper_id: paper.id,
          actor_user_id: user.id,
          action: "method_migration",
          status: "published",
          curation_data: curationResult.curation_data || null,
          warnings: curationResult.warnings || null,
        });

        // Log in ai_logs
        await supabaseService.from("academy_ai_logs").insert({
          action: "method_migration",
          user_id: user.id,
          paper_id: paper.id,
          input: { paper_id: paper.id, mode: "method_migration" },
          output: { success: true },
          status: "success",
        });

        results.push({ paper_id: paper.id, status: "updated" });
        updated++;
      } catch (err: any) {
        const msg = err.message || "Unknown error";
        results.push({ paper_id: paper.id, status: "failed", error: msg });
        failed++;

        // Log failure
        await supabaseService.from("academy_ai_logs").insert({
          action: "method_migration",
          user_id: user.id,
          paper_id: paper.id,
          input: { paper_id: paper.id, mode: "method_migration" },
          status: "fail",
          error_message: msg,
        });
      }

      // Rate limit delay
      if (papersToMigrate.indexOf(paper) < papersToMigrate.length - 1) {
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }

    return new Response(JSON.stringify({
      processed: papersToMigrate.length,
      updated,
      failed,
      paper_ids: papersToMigrate.map((p: any) => p.id),
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Migration error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
