import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Article {
  id: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  doi: string | null;
  interest: string;
  abstract: string | null;
  pdf_path: string | null;
  pdf_url: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { articleId, userId, action } = await req.json();

    // Action: get-status - return current job status
    if (action === "get-status") {
      const { data: job } = await supabase
        .from("curation_jobs")
        .select("*")
        .eq("article_id", articleId)
        .in("status", ["queued", "running"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const { data: curation } = await supabase
        .from("curations")
        .select("*")
        .eq("article_id", articleId)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      return new Response(
        JSON.stringify({ job, curation }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: start - initiate new curation job
    if (!articleId || !userId) {
      return new Response(
        JSON.stringify({ error: "articleId and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if there's already an active job
    const { data: existingJob } = await supabase
      .from("curation_jobs")
      .select("*")
      .eq("article_id", articleId)
      .in("status", ["queued", "running"])
      .limit(1)
      .single();

    if (existingJob) {
      return new Response(
        JSON.stringify({ 
          message: "Job já em andamento", 
          job: existingJob,
          alreadyRunning: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the article
    const { data: article, error: articleError } = await supabase
      .from("curadoria_articles")
      .select("*")
      .eq("id", articleId)
      .single();

    if (articleError || !article) {
      return new Response(
        JSON.stringify({ error: "Artigo não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get max version number
    const { data: maxVersionData } = await supabase
      .from("curations")
      .select("version")
      .eq("article_id", articleId)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    const newVersion = (maxVersionData?.version || 0) + 1;

    // Create curation record with status em_producao
    const { data: curation, error: curationError } = await supabase
      .from("curations")
      .insert({
        article_id: articleId,
        version: newVersion,
        status: "em_producao",
        generated_by: "ai",
        created_by: userId,
      })
      .select()
      .single();

    if (curationError) {
      console.error("Error creating curation:", curationError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar curadoria" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from("curation_jobs")
      .insert({
        article_id: articleId,
        curation_id: curation.id,
        status: "queued",
        progress: 0,
      })
      .select()
      .single();

    if (jobError) {
      console.error("Error creating job:", jobError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar job" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update article status
    await supabase
      .from("curadoria_articles")
      .update({ status: "em_producao" })
      .eq("id", articleId);

    // Start background task
    EdgeRuntime.waitUntil(runCurationJob(supabase, job.id, article as Article, curation.id));

    return new Response(
      JSON.stringify({ 
        message: "Job iniciado com sucesso",
        job,
        curation
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-curation-job:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runCurationJob(
  supabase: any,
  jobId: string,
  article: Article,
  curationId: string
) {
  console.log(`Starting curation job ${jobId} for article ${article.id}`);
  
  try {
    // Update job to running
    await updateJob(supabase, jobId, { 
      status: "running", 
      progress: 5,
      started_at: new Date().toISOString()
    });

    // Step 1: Extract text from PDF or use abstract
    let articleText = "";
    let aiCoverage: "low" | "medium" | "high" = "medium";
    
    await updateJob(supabase, jobId, { progress: 10 });

    // Try to get PDF content if available
    if (article.pdf_path) {
      console.log("Attempting to extract text from PDF:", article.pdf_path);
      try {
        // Download PDF from storage
        const { data: pdfData, error: pdfError } = await supabase.storage
          .from("articles")
          .download(article.pdf_path);

        if (pdfError) {
          console.error("Error downloading PDF:", pdfError);
          aiCoverage = "low";
        } else if (pdfData) {
          // For now, we use the abstract + metadata since PDF text extraction 
          // requires external service. In production, integrate with a PDF parser.
          articleText = `Abstract: ${article.abstract || "Não disponível"}`;
          aiCoverage = article.abstract ? "medium" : "low";
        }
      } catch (e) {
        console.error("PDF extraction error:", e);
        aiCoverage = "low";
      }
    }

    await updateJob(supabase, jobId, { progress: 25 });

    // If no PDF text, use abstract and metadata
    if (!articleText) {
      if (article.abstract) {
        articleText = `Abstract: ${article.abstract}`;
        aiCoverage = "medium";
      } else {
        articleText = "Abstract não disponível. Análise baseada apenas em metadados.";
        aiCoverage = "low";
      }
    }

    await updateJob(supabase, jobId, { progress: 30 });

    // Step 2: Call AI to generate structured curation
    console.log("Calling AI to generate curation...");
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um especialista em análise crítica de literatura científica na área de fisioterapia regenerativa e medicina ortobiológica.
Sua tarefa é analisar artigos científicos e gerar uma curadoria estruturada seguindo o formato PICO.

REGRAS IMPORTANTES:
1. Não invente dados. Se uma informação não estiver disponível no texto, escreva "Não identificado no texto".
2. Seja conservador nas classificações de evidência e viés.
3. clinical_takeaways deve ter exatamente 3 a 5 itens curtos e práticos.
4. practice_impact deve ser diferente de authors_conclusion.
5. Foque na aplicabilidade clínica para profissionais de fisioterapia regenerativa.

Responda SEMPRE usando a função fornecida com os campos estruturados.`;

    const userPrompt = `Analise o seguinte artigo científico e gere uma curadoria estruturada:

TÍTULO: ${article.title}
AUTORES: ${article.authors}
ANO: ${article.year}
JOURNAL: ${article.journal}
ÁREA DE INTERESSE: ${article.interest}
${article.doi ? `DOI: ${article.doi}` : ''}

CONTEÚDO DO ARTIGO:
${articleText}

Gere uma curadoria estruturada completa para este artigo.`;

    await updateJob(supabase, jobId, { progress: 40 });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_structured_curation",
              description: "Gera uma curadoria estruturada de artigo científico",
              parameters: {
                type: "object",
                properties: {
                  objective: { type: "string", description: "Objetivo principal do estudo" },
                  design: { type: "string", description: "Desenho do estudo" },
                  population: { type: "string", description: "População estudada" },
                  sample_size: { type: "string", description: "Tamanho da amostra" },
                  intervention: { type: "string", description: "Intervenção estudada" },
                  comparator: { type: "string", description: "Grupo controle ou comparador" },
                  outcomes_primary: { type: "string", description: "Desfechos primários" },
                  outcomes_secondary: { type: "string", description: "Desfechos secundários" },
                  results_key: { type: "string", description: "Principais achados" },
                  adverse_events: { type: "string", description: "Eventos adversos" },
                  limitations: { type: "string", description: "Limitações do estudo" },
                  authors_conclusion: { type: "string", description: "Conclusão dos autores" },
                  evidence_level: { 
                    type: "string", 
                    enum: ["ia", "ib", "iia", "iib", "iii", "iv", "v"],
                    description: "Nível de evidência" 
                  },
                  bias_risk: { 
                    type: "string", 
                    enum: ["baixo", "moderado", "alto", "muito_alto", "incerto"],
                    description: "Risco de viés" 
                  },
                  applicability: { 
                    type: "string", 
                    enum: ["alta", "moderada", "baixa", "muito_baixa", "nao_aplicavel"],
                    description: "Aplicabilidade clínica" 
                  },
                  clinical_takeaways: { 
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 pontos-chave para a prática clínica" 
                  },
                  practice_impact: { 
                    type: "string", 
                    description: "Impacto na prática clínica" 
                  }
                },
                required: ["objective", "results_key", "clinical_takeaways", "practice_impact", "evidence_level", "bias_risk", "applicability"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_structured_curation" } }
      }),
    });

    await updateJob(supabase, jobId, { progress: 60 });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`Erro na IA: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || toolCall.function.name !== "generate_structured_curation") {
      throw new Error("Resposta inesperada da IA");
    }

    await updateJob(supabase, jobId, { progress: 70 });

    const curationData = JSON.parse(toolCall.function.arguments);
    console.log("AI response received, validating...");

    // Step 3: Validate and normalize data
    const validatedData = validateCurationData(curationData, article);
    
    await updateJob(supabase, jobId, { progress: 80 });

    // Step 4: Update curation record - set as "disponivel" (published)
    const { error: updateError } = await supabase
      .from("curations")
      .update({
        ...validatedData,
        status: "disponivel",
        ai_coverage: aiCoverage,
        ai_notes: aiCoverage === "low" 
          ? "Curadoria gerada com base limitada. Texto do PDF não disponível." 
          : null,
        updated_at: new Date().toISOString()
      })
      .eq("id", curationId);

    if (updateError) {
      console.error("Error updating curation:", updateError);
      throw new Error("Erro ao salvar curadoria");
    }

    await updateJob(supabase, jobId, { progress: 90 });

    // Update article status to "disponivel" (curation ready)
    await supabase
      .from("curadoria_articles")
      .update({ status: "disponivel" })
      .eq("id", article.id);

    // Step 5: Complete job
    await updateJob(supabase, jobId, { 
      status: "done", 
      progress: 100,
      finished_at: new Date().toISOString()
    });

    console.log(`Curation job ${jobId} completed successfully`);

  } catch (error) {
    console.error(`Curation job ${jobId} failed:`, error);
    
    // Update job with error
    await updateJob(supabase, jobId, { 
      status: "error", 
      error_message: error instanceof Error ? error.message : "Erro desconhecido",
      finished_at: new Date().toISOString()
    });

    // Update curation with error note
    await supabase
      .from("curations")
      .update({
        status: "em_revisao",
        ai_notes: `Erro na geração: ${error instanceof Error ? error.message : "Erro desconhecido"}. Revisão manual necessária.`,
        ai_coverage: "low"
      })
      .eq("id", curationId);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateJob(
  supabase: any,
  jobId: string,
  updates: Record<string, unknown>
) {
  const { error } = await supabase
    .from("curation_jobs")
    .update(updates)
    .eq("id", jobId);
  
  if (error) {
    console.error("Error updating job:", error);
  }
}

function validateCurationData(data: Record<string, unknown>, article: Article) {
  // Ensure clinical_takeaways is array with 3-5 items
  let takeaways = data.clinical_takeaways as string[] || [];
  if (!Array.isArray(takeaways) || takeaways.length < 3) {
    takeaways = [
      "Revisar metodologia do estudo original",
      "Avaliar aplicabilidade ao contexto clínico específico",
      "Considerar limitações identificadas"
    ];
  }
  if (takeaways.length > 5) {
    takeaways = takeaways.slice(0, 5);
  }

  // Ensure citations include at least the DOI
  const citations = article.doi 
    ? [{ doi: article.doi, excerpt: "Artigo original" }]
    : [];

  return {
    objective: data.objective || "Não identificado no texto",
    design: data.design || null,
    population: data.population || null,
    sample_size: data.sample_size || null,
    intervention: data.intervention || null,
    comparator: data.comparator || null,
    outcomes_primary: data.outcomes_primary || null,
    outcomes_secondary: data.outcomes_secondary || null,
    results_key: data.results_key || "Não identificado no texto",
    adverse_events: data.adverse_events || null,
    limitations: data.limitations || null,
    authors_conclusion: data.authors_conclusion || null,
    evidence_level: data.evidence_level || "v",
    bias_risk: data.bias_risk || "incerto",
    applicability: data.applicability || "moderada",
    clinical_takeaways: takeaways,
    practice_impact: data.practice_impact || data.what_changes_in_practice || null,
    what_changes_in_practice: data.practice_impact || data.what_changes_in_practice || null,
    citations
  };
}
