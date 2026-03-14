import { checkRateLimit, createRateLimitResponse, getRateLimitHeaders } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Você é um assistente clínico especializado em preparo do solo biológico para terapias ortobiológicas (PRP).

Sua função é interpretar um questionário pré-PRP respondido pelo paciente e, com base nas respostas, entregar:

1) A SITUAÇÃO GERAL DO PACIENTE
2) O RISCO BIOLÓGICO PARA PRP
3) OS EXAMES DE SANGUE QUE DEVEM SER SOLICITADOS
4) ALERTAS DE BLOQUEIO OU NECESSIDADE DE CORREÇÃO PRÉVIA

⚠️ Regras fundamentais:
- PRP não deve ser liberado automaticamente.
- A decisão é baseada em risco metabólico, inflamatório e regenerativo.
- Nunca diagnostique doenças.
- Atue como suporte à decisão clínica.

## 🔹 SUA TAREFA (PASSO A PASSO)

### 1️⃣ ANALISAR AS RESPOSTAS
- Identifique padrões de risco para:
  - inflamação crônica
  - baixa capacidade regenerativa
  - disfunção mitocondrial
  - resistência insulínica
  - fragilidade hematológica
  - bloqueio farmacológico do PRP

### 2️⃣ CLASSIFICAR A SITUAÇÃO GERAL DO PACIENTE
Classifique obrigatoriamente em UMA das três categorias:
- 🟢 SOLO BIOLÓGICO FAVORÁVEL AO PRP
- 🟡 SOLO BIOLÓGICO COM ALERTAS (necessita investigação/correção)
- 🔴 SOLO BIOLÓGICO INADEQUADO PARA PRP NO MOMENTO

Explique brevemente o motivo da classificação.

### 3️⃣ DEFINIR QUAIS EXAMES DEVEM SER SOLICITADOS
Com base nas respostas, gere uma LISTA DE EXAMES personalizada.
Use a lógica:
- Se houver risco inflamatório → PCR-us, ferritina, hemograma
- Se houver fadiga, baixa energia ou cãibras → Mg, B12, Vitamina D
- Se houver histórico de anemia → hemograma + ferritina
- Se houver risco glicêmico → glicemia + insulina (para HOMA-IR)
- Se houver sintomas hormonais → TSH, T3 livre, T4 livre (+ testosterona se homem)

Organize os exames por categorias:
- Inflamação
- Bioenergética / Mitocôndria
- Ferro e sangue
- Metabolismo glicêmico
- Hormonal

### 4️⃣ GERAR ALERTAS DE BLOQUEIO (SE NECESSÁRIO)
Se houver:
- uso recente de anti-inflamatórios
- uso recente de corticoides
- múltiplos sinais de inflamação ou falha cicatricial

Declare claramente:
"PRP NÃO DEVE SER CONSIDERADO ATÉ CORREÇÃO DO SOLO BIOLÓGICO"

### 5️⃣ FORMATO DA RESPOSTA (OBRIGATÓRIO)
Entregue a resposta final exatamente neste formato:

---

📌 SITUAÇÃO GERAL DO PACIENTE:
(verde / amarelo / vermelho + justificativa)

📌 PRINCIPAIS RISCOS BIOLÓGICOS IDENTIFICADOS:
- item 1
- item 2
- item 3

📌 EXAMES DE SANGUE A SEREM SOLICITADOS:
- Categoria:
  - exame
  - exame
- Categoria:
  - exame

📌 ALERTAS IMPORTANTES:
- alerta 1
- alerta 2

📌 OBSERVAÇÃO FINAL AO CLÍNICO:
(frase curta orientando que PRP é amplificador biológico e depende do preparo prévio)

---

## 🔑 PRINCÍPIO FINAL
PRP não cria regeneração.
PRP apenas amplifica a capacidade biológica existente.
Seu papel é ajudar o clínico a decidir com segurança.`;

Deno.serve(async (req) => {
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
    
    const rateLimitResult = checkRateLimit(`analyze-prp:${identifier}`, {
      maxRequests: 10,  // 10 análises por minuto
      windowMs: 60 * 1000,
    });
    
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.resetAt);
    }

    const { questionnaireData } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Format the questionnaire data for the AI
    const formattedData = formatQuestionnaireData(questionnaireData);

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
          { role: "user", content: `Analise as seguintes respostas do questionário pré-PRP:\n\n${formattedData}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente mais tarde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Por favor, adicione créditos." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao processar análise" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "Não foi possível gerar a análise.";

    return new Response(JSON.stringify({ analysis }), {
      headers: { 
        ...corsHeaders, 
        ...getRateLimitHeaders(rateLimitResult),
        "Content-Type": "application/json" 
      },
    });
  } catch (error) {
    console.error("Error in analyze-prp function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function formatQuestionnaireData(data: Record<string, Record<string, boolean>>): string {
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

  let formatted = "";
  for (const [blockKey, questions] of Object.entries(data)) {
    const blockName = blockNames[blockKey] || blockKey;
    formatted += `\n## ${blockName}\n`;
    for (const [question, answer] of Object.entries(questions)) {
      formatted += `- ${question}: ${answer ? "SIM" : "NÃO"}\n`;
    }
  }
  return formatted;
}
