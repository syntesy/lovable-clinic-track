import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const assistantId = Deno.env.get('ASSISTANT_TRIAGEM_PRP_ID');
const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { questionnaireData, labResults, action, imageUrls } = await req.json();

    // Handle OCR/Vision extraction
    if (action === "extract_text") {
      return await handleTextExtraction(imageUrls);
    }

    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY não está configurada");
    }

    if (!assistantId) {
      throw new Error("ASSISTANT_TRIAGEM_PRP_ID não está configurado");
    }

    let userMessage = "";

    if (action === "questionnaire") {
      userMessage = formatQuestionnaireForAnalysis(questionnaireData);
    } else if (action === "lab_results") {
      userMessage = formatLabResultsForAnalysis(labResults);
    } else {
      throw new Error("Ação inválida. Use 'questionnaire', 'lab_results' ou 'extract_text'");
    }

    console.log("Creating thread...");
    
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

    // Parse classification from response
    const classification = parseClassification(analysisText);

    // Parse recommended exams
    const recommendedExams = parseRecommendedExams(analysisText);

    // Parse patient orientations
    const patientOrientations = parseOrientations(analysisText);

    return new Response(JSON.stringify({ 
      analysis: analysisText,
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

function formatQuestionnaireForAnalysis(data: Record<string, Record<string, boolean>>): string {
  const blockNames: Record<string, string> = {
    dorCicatrizacao: "DOR E CICATRIZAÇÃO",
    inflamacaoSistemica: "INFLAMAÇÃO SISTÊMICA",
    metabolismoEnergetico: "METABOLISMO ENERGÉTICO",
    ferroAnemia: "FERRO E ANEMIA",
    metabolismoGlicemico: "METABOLISMO GLICÊMICO",
    eixoHormonal: "EIXO HORMONAL",
    medicamentos: "USO DE MEDICAMENTOS",
    estiloVida: "ESTILO DE VIDA"
  };

  // Identify which axes have "SIM" responses (altered axes)
  const alteredAxes: string[] = [];
  for (const [blockKey, questions] of Object.entries(data)) {
    const hasYes = Object.values(questions).some(answer => answer === true);
    if (hasYes) {
      alteredAxes.push(blockNames[blockKey] || blockKey);
    }
  }

  let formatted = "QUESTIONÁRIO DE TRIAGEM BIOLÓGICA PRÉ-PRP\n\n";
  formatted += "INSTRUÇÕES OBRIGATÓRIAS PARA ANÁLISE:\n";
  formatted += "=".repeat(50) + "\n\n";
  
  formatted += "1. CLASSIFICAÇÃO (escolha UMA):\n";
  formatted += "   - APTO PARA ORTOBIOLÓGICO\n";
  formatted += "   - NÃO APTO AGORA – NECESSITA PREPARO BIOLÓGICO\n";
  formatted += "   - CONTRAINDICADO / ADIAR – NECESSITA AVALIAÇÃO MÉDICA\n\n";
  
  formatted += "2. RISCOS BIOLÓGICOS: Liste os riscos identificados baseados nas respostas SIM.\n\n";
  
  formatted += "3. EXAMES RECOMENDADOS - REGRA CRÍTICA:\n";
  formatted += "   ⚠️ PERSONALIZAÇÃO OBRIGATÓRIA: Solicite exames APENAS para eixos com respostas SIM.\n";
  formatted += "   ⚠️ Se um eixo tem APENAS respostas NÃO, NÃO solicite exames desse eixo.\n";
  formatted += "   ⚠️ Cada exame deve ter justificativa específica baseada nas respostas do paciente.\n\n";
  
  formatted += "   FORMATO OBRIGATÓRIO (use exatamente este formato):\n";
  formatted += "   [EIXO: NomeDo Eixo]\n";
  formatted += "   - NomeDoExame1\n";
  formatted += "   - NomeDoExame2\n";
  formatted += "   [JUSTIFICATIVA: Motivo específico baseado nas respostas SIM deste paciente]\n\n";
  
  if (alteredAxes.length > 0) {
    formatted += `   📋 EIXOS COM ALTERAÇÕES DETECTADAS: ${alteredAxes.join(", ")}\n`;
    formatted += "   Solicite exames APENAS para estes eixos acima.\n\n";
  } else {
    formatted += "   📋 NENHUM EIXO COM ALTERAÇÕES - Não solicite exames.\n\n";
  }
  
  formatted += "4. ORIENTAÇÕES AO PACIENTE: Recomendações alimentares, estilo de vida, preparo biológico.\n\n";
  formatted += "5. ALERTAS IMPORTANTES: Contraindicações, medicamentos a evitar, etc.\n\n";
  
  formatted += "=".repeat(50) + "\n";
  formatted += "RESPOSTAS DO QUESTIONÁRIO:\n";
  formatted += "=".repeat(50) + "\n";

  for (const [blockKey, questions] of Object.entries(data)) {
    const blockName = blockNames[blockKey] || blockKey;
    const hasYes = Object.values(questions).some(answer => answer === true);
    const statusIcon = hasYes ? "⚠️ ALTERADO" : "✅ NORMAL";
    
    formatted += `\n## ${blockName} [${statusIcon}]\n`;
    for (const [question, answer] of Object.entries(questions)) {
      const answerIcon = answer ? "🔴 SIM" : "⚪ NÃO";
      formatted += `- ${question}: ${answerIcon}\n`;
    }
  }
  
  formatted += "\n" + "=".repeat(50) + "\n";
  formatted += "LEMBRETE FINAL: Personalize 100% baseado nas respostas acima. Não use lista genérica.\n";
  
  return formatted;
}

function formatLabResultsForAnalysis(labResults: any): string {
  let formatted = "RESULTADOS DE EXAMES LABORATORIAIS\n\n";
  formatted += "Analise os seguintes resultados e forneça:\n";
  formatted += "1. Resumo dos exames analisados\n";
  formatted += "2. Principais alterações identificadas\n";
  formatted += "3. Impacto biológico na resposta aos ortobiológicos\n";
  formatted += "4. Classificação final atualizada: APTO PARA ORTOBIOLÓGICO, NÃO APTO AGORA – NECESSITA PREPARO BIOLÓGICO, ou CONTRAINDICADO / ADIAR\n";
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

function parseClassification(text: string): string {
  const upperText = text.toUpperCase();
  if (upperText.includes("APTO PARA ORTOBIOLÓGICO") || upperText.includes("APTO PARA PRP")) {
    return "APTO";
  } else if (upperText.includes("CONTRAINDICADO") || upperText.includes("ADIAR")) {
    return "CONTRAINDICADO";
  } else if (upperText.includes("NÃO APTO") || upperText.includes("NECESSITA PREPARO")) {
    return "NAO_APTO_PREPARO";
  }
  return "NAO_APTO_PREPARO";
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
  
  // Se não encontrou formato estruturado, tenta extrair de forma mais flexível
  // mas APENAS exames explicitamente mencionados, sem fallback genérico
  if (examGroups.length === 0) {
    console.log("Formato estruturado não encontrado, tentando extração flexível...");
    
    // Procura por padrões alternativos como "Exames:" ou listas com "-"
    const examSectionMatch = text.match(/(?:exames?\s+recomendados?|solicita[çr]\s+exames?)[\s:]+([^]*?)(?=orient|alert|conclus|$)/i);
    
    if (examSectionMatch) {
      const examSection = examSectionMatch[1];
      const lines = examSection.split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./))
        .map(line => line.replace(/^[-•\d.]\s*/, '').trim())
        .filter(line => line.length > 3 && !line.toLowerCase().includes('justificativa'));
      
      if (lines.length > 0) {
        examGroups.push({
          axis: "Exames Personalizados",
          exams: lines,
          justification: "Baseado na análise individual do questionário"
        });
      }
    }
  }
  
  // Log para debug - sem fallback genérico
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
