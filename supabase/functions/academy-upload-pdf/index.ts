import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;

  try {
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
      // Also check if they're a general admin
      const { data: generalRole } = await supabaseService
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!generalRole) {
        return new Response(JSON.stringify({ error: "Apenas admin/teacher podem fazer upload de PDFs." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Parse JSON body (base64 encoded PDF)
    const body = await req.json();
    const { paper_id, title, file_name, file_base64 } = body;

    if (!file_base64 || !file_name) {
      return new Response(JSON.stringify({ error: "file_name e file_base64 são obrigatórios." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode base64
    const binaryStr = atob(file_base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Create paper if no paper_id
    let finalPaperId = paper_id;
    if (!finalPaperId) {
      if (!title || title.trim().length < 3) {
        return new Response(JSON.stringify({ error: "Título é obrigatório ao criar novo paper." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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
    }

    // Upload to storage
    const timestamp = Date.now();
    const storagePath = `papers/${finalPaperId}/${timestamp}-${file_name}`;

    const { error: uploadErr } = await supabaseService.storage
      .from("academy-papers")
      .upload(storagePath, bytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadErr) throw new Error(`Erro no upload: ${uploadErr.message}`);

    // Insert file record
    const { data: fileRecord, error: fileErr } = await supabaseService
      .from("academy_paper_files")
      .insert({
        paper_id: finalPaperId,
        storage_path: storagePath,
        file_name,
        mime_type: "application/pdf",
        size_bytes: bytes.length,
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
      input: { file_name, size_bytes: bytes.length, paper_id: finalPaperId, created_new: !paper_id },
      output: { file_id: fileRecord.id, storage_path: storagePath },
      status: "success",
      duration_ms: Date.now() - startTime,
    });

    return new Response(JSON.stringify({
      paper_id: finalPaperId,
      file_id: fileRecord.id,
      created_new: !paper_id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Upload PDF error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";

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

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
