import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";

// Adaptive chunking: returns chunks with offsets
function chunkTextAdaptive(text: string): { content: string; char_start: number; char_end: number }[] {
  const len = text.length;
  let numChunks: number;
  if (len <= 1200) numChunks = 1;
  else if (len <= 2400) numChunks = 2;
  else if (len <= 3600) numChunks = 3;
  else numChunks = 4;

  if (numChunks === 1) {
    return [{ content: text, char_start: 0, char_end: len }];
  }

  const chunkSize = Math.ceil(len / numChunks);
  const overlap = Math.min(100, Math.floor(chunkSize * 0.1));
  const chunks: { content: string; char_start: number; char_end: number }[] = [];
  let start = 0;

  for (let i = 0; i < numChunks; i++) {
    const end = Math.min(start + chunkSize + (i < numChunks - 1 ? overlap : 0), len);
    chunks.push({ content: text.slice(start, end), char_start: start, char_end: end });
    if (end >= len) break;
    start = start + chunkSize;
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;
  let paperId: string | null = null;

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

    const { paper_id } = await req.json();
    paperId = paper_id;
    if (!paper_id) {
      return new Response(JSON.stringify({ error: "paper_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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

    // Adaptive chunking with offsets
    const chunks = chunkTextAdaptive(paper.abstract_text);
    const embeddings = await generateEmbeddings(chunks.map(c => c.content), OPENAI_API_KEY);

    // Delete old abstract chunks only (keep PDF chunks)
    await supabaseService
      .from("academy_chunks")
      .delete()
      .eq("paper_id", paper_id)
      .eq("source_part", "abstract");

    // Insert with char_start/char_end
    const rows = chunks.map((chunk, i) => ({
      paper_id,
      source_part: "abstract",
      chunk_index: i,
      content: chunk.content,
      embedding: JSON.stringify(embeddings[i]),
      char_start: chunk.char_start,
      char_end: chunk.char_end,
    }));

    const { error: insertErr } = await supabaseService
      .from("academy_chunks")
      .insert(rows);

    if (insertErr) throw new Error(`Erro ao inserir chunks: ${insertErr.message}`);

    await supabaseService.from("academy_ai_logs").insert({
      action: "rag_index",
      paper_id,
      user_id: userId,
      input: { paper_id, abstract_length: paper.abstract_text.length },
      output: { chunks_created: chunks.length, model: OPENAI_EMBEDDING_MODEL, adaptive: true },
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
