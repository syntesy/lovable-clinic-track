import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(status: number, message: string, code: string, requestId?: string) {
  return new Response(
    JSON.stringify({ ok: false, error: message, code, request_id: requestId }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

function generateRequestId(): string {
  return `req_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

// Valid source types matching the DB enum paper_import_source
const VALID_SOURCE_TYPES = ["pmid", "doi", "manual", "url", "pdf_upload"] as const;
type SourceType = (typeof VALID_SOURCE_TYPES)[number];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // ── Auth ──────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse(401, "Sessão expirada. Faça login novamente.", "UNAUTHORIZED", requestId);
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return errorResponse(401, "Sessão expirada. Faça login novamente.", "UNAUTHORIZED", requestId);
    }
    const userId = user.id;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Role check ───────────────────────────────────────
    const { data: roleData } = await supabase
      .from("academy_user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    const academyRole = roleData?.role || "student";
    if (!["admin_academy", "teacher_approved", "teacher_candidate"].includes(academyRole)) {
      const { data: generalRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!generalRole) {
        return errorResponse(403, "Permissão insuficiente para criar papers.", "FORBIDDEN", requestId);
      }
    }

    // ── Parse body ───────────────────────────────────────
    const body = await req.json();
    const {
      source_type,
      source_value,
      title,
      doi,
      pmid,
      // PDF-specific (optional)
      storage_path,
      file_name,
    } = body as {
      source_type: string;
      source_value?: string;
      title?: string;
      doi?: string;
      pmid?: string;
      storage_path?: string;
      file_name?: string;
    };

    // ── Validate source_type ─────────────────────────────
    if (!source_type || !VALID_SOURCE_TYPES.includes(source_type as SourceType)) {
      return errorResponse(
        400,
        `source_type inválido. Aceitos: ${VALID_SOURCE_TYPES.join(", ")}`,
        "INVALID_SOURCE_TYPE",
        requestId,
      );
    }

    // ── Resolve identifiers ──────────────────────────────
    const resolvedDoi = doi?.trim() || (source_type === "doi" ? source_value?.trim() : null) || null;
    const resolvedPmid = pmid?.trim() || (source_type === "pmid" ? source_value?.trim() : null) || null;

    // ── Idempotency: check existing by DOI ───────────────
    if (resolvedDoi) {
      const { data: existingByDoi } = await supabase
        .from("academy_papers")
        .select("id, title, curation_status, doi, pmid, created_at")
        .eq("doi", resolvedDoi)
        .is("deleted_at", null)
        .maybeSingle();

      if (existingByDoi) {
        // Log idempotent hit
        await supabase.from("academy_ai_logs").insert({
          action: "create_paper_idempotent",
          paper_id: existingByDoi.id,
          user_id: userId,
          request_id: requestId,
          input: { source_type, doi: resolvedDoi, mode: "idempotency_doi" },
          output: { existing_paper_id: existingByDoi.id },
          status: "success",
          duration_ms: Date.now() - startTime,
        });

        return jsonResponse({
          ok: true,
          paper_id: existingByDoi.id,
          created_new: false,
          idempotent: true,
          reason: "doi_exists",
          paper: existingByDoi,
          request_id: requestId,
        });
      }
    }

    // ── Idempotency: check existing by PMID ──────────────
    if (resolvedPmid) {
      const { data: existingByPmid } = await supabase
        .from("academy_papers")
        .select("id, title, curation_status, doi, pmid, created_at")
        .eq("pmid", resolvedPmid)
        .is("deleted_at", null)
        .maybeSingle();

      if (existingByPmid) {
        await supabase.from("academy_ai_logs").insert({
          action: "create_paper_idempotent",
          paper_id: existingByPmid.id,
          user_id: userId,
          request_id: requestId,
          input: { source_type, pmid: resolvedPmid, mode: "idempotency_pmid" },
          output: { existing_paper_id: existingByPmid.id },
          status: "success",
          duration_ms: Date.now() - startTime,
        });

        return jsonResponse({
          ok: true,
          paper_id: existingByPmid.id,
          created_new: false,
          idempotent: true,
          reason: "pmid_exists",
          paper: existingByPmid,
          request_id: requestId,
        });
      }
    }

    // ── Validate title (required for new papers) ─────────
    const resolvedTitle = title?.trim() || source_value?.trim() || null;
    if (!resolvedTitle || resolvedTitle.length < 3) {
      return errorResponse(
        400,
        "Título é obrigatório (mínimo 3 caracteres) ou forneça DOI/PMID existente.",
        "INVALID_TITLE",
        requestId,
      );
    }

    // ── PDF upload: validate storage_path ────────────────
    if (source_type === "pdf_upload") {
      if (!storage_path || !file_name) {
        return errorResponse(
          400,
          "Para PDF upload, storage_path e file_name são obrigatórios.",
          "MISSING_PDF_FIELDS",
          requestId,
        );
      }

      // Verify file exists in storage
      const { data: fileBlob, error: dlErr } = await supabase.storage
        .from("academy-papers")
        .download(storage_path);

      if (dlErr || !fileBlob) {
        return errorResponse(
          404,
          "Arquivo PDF não encontrado no storage. Reenvie o arquivo.",
          "FILE_NOT_FOUND",
          requestId,
        );
      }
    }

    // ── Create paper ─────────────────────────────────────
    const importSource = source_type as SourceType;
    const warnings: string[] = [];

    if (source_type === "pdf_upload") {
      warnings.push("Paper criado via upload de PDF. Metadados podem estar incompletos.");
    }
    if (source_type === "url") {
      warnings.push("Paper criado via URL. DOI/PMID serão resolvidos na ingestão.");
    }

    const { data: newPaper, error: insertErr } = await supabase
      .from("academy_papers")
      .insert({
        title: resolvedTitle,
        doi: resolvedDoi,
        pmid: resolvedPmid,
        import_source: importSource,
        curation_status: "ingesting",
        created_by: userId,
        version: 1,
        locked_for_processing: false,
        import_payload: {
          source_type,
          source_value: source_value || null,
          storage_path: storage_path || null,
          file_name: file_name || null,
          request_id: requestId,
        },
        warnings,
      })
      .select("id, title, curation_status, doi, pmid, import_source, created_at, version")
      .single();

    if (insertErr) {
      // Check for unique constraint violations (DOI/PMID race condition)
      if (insertErr.message?.includes("idx_academy_papers_unique_doi") ||
          insertErr.message?.includes("idx_academy_papers_unique_pmid")) {
        return errorResponse(
          409,
          "Paper com este DOI/PMID já existe (criação concorrente detectada).",
          "DUPLICATE_RACE",
          requestId,
        );
      }
      throw new Error(`Erro ao criar paper: ${insertErr.message}`);
    }

    // ── Log ingestion attempt ────────────────────────────
    await supabase.from("academy_paper_ingestion").insert({
      paper_id: newPaper.id,
      source_identifier: source_value || resolvedDoi || resolvedPmid || resolvedTitle,
      route_used: source_type === "pdf_upload" ? "pdf_grobid" : source_type === "pmid" ? "pubmed" : "pubmed",
      status: "pending",
      created_by: userId,
    });

    // ── Log success ──────────────────────────────────────
    await supabase.from("academy_ai_logs").insert({
      action: "create_paper",
      paper_id: newPaper.id,
      user_id: userId,
      request_id: requestId,
      input: { source_type, source_value, doi: resolvedDoi, pmid: resolvedPmid, title: resolvedTitle },
      output: { paper_id: newPaper.id, created_new: true },
      status: "success",
      duration_ms: Date.now() - startTime,
    });

    return jsonResponse({
      ok: true,
      paper_id: newPaper.id,
      created_new: true,
      idempotent: false,
      paper: newPaper,
      request_id: requestId,
    }, 201);

  } catch (error) {
    console.error("create-paper error:", error);
    const message = error instanceof Error ? error.message : "Erro interno ao criar paper.";

    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await supabase.from("academy_ai_logs").insert({
        action: "create_paper",
        user_id: "00000000-0000-0000-0000-000000000000",
        request_id: requestId,
        input: { error_context: "create_paper_failed" },
        status: "fail",
        error_message: message,
        duration_ms: Date.now() - startTime,
      });
    } catch (_) { /* non-fatal */ }

    return errorResponse(500, message, "INTERNAL_ERROR", requestId);
  }
});
