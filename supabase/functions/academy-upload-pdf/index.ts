import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function errorResponse(status: number, message: string, code: string, requestId?: string) {
  return new Response(
    JSON.stringify({ ok: false, error: message, code, request_id: requestId }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function generateRequestId(): string {
  return `req_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

async function computeFileHash(bytes: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Safe move: copy to destination, verify, then delete source */
async function safeMove(
  supabase: any,
  bucket: string,
  fromPath: string,
  toPath: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Download source
  const { data: fileData, error: dlErr } = await supabase.storage
    .from(bucket)
    .download(fromPath);
  if (dlErr || !fileData) {
    return { success: false, error: `Download failed: ${dlErr?.message || "no data"}` };
  }

  const bytes = new Uint8Array(await fileData.arrayBuffer());

  // 2. Upload to destination
  const { error: upErr } = await supabase.storage
    .from(bucket)
    .upload(toPath, bytes, { contentType: "application/pdf", upsert: false });
  if (upErr) {
    return { success: false, error: `Copy upload failed: ${upErr.message}` };
  }

  // 3. Verify destination exists
  const destDir = toPath.split("/").slice(0, -1).join("/");
  const destFile = toPath.split("/").pop();
  const { data: verifyData } = await supabase.storage
    .from(bucket)
    .list(destDir, { search: destFile });
  if (!verifyData || verifyData.length === 0) {
    return { success: false, error: "Destination verification failed after copy" };
  }

  // 4. Delete source
  const { error: delErr } = await supabase.storage
    .from(bucket)
    .remove([fromPath]);
  if (delErr) {
    console.warn(`[safe-move] Source cleanup failed (non-critical): ${delErr.message}`);
  }

  return { success: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = generateRequestId();
  const startTime = Date.now();
  let userId: string | null = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse(401, "Sua sessão expirou. Faça login novamente.", "UNAUTHORIZED", requestId);
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return errorResponse(401, "Sua sessão expirou. Faça login novamente.", "UNAUTHORIZED", requestId);
    }
    userId = user.id;

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check role
    const { data: roleData } = await supabaseService
      .from("academy_user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    const userRole = roleData?.role || "student";
    if (!["admin_academy", "teacher_approved", "teacher_candidate"].includes(userRole)) {
      const { data: generalRole } = await supabaseService
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!generalRole) {
        return errorResponse(403, "Apenas admin/teacher podem fazer upload de PDFs.", "FORBIDDEN", requestId);
      }
    }

    // Parse body
    const body = await req.json();
    const { paper_id, title, file_name, storage_path, file_size, file_hash: clientHash } = body;

    if (!storage_path || !file_name) {
      return errorResponse(400, "storage_path e file_name são obrigatórios.", "INVALID_PAYLOAD", requestId);
    }

    // Download file to compute server-side hash for idempotency
    const { data: fileBlob, error: dlErr } = await supabaseService.storage
      .from("academy-papers")
      .download(storage_path);

    if (dlErr || !fileBlob) {
      return errorResponse(404, "Arquivo não encontrado no storage. Reenvie o PDF.", "FILE_NOT_FOUND", requestId);
    }

    const fileBytes = new Uint8Array(await fileBlob.arrayBuffer());
    const serverHash = await computeFileHash(fileBytes);
    const finalFileSize = file_size || fileBytes.length;

    // Idempotency check: if a file with the same hash already exists, return it
    const { data: existingFile } = await supabaseService
      .from("academy_paper_files")
      .select("id, paper_id, storage_path, processing_status")
      .eq("file_hash", serverHash)
      .maybeSingle();

    if (existingFile) {
      console.log(`[idempotency] Duplicate detected: hash=${serverHash}, existing_file=${existingFile.id}`);

      // Clean up the duplicate upload from storage
      await supabaseService.storage.from("academy-papers").remove([storage_path]);

      // Log the duplicate attempt
      await supabaseService.from("academy_ai_logs").insert({
        action: "pdf_upload_duplicate",
        paper_id: existingFile.paper_id,
        user_id: userId,
        request_id: requestId,
        input: { file_name, file_hash: serverHash, storage_path, mode: "idempotency_hit" },
        output: { existing_file_id: existingFile.id, existing_paper_id: existingFile.paper_id },
        status: "success",
        duration_ms: Date.now() - startTime,
      });

      return new Response(JSON.stringify({
        ok: true,
        paper_id: existingFile.paper_id,
        file_id: existingFile.id,
        created_new: false,
        status: existingFile.processing_status,
        idempotent: true,
        request_id: requestId,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create paper if no paper_id
    let finalPaperId = paper_id;
    if (!finalPaperId) {
      if (!title || title.trim().length < 3) {
        return errorResponse(400, "Título é obrigatório ao criar novo paper (mínimo 3 caracteres).", "INVALID_TITLE", requestId);
      }

      const { data: newPaper, error: paperErr } = await supabaseService
        .from("academy_papers")
        .insert({
          title: title.trim(),
          import_source: "manual",
          curation_status: "draft",
          created_by: userId,
          import_payload: { source: "pdf_upload", file_name, request_id: requestId },
          warnings: ["Paper criado via upload de PDF. Metadados podem estar incompletos."],
        })
        .select("id")
        .single();

      if (paperErr) throw new Error(`Erro ao criar paper: ${paperErr.message}`);
      finalPaperId = newPaper.id;
    }

    // Safe move if file is in pending path
    let finalStoragePath = storage_path;
    if (storage_path.startsWith("papers/pending/")) {
      const newPath = storage_path.replace("papers/pending/", `papers/${finalPaperId}/`);
      const moveResult = await safeMove(supabaseService, "academy-papers", storage_path, newPath);
      if (moveResult.success) {
        finalStoragePath = newPath;
        console.log(`[safe-move] Success: ${storage_path} → ${newPath}`);
      } else {
        console.warn(`[safe-move] Failed (keeping original): ${moveResult.error}`);
        // Non-fatal: keep original path
      }
    }

    // Insert file record with hash + processing_status
    const { data: fileRecord, error: fileErr } = await supabaseService
      .from("academy_paper_files")
      .insert({
        paper_id: finalPaperId,
        storage_path: finalStoragePath,
        file_name,
        mime_type: "application/pdf",
        size_bytes: finalFileSize,
        uploaded_by: userId,
        file_hash: serverHash,
        processing_status: "queued",
        request_id: requestId,
      })
      .select("id")
      .single();

    if (fileErr) throw new Error(`Erro ao registrar arquivo: ${fileErr.message}`);

    // Log success
    await supabaseService.from("academy_ai_logs").insert({
      action: "pdf_upload",
      paper_id: finalPaperId,
      user_id: userId,
      request_id: requestId,
      input: { file_name, size_bytes: finalFileSize, paper_id: finalPaperId, created_new: !paper_id, file_hash: serverHash },
      output: { file_id: fileRecord.id, storage_path: finalStoragePath },
      status: "success",
      duration_ms: Date.now() - startTime,
    });

    return new Response(JSON.stringify({
      ok: true,
      paper_id: finalPaperId,
      file_id: fileRecord.id,
      file_hash: serverHash,
      created_new: !paper_id,
      status: "queued",
      request_id: requestId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Upload PDF error:", error);
    const message = error instanceof Error ? error.message : "Erro interno ao processar o paper. Tente novamente em instantes.";

    if (userId) {
      try {
        const supabaseService = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabaseService.from("academy_ai_logs").insert({
          action: "pdf_upload",
          user_id: userId,
          request_id: requestId,
          input: { error_context: "pdf_upload_failed" },
          status: "fail",
          error_message: message,
          duration_ms: Date.now() - startTime,
        });
      } catch (logErr) {
        console.error("Failed to log error:", logErr);
      }
    }

    return errorResponse(500, message, "INTERNAL_ERROR", requestId);
  }
});
