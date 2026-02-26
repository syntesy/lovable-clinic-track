import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function errorResponse(status: number, message: string, code: string) {
  return new Response(
    JSON.stringify({ ok: false, error: message, code }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse(401, "Sua sessão expirou. Faça login novamente.", "UNAUTHORIZED");
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return errorResponse(401, "Sua sessão expirou. Faça login novamente.", "UNAUTHORIZED");
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
        return errorResponse(403, "Apenas admin/teacher podem fazer upload de PDFs.", "FORBIDDEN");
      }
    }

    // Parse body - now expects storage_path instead of base64
    const body = await req.json();
    const { paper_id, title, file_name, storage_path, file_size, file_base64 } = body;

    // Support both new (storage_path) and legacy (file_base64) flows
    let finalStoragePath = storage_path;
    let finalFileSize = file_size || 0;

    if (!finalStoragePath && file_base64) {
      // Legacy base64 flow - decode and upload
      if (!file_name) {
        return errorResponse(400, "file_name é obrigatório.", "INVALID_PAYLOAD");
      }
      const binaryStr = atob(file_base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      finalFileSize = bytes.length;

      const timestamp = Date.now();
      finalStoragePath = `papers/${paper_id || "pending"}/${timestamp}-${file_name}`;

      const { error: uploadErr } = await supabaseService.storage
        .from("academy-papers")
        .upload(finalStoragePath, bytes, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadErr) throw new Error(`Erro no upload: ${uploadErr.message}`);
    }

    if (!finalStoragePath || !file_name) {
      return errorResponse(400, "storage_path e file_name são obrigatórios.", "INVALID_PAYLOAD");
    }

    // Verify file exists in storage
    const { data: fileCheck } = await supabaseService.storage
      .from("academy-papers")
      .list(finalStoragePath.split("/").slice(0, -1).join("/"), {
        search: finalStoragePath.split("/").pop(),
      });

    if (!fileCheck || fileCheck.length === 0) {
      return errorResponse(404, "Arquivo não encontrado. Reenvie o PDF.", "FILE_NOT_FOUND");
    }

    // Create paper if no paper_id
    let finalPaperId = paper_id;
    if (!finalPaperId) {
      if (!title || title.trim().length < 3) {
        return errorResponse(400, "Título é obrigatório ao criar novo paper (mínimo 3 caracteres).", "INVALID_TITLE");
      }

      const { data: newPaper, error: paperErr } = await supabaseService
        .from("academy_papers")
        .insert({
          title: title.trim(),
          import_source: "manual",
          curation_status: "draft",
          created_by: userId,
          import_payload: { source: "pdf_upload", file_name },
          warnings: ["Paper criado via upload de PDF. Metadados podem estar incompletos."],
        })
        .select("id")
        .single();

      if (paperErr) throw new Error(`Erro ao criar paper: ${paperErr.message}`);
      finalPaperId = newPaper.id;

      // If file was uploaded to pending path, move it
      if (finalStoragePath.startsWith("papers/pending/")) {
        const newPath = finalStoragePath.replace("papers/pending/", `papers/${finalPaperId}/`);
        const { error: moveErr } = await supabaseService.storage
          .from("academy-papers")
          .move(finalStoragePath, newPath);
        if (!moveErr) {
          finalStoragePath = newPath;
        }
      }
    }

    // Insert file record
    const { data: fileRecord, error: fileErr } = await supabaseService
      .from("academy_paper_files")
      .insert({
        paper_id: finalPaperId,
        storage_path: finalStoragePath,
        file_name,
        mime_type: "application/pdf",
        size_bytes: finalFileSize,
        uploaded_by: userId,
      })
      .select("id")
      .single();

    if (fileErr) throw new Error(`Erro ao registrar arquivo: ${fileErr.message}`);

    // Log
    await supabaseService.from("academy_ai_logs").insert({
      action: "pdf_upload",
      paper_id: finalPaperId,
      user_id: userId,
      input: { file_name, size_bytes: finalFileSize, paper_id: finalPaperId, created_new: !paper_id },
      output: { file_id: fileRecord.id, storage_path: finalStoragePath },
      status: "success",
      duration_ms: Date.now() - startTime,
    });

    return new Response(JSON.stringify({
      ok: true,
      paper_id: finalPaperId,
      file_id: fileRecord.id,
      created_new: !paper_id,
      status: "queued",
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
          input: { error_context: "pdf_upload_failed" },
          status: "fail",
          error_message: message,
          duration_ms: Date.now() - startTime,
        });
      } catch (logErr) {
        console.error("Failed to log error:", logErr);
      }
    }

    return errorResponse(500, message, "INTERNAL_ERROR");
  }
});
