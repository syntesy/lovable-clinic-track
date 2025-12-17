import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const assistantId = Deno.env.get('ASSISTANT_TRIAGEM_PRP_ID');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { questionnaireData, labResults, action } = await req.json();

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
      throw new Error("Ação inválida. Use 'questionnaire' ou 'lab_results'");
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

  let formatted = "QUESTIONÁRIO DE TRIAGEM BIOLÓGICA PRÉ-PRP\n\n";
  formatted += "Analise as seguintes respostas e forneça:\n";
  formatted += "1. Classificação: APTO PARA ORTOBIOLÓGICO, NÃO APTO AGORA – NECESSITA PREPARO BIOLÓGICO, ou CONTRAINDICADO / ADIAR – NECESSITA AVALIAÇÃO MÉDICA\n";
  formatted += "2. Principais riscos biológicos identificados\n";
  formatted += "3. Lista de exames de sangue a serem solicitados (organizados por categoria)\n";
  formatted += "4. Orientações ao paciente (alimentares, estilo de vida, preparo biológico)\n";
  formatted += "5. Alertas importantes\n\n";
  formatted += "RESPOSTAS DO QUESTIONÁRIO:\n";

  for (const [blockKey, questions] of Object.entries(data)) {
    const blockName = blockNames[blockKey] || blockKey;
    formatted += `\n## ${blockName}\n`;
    for (const [question, answer] of Object.entries(questions)) {
      formatted += `- ${question}: ${answer ? "SIM" : "NÃO"}\n`;
    }
  }
  return formatted;
}

function formatLabResultsForAnalysis(labResults: any): string {
  let formatted = "RESULTADOS DE EXAMES LABORATORIAIS\n\n";
  formatted += "Analise os seguintes resultados e forneça:\n";
  formatted += "1. Interpretação de cada exame alterado\n";
  formatted += "2. Atualização da classificação: APTO PARA ORTOBIOLÓGICO, NÃO APTO AGORA – NECESSITA PREPARO BIOLÓGICO, ou CONTRAINDICADO / ADIAR\n";
  formatted += "3. Recomendações de suplementação ou correção se necessário\n";
  formatted += "4. Indicação se o paciente agora está APTO ou se deve continuar em PREPARO\n\n";
  
  if (labResults.rawText) {
    formatted += "RESULTADOS:\n" + labResults.rawText;
  } else if (labResults.values) {
    formatted += "RESULTADOS:\n";
    for (const [exam, value] of Object.entries(labResults.values)) {
      formatted += `- ${exam}: ${value}\n`;
    }
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

function parseRecommendedExams(text: string): string[] {
  const exams: string[] = [];
  const commonExams = [
    "Hemograma completo", "PCR", "VHS", "Ferritina", "Vitamina D",
    "Glicemia", "HbA1c", "Perfil lipídico", "TSH", "T3 livre", "T4 livre",
    "Magnésio", "Vitamina B12", "Insulina", "HOMA-IR", "Testosterona"
  ];
  
  for (const exam of commonExams) {
    if (text.toLowerCase().includes(exam.toLowerCase())) {
      exams.push(exam);
    }
  }
  
  return exams;
}

function parseOrientations(text: string): string {
  // Extract orientations section if present
  const orientationsMatch = text.match(/orient[aç]ões.*?(?=📌|$)/is);
  if (orientationsMatch) {
    return orientationsMatch[0];
  }
  return "";
}
