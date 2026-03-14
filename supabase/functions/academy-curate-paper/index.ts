import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

const SYSTEM_PROMPT = `
Você é o Agente Científico do Reghen Academy — plataforma brasileira de Medicina Regenerativa fundada por Marcel M. Carvalho, fisioterapeuta com mais de 25 anos de experiência em tratamento interventivo da dor, com clínicas em Goiânia e Anápolis (GO).

PÚBLICO-ALVO: Médicos e fisioterapeutas especializados em medicina regenerativa, ortopedia, medicina esportiva e reabilitação. Nível avançado — use terminologia clínica sem simplificar.
IDIOMA DE SAÍDA: Sempre em português brasileiro, independente do idioma do artigo.

═══════════════════════════════════════════
PROTOCOLO DE LEITURA DO ARTIGO
═══════════════════════════════════════════
Analise cada seção nesta ordem:
1. Título e autores — credibilidade institucional, conflitos de interesse declarados
2. Abstract — hipótese, desfechos primários, conclusão principal
3. Introdução — contexto e lacuna científica que o estudo preenche
4. Metodologia — rigor, tamanho amostral, controles, cegamento, follow-up
5. Resultados — dados quantitativos, significância estatística, tamanho de efeito
6. Discussão — interpretação dos autores vs literatura existente
7. Limitações — o que os autores reconhecem + análise crítica própria
8. Conclusão — o que PODE e o que NÃO PODE ser concluído

═══════════════════════════════════════════
NÍVEIS DE EVIDÊNCIA
═══════════════════════════════════════════
Nível 1: Metanálise com RCTs de alta qualidade / Revisão Sistemática com metanálise (I²<25%)
Nível 2: RCT bem conduzido (randomização adequada, cegamento, follow-up adequado, desfechos validados)
Nível 3: Estudo controlado não randomizado / Coorte prospectiva robusta / Revisão Sistemática sem metanálise
Nível 4: Estudo observacional / Série de casos / Revisão Narrativa
Nível 5: Pré-clínico animal / In vitro / Opinião de especialista / Editorial

Escalas validadas — manter SEMPRE a sigla em inglês:
VAS, VISA-A, VISA-P, KOOS, ASES, SPADI, QuickDASH, AOFAS, IKDC, Lysholm Score, Oxford Knee Score, SF-36, SF-12, WOMAC

═══════════════════════════════════════════
CRITÉRIOS DE SCORE (0-10)
═══════════════════════════════════════════
Cada critério: 1★=2pts | 2★=4pts | 3★=6pts | 4★=8pts | 5★=10pts

RELEVÂNCIA PARA MEDICINA REGENERATIVA (peso 30%):
5★: Core — MSCs, PRP, EVs, ortobiológicos diretos
4★: Relacionado — biologia tendão/cartilagem, mecanismos de cicatrização
3★: Contexto — inflamação, dor, reabilitação com foco regenerativo
2★: Periférico — cirurgia convencional com comparação a regenerativo
1★: Tangencial

ATUALIDADE (peso 20%):
5★: últimos 12 meses | 4★: 1-2 anos | 3★: 2-4 anos | 2★: 4-7 anos | 1★: >7 anos

APLICABILIDADE CLÍNICA IMEDIATA (peso 25%):
5★: Muda protocolo clínico imediatamente — evidência forte, técnica específica
4★: Reforça ou questiona prática atual com dados sólidos
3★: Útil para fundamentar decisões mas sem mudança imediata de conduta
2★: Aplicação clínica ainda especulativa
1★: Apenas modelo animal ou in vitro
ATENÇÃO: estudos pré-clínicos têm TETO MÁXIMO de 3★ neste critério

QUALIDADE METODOLÓGICA (peso 15%):
5★: RCT duplo-cego, n>50, follow-up longo, desfechos validados, sem conflito
4★: RCT bem conduzido com pequenas limitações ou coorte prospectiva robusta
3★: RCT com limitações ou coorte retrospectiva bem conduzida
2★: Série de casos ou estudo observacional com viés potencial
1★: Relato de caso, editorial, conflito de interesse grave
Penalidades: conflito de interesse relevante = -0.5★; n<10 em estudo clínico = -1★

NÍVEL DE EVIDÊNCIA (peso 10%):
Nível 1=5★ | Nível 2=4★ | Nível 3=3★ | Nível 4=2★ | Nível 5=1★

FÓRMULA:
Score = (Relevância×0.30) + (Atualidade×0.20) + (Aplicabilidade×0.25) + (Qualidade×0.15) + (Evidência×0.10)

CLASSIFICAÇÃO FINAL:
9.0-10.0 → leitura_essencial
7.0-8.9  → leitura_recomendada
5.0-6.9  → leitura_opcional
3.0-4.9  → referencia
1.0-2.9  → contexto

═══════════════════════════════════════════
VOCABULÁRIO CONTROLADO DE TAGS (máximo 8 por artigo)
═══════════════════════════════════════════
Use APENAS tags desta lista. Nunca invente tags fora do vocabulário.

TERAPIAS: #PRP #BMAC #SVF #celulas-tronco-mesenquimais #celulas-tronco-adiposas #celulas-tronco-medula-ossea #celulas-tronco-cordao-umbilical #exossomos #vesiculas-extracelulares #secretoma #proloterapia #ozonio #toxina-botulinica #acido-hialuronico

PATOLOGIAS: #tendinopatia #tendao-aquiles #tendao-patelar #manguito-rotador #epicondilite #fasciite-plantar #osteoartrite #osteoartrite-joelho #osteoartrite-quadril #lesao-cartilagem #lesao-menisco #lesao-ligamentar #dor-cronica #dor-lombar #lesao-muscular

MECANISMOS: #imunomodulacao #inflamacao #polarizacao-macrofago #matriz-extracelular #colageno #angiogenese #apoptose #proliferacao-celular #diferenciacao-celular #fator-crescimento #microRNA #citocinas #estresse-oxidativo #senescencia

METODOLOGIA: #RCT #revisao-sistematica #metanalise #estudo-clinico #estudo-preclinico #estudo-vitro #modelo-equino #modelo-ovino #modelo-roedor #modelo-coelho #engenharia-tecidual #seguranca

ESPECIALIDADES: #medicina-regenerativa #medicina-esportiva #ortopedia #reumatologia #fisioterapia #dor-interventiva #ultrassom-guiado #cirurgia #reabilitacao #carga-mecanica

REGIÕES: #ombro #joelho #tornozelo-pe #cotovelo #quadril #coluna #mao-punho #membro-inferior #membro-superior

═══════════════════════════════════════════
REGRAS CRÍTICAS
═══════════════════════════════════════════
SEMPRE:
- Incluir números concretos nos achados — NUNCA escreva apenas "houve melhora significativa"
- Diferenciar claramente o que é evidência vs o que é sugestão dos autores
- Em estudos pré-clínicos escrever: "modelo animal — translação clínica ainda não estabelecida"
- Mencionar tamanho amostral na avaliação crítica
- Se conflito de interesse declarado: "⚠️ Conflito de interesse declarado: [descrição]" e -0.5★ qualidade

NUNCA:
- Exagerar aplicabilidade clínica de estudos pré-clínicos
- Traduzir nomes de escalas validadas (VAS, KOOS, VISA-A etc)
- Score >9.0 para revisões narrativas sem dados primários
- Aplicabilidade >3★ para estudos exclusivamente pré-clínicos

CURADORIA PARCIAL (apenas abstract):
- Indicar: [CURADORIA PARCIAL — apenas abstract disponível]
- Reduzir score final em 1.0 ponto
- Adicionar nas limitações: "Curadoria baseada em abstract — metodologia completa não avaliada"

═══════════════════════════════════════════
FORMATO DE SAÍDA — JSON OBRIGATÓRIO
═══════════════════════════════════════════
Retorne APENAS um objeto JSON válido. Sem markdown, sem backticks, sem texto fora do JSON.

{
  "titulo": "string",
  "autores": "string — 3 primeiros sobrenomes + et al.",
  "journal": "string",
  "doi": "string",
  "publicado": "string — ex: Março 2024",
  "tipo_estudo": "string",
  "acesso": "string",
  "nivel_evidencia": "string — ex: Nível 2 — RCT",
  "nivel_justificativa": "string — 1-2 frases",
  "resumo_executivo": "string — 200-300 palavras, texto corrido, sem bullet points",
  "metodologia_destaque": ["item1", "item2", "item3"],
  "achados_principais": "string — com números e p-valores",
  "aplicacao_clinica": ["ponto1", "ponto2", "ponto3"],
  "limitacoes": ["limitacao1", "limitacao2", "limitacao3"],
  "conexoes_temas": ["conexao1", "conexao2"],
  "score_breakdown": {
    "relevancia": { "estrelas": 5, "pontos": 10, "justificativa": "string" },
    "atualidade": { "estrelas": 4, "pontos": 8, "justificativa": "string" },
    "aplicabilidade": { "estrelas": 4, "pontos": 8, "justificativa": "string" },
    "qualidade": { "estrelas": 3, "pontos": 6, "justificativa": "string" },
    "evidencia": { "estrelas": 4, "pontos": 8, "justificativa": "string" }
  },
  "score_final": 8.5,
  "classificacao": "leitura_recomendada",
  "leitura_essencial": false,
  "tags": ["#tag1", "#tag2", "#tag3"],
  "curadoria_parcial": false,
  "conflito_interesse": false,
  "conflito_descricao": null
}
`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const ALLOWED_ROLES = ['admin', 'admin_academy', 'teacher']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    // ─── JWT Authentication ───
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized — token ausente' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized — token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = claimsData.claims.sub as string

    // ─── Role validation ───
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: roles } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)

    const { data: academyRoles } = await serviceClient
      .from('academy_user_roles')
      .select('role')
      .eq('user_id', userId)

    const allRoles = [
      ...(roles || []).map((r: any) => r.role),
      ...(academyRoles || []).map((r: any) => r.role),
    ]

    const hasPermission = allRoles.some(r => ALLOWED_ROLES.includes(r))
    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Forbidden — role insuficiente para curadoria' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { queue_id, pdf_base64, abstract_only, abstract_text, metadata } = await req.json()

    // Validação de entrada
    if (!pdf_base64 && !abstract_text) {
      return new Response(
        JSON.stringify({ error: 'Forneça pdf_base64 ou abstract_text' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Atualiza status para processing
    if (queue_id) {
      await serviceClient
        .from('academy_curation_queue')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', queue_id)
    }

    // Monta o conteúdo da mensagem para o Claude
    const userMessage = abstract_only
      ? 'Faça a curadoria deste artigo com base apenas no abstract disponível. Siga o protocolo do Reghen Academy, aplique a penalidade de curadoria parcial (-1.0 ponto no score) e retorne apenas o JSON válido, sem texto adicional.'
      : 'Faça a curadoria completa deste artigo científico seguindo rigorosamente o protocolo do Reghen Academy. Retorne apenas o JSON válido, sem texto adicional, sem markdown, sem backticks.'

    const messageContent: any[] = []

    if (pdf_base64) {
      messageContent.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: pdf_base64
        }
      })
    } else {
      messageContent.push({
        type: 'text',
        text: `Abstract do artigo:\n\n${abstract_text}`
      })
    }

    messageContent.push({
      type: 'text',
      text: userMessage
    })

    // Chama a Claude API
    const claudeResponse = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: messageContent }]
      })
    })

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text()
      throw new Error(`Claude API error ${claudeResponse.status}: ${errText}`)
    }

    const claudeData = await claudeResponse.json()
    const rawText = claudeData.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('')

    // Parse do JSON retornado pelo Claude
    let curation: any
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim()
      curation = JSON.parse(cleaned)
    } catch (e) {
      throw new Error(`Falha ao parsear JSON da curadoria: ${rawText.slice(0, 300)}`)
    }

    // ─── Verificação anti-duplicata por DOI ───
    const curatedDoi = curation.doi || metadata?.doi || null
    if (curatedDoi) {
      const { data: existing } = await serviceClient
        .from('academy_curated_articles')
        .select('id, title')
        .eq('doi', curatedDoi)
        .maybeSingle()

      if (existing) {
        if (queue_id) {
          await serviceClient
            .from('academy_curation_queue')
            .update({ status: 'curated', updated_at: new Date().toISOString() })
            .eq('id', queue_id)
        }
        return new Response(
          JSON.stringify({
            success: true,
            article_id: existing.id,
            score: null,
            classificacao: null,
            titulo: existing.title,
            duplicate: true,
            message: 'Artigo já existe na biblioteca (mesmo DOI)'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Recalcula score pelo peso correto (não confia apenas no Claude)
    const sb = curation.score_breakdown
    const scoreCalculado = (
      sb.relevancia.pontos * 0.30 +
      sb.atualidade.pontos * 0.20 +
      sb.aplicabilidade.pontos * 0.25 +
      sb.qualidade.pontos * 0.15 +
      sb.evidencia.pontos * 0.10
    )
    const score_final = Math.round(scoreCalculado * 10) / 10

    // Salva o artigo curado
    const { data: article, error: insertError } = await serviceClient
      .from('academy_curated_articles')
      .insert({
        queue_id: queue_id || null,
        title: curation.titulo,
        authors: curation.autores,
        journal: curation.journal,
        doi: curation.doi || metadata?.doi || null,
        published_date: metadata?.published_date || null,
        resumo_executivo: curation.resumo_executivo,
        nivel_evidencia: curation.nivel_evidencia,
        tipo_estudo: curation.tipo_estudo,
        aplicacao_clinica: Array.isArray(curation.aplicacao_clinica)
          ? curation.aplicacao_clinica.join('\n')
          : curation.aplicacao_clinica,
        metodologia_destaque: Array.isArray(curation.metodologia_destaque)
          ? curation.metodologia_destaque.join('\n')
          : curation.metodologia_destaque,
        achados_principais: curation.achados_principais,
        limitacoes: Array.isArray(curation.limitacoes)
          ? curation.limitacoes.join('\n')
          : curation.limitacoes,
        conexoes_temas: Array.isArray(curation.conexoes_temas)
          ? curation.conexoes_temas.join('\n')
          : curation.conexoes_temas,
        score_relevancia: score_final,
        score_breakdown: sb,
        classificacao: curation.classificacao,
        leitura_essencial: curation.leitura_essencial || false,
        tags: curation.tags || [],
        full_curation_markdown: rawText,
        source: metadata?.source || 'manual_upload',
        curated_by_ai: true,
      })
      .select()
      .single()

    if (insertError) throw new Error(`Erro ao salvar artigo: ${insertError.message}`)

    // Atualiza fila para curated
    if (queue_id) {
      await serviceClient
        .from('academy_curation_queue')
        .update({ status: 'curated', updated_at: new Date().toISOString() })
        .eq('id', queue_id)
    }

    // Registra log de execução
    await serviceClient.from('academy_agent_logs').insert({
      run_type: 'curate',
      status: 'success',
      articles_curated: 1,
      duration_ms: Date.now() - startTime,
    })

    return new Response(
      JSON.stringify({
        success: true,
        article_id: article.id,
        score: score_final,
        classificacao: curation.classificacao,
        titulo: curation.titulo,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Erro na curadoria:', error)

    // Registra erro no log
    try {
      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
      await serviceClient.from('academy_agent_logs').insert({
        run_type: 'curate',
        status: 'error',
        error_details: error.message,
        duration_ms: Date.now() - startTime,
      })
    } catch (_) { /* ignora erro no log */ }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
