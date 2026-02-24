import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 150;

function chunkText(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return [text];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end));
    if (end >= text.length) break;
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}

async function generateEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI Embeddings API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.data.map((d: any) => d.embedding);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;
  let paperId: string | null = null;
  let supabaseAuth: any = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user
    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = user.id;

    const { paper_id } = await req.json();
    paperId = paper_id;
    if (!paper_id) {
      return new Response(JSON.stringify({ error: "paper_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for chunk operations (bypasses RLS)
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch paper
    const { data: paper, error: fetchErr } = await supabaseService
      .from("academy_papers")
      .select("id, title, abstract_text, curation_status")
      .eq("id", paper_id)
      .single();

    if (fetchErr || !paper) {
      return new Response(JSON.stringify({ error: "Paper não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!paper.abstract_text || paper.abstract_text.trim().length < 20) {
      // Log warning but don't fail
      await supabaseService.from("academy_ai_logs").insert({
        action: "rag_index",
        paper_id,
        user_id: userId,
        input: { paper_id, reason: "abstract_too_short" },
        output: { warning: "Abstract ausente ou muito curto para indexação." },
        status: "success",
        duration_ms: Date.now() - startTime,
      });

      return new Response(
        JSON.stringify({ indexed: false, warning: "Abstract ausente ou muito curto para indexação." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    // Chunk the abstract
    const chunks = chunkText(paper.abstract_text);

    // Generate embeddings
    const embeddings = await generateEmbeddings(chunks, OPENAI_API_KEY);

    // Delete old chunks for this paper
    await supabaseService
      .from("academy_chunks")
      .delete()
      .eq("paper_id", paper_id);

    // Insert new chunks
    const rows = chunks.map((content, i) => ({
      paper_id,
      source_part: "abstract",
      chunk_index: i,
      content,
      embedding: JSON.stringify(embeddings[i]),
    }));

    const { error: insertErr } = await supabaseService
      .from("academy_chunks")
      .insert(rows);

    if (insertErr) throw new Error(`Erro ao inserir chunks: ${insertErr.message}`);

    // Log success
    await supabaseService.from("academy_ai_logs").insert({
      action: "rag_index",
      paper_id,
      user_id: userId,
      input: { paper_id, abstract_length: paper.abstract_text.length },
      output: { chunks_created: chunks.length, model: OPENAI_EMBEDDING_MODEL },
      status: "success",
      duration_ms: Date.now() - startTime,
      model_used: OPENAI_EMBEDDING_MODEL,
    });

    return new Response(
      JSON.stringify({ indexed: true, chunks_created: chunks.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Index error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";

    // Log failure
    if (userId) {
      try {
        const supabaseService = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabaseService.from("academy_ai_logs").insert({
          action: "rag_index",
          paper_id: paperId,
          user_id: userId,
          input: { paper_id: paperId },
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
