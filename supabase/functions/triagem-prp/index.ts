import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, createRateLimitResponse, getRateLimitHeaders } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const assistantId = Deno.env.get('ASSISTANT_TRIAGEM_PRP_ID');
const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// =============================================================================
// TAXONOMY GATE: Determina se o item requer triagem via categoria efetiva
// =============================================================================

interface TaxonomyGateResult {
  requires_score: boolean;
  effective_category_code: string | null;
  legacy_type: "PRP" | "PRF" | "BMAC" | null;
  item_name: string | null;
}

/**
 * Consulta taxonomia para determinar se item requer triagem.
 * Calcula effective_category_code = COALESCE(base_component_category_code, category_code)
 */
async function checkTaxonomyGate(therapyItemCode: string | undefined): Promise<TaxonomyGateResult> {
  // Se não foi passado código, assume triagem necessária (compatibilidade)
  if (!therapyItemCode) {
    console.log("[TaxonomyGate] No therapy_item_code provided, assuming score required (legacy mode)");
    return { requires_score: true, effective_category_code: null, legacy_type: "PRP", item_name: null };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Buscar item com categoria
  const { data: item, error: itemError } = await supabase
    .from("therapy_items")
    .select("code, name, category_code, base_component_category_code")
    .eq("code", therapyItemCode)
    .single();

  if (itemError || !item) {
    console.log(`[TaxonomyGate] Item not found: ${therapyItemCode}, assuming score required`);
    return { requires_score: true, effective_category_code: null, legacy_type: "PRP", item_name: null };
  }

  // Calcular categoria efetiva (híbridos usam base_component)
  const effectiveCategoryCode = item.base_component_category_code ?? item.category_code;

  // Buscar flags da categoria efetiva
  const { data: category, error: catError } = await supabase
    .from("therapy_categories")
    .select("code, requires_score")
    .eq("code", effectiveCategoryCode)
    .single();

  if (catError || !category) {
    console.log(`[TaxonomyGate] Category not found: ${effectiveCategoryCode}, assuming score required`);
    return { requires_score: true, effective_category_code: effectiveCategoryCode, legacy_type: "PRP", item_name: item.name };
  }

  // Mapear para tipo legado do motor (PRP/PRF/BMAC)
  const legacyType = mapToLegacyType(therapyItemCode);

  console.log(`[TaxonomyGate] Item: ${therapyItemCode}, EffectiveCategory: ${effectiveCategoryCode}, RequiresScore: ${category.requires_score}, LegacyType: ${legacyType}`);

  return {
    requires_score: category.requires_score,
    effective_category_code: effectiveCategoryCode,
    legacy_type: legacyType,
    item_name: item.name,
  };
}

/**
 * Mapeia código da taxonomia para tipo legado do motor (compatibilidade)
 */
function mapToLegacyType(itemCode: string): "PRP" | "PRF" | "BMAC" | null {
  const code = itemCode.toUpperCase();

  // PRP e variações
  if (code === "AUTO_PRP" || code === "AUTO_LP_PRP" || code === "AUTO_LR_PRP" || code.includes("PRP")) {
    return "PRP";
  }

  // PRF e variações
  if (code === "AUTO_PRF" || code === "AUTO_IPRF" || code === "AUTO_APRF" || code === "AUTO_LPRF" || code.includes("PRF")) {
    return "PRF";
  }

  // BMA/BMAC/BMEC
  if (code === "AUTO_BMA" || code === "AUTO_BMAC" || code === "AUTO_BMEC" || 
      code.includes("BMA") || code.includes("BMAC") || code.includes("BMEC")) {
    return "BMAC";
  }

  // Nanofat/Microfat → mapeia para BMAC
  if (code === "AUTO_NANOFAT" || code === "AUTO_MICROFAT") {
    return "BMAC";
  }

  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const authHeader = req.headers.get('authorization') || '';
    const identifier = authHeader || clientIP;
    
    const rateLimitResult = checkRateLimit(`triagem-prp:${identifier}`, {
      maxRequests: 15,  // 15 triagens por minuto
      windowMs: 60 * 1000,
    });
    
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.resetAt);
    }
    
    const { rawQuestionnaire, questionnaireData, labResults, action, imageUrls, therapyItemCode } = await req.json();

    // Handle OCR/Vision extraction
    if (action === "extract_text") {
      return await handleTextExtraction(imageUrls);
    }

    // ==========================================================================
    // TAXONOMY GATE: Verificar se o item requer triagem
    // ==========================================================================
    const taxonomyGate = await checkTaxonomyGate(therapyItemCode);
    
    if (!taxonomyGate.requires_score) {
      console.log(`[TaxonomyGate] Score NOT required for: ${therapyItemCode}`);
      return new Response(
        JSON.stringify({
          success: true,
          gate: "taxonomy",
          requires_score: false,
          message: `Triagem de score não é necessária para "${taxonomyGate.item_name || therapyItemCode}". Categoria: ${taxonomyGate.effective_category_code}`,
          eligibility: {
            overall_status: "NOT_APPLICABLE",
            reason: "Item não requer avaliação de aptidão biológica"
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY não está configurada");
    }

    if (!assistantId) {
      throw new Error("ASSISTANT_TRIAGEM_PRP_ID não está configurado");
    }

    let userMessage = "";

    if (action === "questionnaire") {
      // Prioriza o novo formato rawQuestionnaire, mas aceita o antigo questionnaireData
      const dataToUse = rawQuestionnaire || questionnaireData;
      userMessage = formatRawQuestionnaireForAssistant(dataToUse);
    } else if (action === "lab_results") {
      userMessage = formatLabResultsForAnalysis(labResults);
    } else {
      throw new Error("Ação inválida. Use 'questionnaire', 'lab_results' ou 'extract_text'");
    }

    console.log("Creating thread...");
    console.log("User message (first 500 chars):", userMessage.substring(0, 500));
    
    // Create a thread
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({})
    });

    if (!threadResponse.ok) {
      const errorText = await threadResponse.text();
      console.error("Thread creation error:", errorText);
      throw new Error(`Erro ao criar thread: ${threadResponse.status}`);
    }

    const thread = await threadResponse.json();
    console.log("Thread created:", thread.id);

    // Add message to thread
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: userMessage
      })
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error("Message creation error:", errorText);
      throw new Error(`Erro ao criar mensagem: ${messageResponse.status}`);
    }

    console.log("Message added to thread");

    // Run the assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: assistantId
      })
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error("Run creation error:", errorText);
      throw new Error(`Erro ao executar assistente: ${runResponse.status}`);
    }

    const run = await runResponse.json();
    console.log("Run created:", run.id);

    // Poll for completion
    let runStatus = run.status;
    let attempts = 0;
    const maxAttempts = 60;

    while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      const statusData = await statusResponse.json();
      runStatus = statusData.status;
      attempts++;
      console.log(`Run status: ${runStatus} (attempt ${attempts})`);
    }

    if (runStatus !== 'completed') {
      throw new Error(`Assistente não completou: ${runStatus}`);
    }

    // Get messages
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    const messagesData = await messagesResponse.json();
    const assistantMessage = messagesData.data.find((m: any) => m.role === 'assistant');
    
    if (!assistantMessage) {
      throw new Error("Nenhuma resposta do assistente encontrada");
    }

    const analysisText = assistantMessage.content[0]?.text?.value || "";
    console.log("Assistant response (first 500 chars):", analysisText.substring(0, 500));

    // Try to parse structured JSON from response
    const structuredResult = parseStructuredResponse(analysisText);

    // Parse classification from response (fallback)
    const classification = structuredResult?.eligibility?.overall_status || parseClassification(analysisText);

    // Parse recommended exams
    const recommendedExams = parseRecommendedExams(analysisText);

    // Parse patient orientations
    const patientOrientations = parseOrientations(analysisText);

    return new Response(JSON.stringify({ 
      rawAnalysis: analysisText,
      structuredResult,
      classification,
      recommendedExams,
      patientOrientations
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in triagem-prp function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Handle OCR/Vision text extraction using Lovable AI
async function handleTextExtraction(imageUrls: string[]): Promise<Response> {
  if (!lovableApiKey) {
    throw new Error("LOVABLE_API_KEY não está configurada");
  }

  if (!imageUrls || imageUrls.length === 0) {
    return new Response(JSON.stringify({ error: "Nenhuma imagem fornecida" }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log(`Extracting text from ${imageUrls.length} images...`);

  const extractedTexts: { fileName: string; text: string; success: boolean; error?: string }[] = [];

  for (const imageData of imageUrls) {
    const { url, fileName } = typeof imageData === 'string' 
      ? { url: imageData, fileName: 'arquivo' } 
      : imageData;

    try {
      console.log(`Processing: ${fileName}`);
      
      const content: any[] = [
        {
          type: "text",
          text: `Você é um especialista em OCR e extração de dados de exames laboratoriais.
          
TAREFA: Extraia TODOS os valores de exames laboratoriais desta imagem de forma estruturada.

FORMATO DE SAÍDA:
- Liste cada exame com seu valor e unidade
- Se houver valores de referência, inclua também
- Se algum valor estiver ilegível, indique: "[ILEGÍVEL - CONFERIR MANUALMENTE]"
- NÃO invente valores - se não conseguir ler, sinalize

EXEMPLO DE FORMATO:
Hemoglobina: 12.5 g/dL (Ref: 12-16)
Hematócrito: 38% (Ref: 36-44)
Ferritina: 45 ng/mL (Ref: 20-200)

Extraia agora os resultados da imagem:`
        },
        {
          type: "image_url",
          image_url: { url }
        }
      ];

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content
            }
          ],
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OCR error for ${fileName}:`, errorText);
        
        if (response.status === 429) {
          extractedTexts.push({
            fileName,
            text: "",
            success: false,
            error: "Limite de requisições excedido. Tente novamente em alguns segundos."
          });
          continue;
        }
        
        if (response.status === 402) {
          extractedTexts.push({
            fileName,
            text: "",
            success: false,
            error: "Créditos insuficientes. Adicione créditos ao workspace."
          });
          continue;
        }

        extractedTexts.push({
          fileName,
          text: "",
          success: false,
          error: `Erro ao processar imagem: ${response.status}`
        });
        continue;
      }

      const data = await response.json();
      const extractedText = data.choices?.[0]?.message?.content || "";
      
      console.log(`Extracted text from ${fileName}: ${extractedText.substring(0, 100)}...`);

      extractedTexts.push({
        fileName,
        text: extractedText,
        success: true
      });
    } catch (err) {
      console.error(`Error extracting from ${fileName}:`, err);
      extractedTexts.push({
        fileName,
        text: "",
        success: false,
        error: err instanceof Error ? err.message : "Erro desconhecido"
      });
    }
  }

  // Consolidate all extracted texts
  const successfulExtractions = extractedTexts.filter(e => e.success);
  const failedExtractions = extractedTexts.filter(e => !e.success);

  let consolidatedText = "";
  
  if (successfulExtractions.length > 0) {
    consolidatedText = successfulExtractions
      .map(e => `=== ${e.fileName} ===\n${e.text}`)
      .join("\n\n");
  }

  const warnings: string[] = [];
  if (failedExtractions.length > 0) {
    warnings.push(...failedExtractions.map(e => `${e.fileName}: ${e.error}`));
  }

  return new Response(JSON.stringify({ 
    extractedTexts,
    consolidatedText,
    warnings,
    totalFiles: imageUrls.length,
    successCount: successfulExtractions.length,
    failCount: failedExtractions.length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// NOVO: Formata o rawQuestionnaire como JSON puro com wrapper neutro
function formatRawQuestionnaireForAssistant(data: any): string {
  // Se já é o novo formato com mode/answers, usa diretamente
  if (data && data.mode === "TRIAGEM" && data.answers) {
    return `DADOS BRUTOS DO QUESTIONÁRIO (JSON):

${JSON.stringify(data, null, 2)}

INSTRUÇÕES:
- Você receberá um JSON de respostas do questionário acima.
- NÃO invente informações. Interprete SOMENTE o que está no JSON.
- Se faltar dado para concluir, marque como INDEFINIDO e solicite exames ou perguntas adicionais.
- Responda EXCLUSIVAMENTE em JSON seguindo o contrato abaixo.

CONTRATO DE RESPOSTA (JSON):
{
  "eligibility": {
    "overall_status": "APTO" | "APTO_COM_PREPARO" | "NAO_APTO" | "INDEFINIDO",
    "prp": { "status": "APTO" | "COM_RESSALVAS" | "CONTRAINDICADO", "notes": "..." },
    "prf": { "status": "APTO" | "COM_RESSALVAS" | "CONTRAINDICADO", "notes": "..." },
    "bmac": { "status": "APTO" | "COM_RESSALVAS" | "CONTRAINDICADO", "notes": "..." }
  },
  "key_reasons": ["motivo1", "motivo2"],
  "requested_exams": {
    "required": ["exame1", "exame2"],
    "optional": ["exame3"]
  },
  "next_steps": {
    "what_to_do_now": "Descrição do próximo passo",
    "timeline": "Prazo sugerido"
  }
}`;
  }

  // Fallback: formato antigo com blocos de perguntas
  // Converte para formato simplificado
  const flatAnswers: Record<string, boolean> = {};
  
  if (typeof data === 'object' && data !== null) {
    for (const [blockKey, questions] of Object.entries(data)) {
      if (typeof questions === 'object' && questions !== null) {
        for (const [question, answer] of Object.entries(questions as Record<string, boolean>)) {
          // Cria uma chave simplificada
          const simpleKey = question
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '_')
            .substring(0, 50);
          flatAnswers[simpleKey] = answer as boolean;
        }
      }
    }
  }

  const rawData = {
    mode: "TRIAGEM",
    answers: flatAnswers,
    provided_exams: []
  };

  return `DADOS BRUTOS DO QUESTIONÁRIO (JSON):

${JSON.stringify(rawData, null, 2)}

INSTRUÇÕES:
- Você receberá um JSON de respostas do questionário acima.
- NÃO invente informações. Interprete SOMENTE o que está no JSON.
- Se faltar dado para concluir, marque como INDEFINIDO e solicite exames ou perguntas adicionais.
- Responda EXCLUSIVAMENTE em JSON seguindo o contrato abaixo.

CONTRATO DE RESPOSTA (JSON):
{
  "eligibility": {
    "overall_status": "APTO" | "APTO_COM_PREPARO" | "NAO_APTO" | "INDEFINIDO",
    "prp": { "status": "APTO" | "COM_RESSALVAS" | "CONTRAINDICADO", "notes": "..." },
    "prf": { "status": "APTO" | "COM_RESSALVAS" | "CONTRAINDICADO", "notes": "..." },
    "bmac": { "status": "APTO" | "COM_RESSALVAS" | "CONTRAINDICADO", "notes": "..." }
  },
  "key_reasons": ["motivo1", "motivo2"],
  "requested_exams": {
    "required": ["exame1", "exame2"],
    "optional": ["exame3"]
  },
  "next_steps": {
    "what_to_do_now": "Descrição do próximo passo",
    "timeline": "Prazo sugerido"
  }
}`;
}

function formatLabResultsForAnalysis(labResults: any): string {
  let formatted = "RESULTADOS DE EXAMES LABORATORIAIS\n\n";
  formatted += "Analise os seguintes resultados e forneça:\n";
  formatted += "1. Resumo dos exames analisados\n";
  formatted += "2. Principais alterações identificadas\n";
  formatted += "3. Impacto biológico na resposta aos ortobiológicos\n";
  formatted += "4. Classificação final atualizada: APTO, APTO_COM_PREPARO, NAO_APTO, ou INDEFINIDO\n";
  formatted += "5. Recomendações gerais (não medicamentosas)\n";
  formatted += "6. Quando reavaliar / próximos passos\n\n";
  
  if (labResults.rawText) {
    formatted += "RESULTADOS:\n" + labResults.rawText;
  } else if (labResults.values) {
    formatted += "RESULTADOS:\n";
    for (const [exam, value] of Object.entries(labResults.values)) {
      formatted += `- ${exam}: ${value}\n`;
    }
  }
  
  if (labResults.extractedFromImages) {
    formatted += "\n\nRESULTADOS EXTRAÍDOS DE IMAGENS:\n" + labResults.extractedFromImages;
  }
  
  return formatted;
}

// Tenta parsear JSON estruturado da resposta
function parseStructuredResponse(text: string): any {
  try {
    // Tenta encontrar um bloco JSON na resposta
    const jsonMatch = text.match(/\{[\s\S]*"eligibility"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.eligibility) {
        return parsed;
      }
    }
  } catch (e) {
    console.log("Could not parse structured JSON from response, using fallback parsing");
  }
  
  // Tenta extrair JSON de blocos de código
  try {
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (parsed.eligibility) {
        return parsed;
      }
    }
  } catch (e) {
    console.log("Could not parse JSON from code block");
  }

  return null;
}

function parseClassification(text: string): string {
  const upperText = text.toUpperCase();
  if (upperText.includes("APTO_COM_PREPARO") || upperText.includes("APTO COM PREPARO")) {
    return "APTO_COM_PREPARO";
  } else if (upperText.includes("NAO_APTO") || upperText.includes("NÃO APTO") || upperText.includes("CONTRAINDICADO")) {
    return "NAO_APTO";
  } else if (upperText.includes("INDEFINIDO")) {
    return "INDEFINIDO";
  } else if (upperText.includes("APTO")) {
    return "APTO";
  }
  return "INDEFINIDO";
}

interface ExamGroup {
  axis: string;
  exams: string[];
  justification: string;
}

function parseRecommendedExams(text: string): ExamGroup[] {
  const examGroups: ExamGroup[] = [];
  
  // Try to find structured exam sections with [EIXO:] format
  const eixoPattern = /\[EIXO:\s*([^\]]+)\]([\s\S]*?)\[JUSTIFICATIVA:\s*([^\]]+)\]/gi;
  let match;
  
  while ((match = eixoPattern.exec(text)) !== null) {
    const axis = match[1].trim();
    const examsSection = match[2];
    const justification = match[3].trim();
    
    // Extract exam names from the section (lines starting with - or •)
    const examLines = examsSection.split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('-') || line.startsWith('•'))
      .map(line => line.replace(/^[-•]\s*/, '').trim())
      .filter(line => line.length > 0);
    
    if (examLines.length > 0) {
      examGroups.push({
        axis,
        exams: examLines,
        justification
      });
    }
  }
  
  console.log(`Exames extraídos: ${examGroups.length} grupos, total ${examGroups.reduce((acc, g) => acc + g.exams.length, 0)} exames`);
  
  return examGroups;
}

function parseOrientations(text: string): string {
  // Extract orientations section if present
  const orientationsMatch = text.match(/orient[aç]ões.*?(?=📌|$)/is);
  if (orientationsMatch) {
    return orientationsMatch[0];
  }
  return "";
}
