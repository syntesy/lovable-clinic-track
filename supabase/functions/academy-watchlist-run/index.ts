import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function searchPubMed(query: string, daysBack: number = 7): Promise<string[]> {
  const dateTo = new Date();
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - daysBack);

  const mindate = `${dateFrom.getFullYear()}/${String(dateFrom.getMonth() + 1).padStart(2, "0")}/${String(dateFrom.getDate()).padStart(2, "0")}`;
  const maxdate = `${dateTo.getFullYear()}/${String(dateTo.getMonth() + 1).padStart(2, "0")}/${String(dateTo.getDate()).padStart(2, "0")}`;

  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=20&datetype=pdat&mindate=${mindate}&maxdate=${maxdate}&retmode=json`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`PubMed search error: ${res.status}`);

  const data = await res.json();
  return data.esearchresult?.idlist || [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;

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

    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = user.id;

    const { watchlist_id } = await req.json();
    if (!watchlist_id) {
      return new Response(JSON.stringify({ error: "watchlist_id é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify admin role
    const isAdmin = await supabaseService
      .from("academy_user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin_academy")
      .maybeSingle();

    const isGlobalAdmin = await supabaseService
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!isAdmin.data && !isGlobalAdmin.data) {
      return new Response(JSON.stringify({ error: "Acesso negado. Apenas administradores." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get watchlist
    const { data: watchlist, error: wlErr } = await supabaseService
      .from("academy_pubmed_watchlists")
      .select("*")
      .eq("id", watchlist_id)
      .single();

    if (wlErr || !watchlist) {
      return new Response(JSON.stringify({ error: "Watchlist não encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine days back based on frequency
    const daysBack = watchlist.frequency === "daily" ? 2 : 8;

    // Search PubMed
    const pmids = await searchPubMed(watchlist.query, daysBack);

    // Check which PMIDs already exist
    const newPmids: string[] = [];
    for (const pmid of pmids) {
      const { data: existing } = await supabaseService
        .from("academy_papers")
        .select("id")
        .eq("pmid", pmid)
        .maybeSingle();

      if (!existing) newPmids.push(pmid);
    }

    // Import new papers via the import function
    const importedPapers: any[] = [];
    const importErrors: any[] = [];

    for (const pmid of newPmids.slice(0, 10)) {
      try {
        const { data, error } = await supabaseAuth.functions.invoke("academy-import-paper", {
          body: { identifier: pmid },
        });
        if (error || data?.error) {
          importErrors.push({ pmid, error: data?.error || error?.message });
        } else {
          importedPapers.push({ pmid, paper_id: data.paper?.id, title: data.paper?.title });
        }
      } catch (err: any) {
        importErrors.push({ pmid, error: err.message });
      }
    }

    const runResults = {
      query: watchlist.query,
      days_back: daysBack,
      total_found: pmids.length,
      already_existing: pmids.length - newPmids.length,
      new_found: newPmids.length,
      imported: importedPapers.length,
      errors: importErrors.length,
      imported_papers: importedPapers,
      import_errors: importErrors,
    };

    // Update watchlist
    await supabaseService
      .from("academy_pubmed_watchlists")
      .update({
        last_run_at: new Date().toISOString(),
        last_run_results: runResults,
      })
      .eq("id", watchlist_id);

    // Log
    await supabaseService.from("academy_ai_logs").insert({
      action: "watchlist_run",
      user_id: userId,
      input: { watchlist_id, query: watchlist.query, days_back: daysBack },
      output: runResults,
      status: "success",
      duration_ms: Date.now() - startTime,
    });

    return new Response(JSON.stringify(runResults), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Watchlist run error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";

    if (userId) {
      try {
        const supabaseService = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabaseService.from("academy_ai_logs").insert({
          action: "watchlist_run",
          user_id: userId,
          input: { error_context: "watchlist_run_failed" },
          status: "fail",
          error_message: message,
          duration_ms: Date.now() - startTime,
        });
      } catch {}
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
