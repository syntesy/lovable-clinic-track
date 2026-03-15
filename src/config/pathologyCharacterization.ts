/**
 * Pathology Scientific Characterization System
 *
 * Metadata-driven profiles for 4 pathology families:
 * - Osteoarthritis (Kellgren–Lawrence)
 * - Tendinopathy (Cook & Purdam Continuum)
 * - Muscle Injury (Munich Consensus)
 * - Neuropathy (Seddon Classification)
 *
 * Resolution is fuzzy: normalizes labels/codes to match keywords.
 * No DB tables — all config is in TypeScript.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface CharacterizationOption {
  value: string;
  label: string;
  /** Scientific reference / classification mapping shown in report */
  scientificMapping: string;
  scoringHint?: {
    text: string;
    type: 'favorable' | 'conditional' | 'adverse';
  };
}

export interface CharacterizationField {
  key: string;
  label: string;
  description?: string;
  /** Shown in tooltip next to field label */
  tooltipText?: string;
  required: boolean;
  /** If true, field is hidden behind "Detalhamento científico" collapse */
  advancedOnly?: boolean;
  options: CharacterizationOption[];
}

export interface PathologyCharacterizationProfile {
  id: string;
  name: string;
  /** Scientific protocol name (shown in badge) */
  protocol: string;
  /** Full bibliographic reference (shown in tooltip) */
  protocolReference: string;
  characterizationVersion: string;
  fields: CharacterizationField[];
  /** Keywords matched against pathology label/code (normalized, Portuguese) */
  keywords: string[];
  /** Keywords matched against category label/code */
  categoryKeywords: string[];
}

export interface CharacterizationJson {
  protocol: string;
  protocol_reference: string;
  characterization_version: string;
  fields: Array<{
    key: string;
    label: string;
    value: string;
    scientific_mapping: string;
  }>;
  summary: string;
}

// =============================================================================
// PROFILES
// =============================================================================

const OSTEOARTHRITIS_PROFILE: PathologyCharacterizationProfile = {
  id: 'osteoarthritis',
  name: 'Osteoartrite',
  protocol: 'Kellgren–Lawrence',
  protocolReference: 'Kellgren & Lawrence, Annals of the Rheumatic Diseases, 1957',
  characterizationVersion: '1.0',
  keywords: ['artrose', 'osteoartrite', 'osteoarthritis', 'artrite degenerativa', 'gonartrose', 'coxartrose'],
  categoryKeywords: ['articular', 'articulacao', 'joint'],
  fields: [
    {
      key: 'kl_severity',
      label: 'Severidade Clínica',
      description: 'Classificação funcional da osteoartrite para fins de elegibilidade ortobiológica',
      tooltipText: 'Baseada nos critérios de Kellgren–Lawrence adaptados para uso clínico. Correlaciona grau radiológico com potencial de resposta ao tratamento.',
      required: true,
      options: [
        {
          value: 'leve',
          label: 'Leve',
          scientificMapping: 'Kellgren–Lawrence Grau 1–2',
          scoringHint: { text: 'Melhor resposta ao tratamento conservador. Excelente candidato para ortobiológicos.', type: 'favorable' },
        },
        {
          value: 'moderada',
          label: 'Moderada',
          scientificMapping: 'Kellgren–Lawrence Grau 3',
          scoringHint: { text: 'Resposta variável. Ortobiológicos podem retardar a progressão da degeneração articular.', type: 'conditional' },
        },
        {
          value: 'grave',
          label: 'Grave',
          scientificMapping: 'Kellgren–Lawrence Grau 4',
          scoringHint: { text: 'Articulação avançada. Avaliar indicação cirúrgica antes de ortobiológicos.', type: 'adverse' },
        },
      ],
    },
    {
      key: 'cartilage_involvement',
      label: 'Envolvimento Cartilaginoso',
      description: 'Estimativa do comprometimento da cartilagem articular por imagem',
      tooltipText: 'Estimado por RM ou RX. Correlaciona com prognóstico de resposta a ortobiológicos.',
      required: false,
      advancedOnly: true,
      options: [
        {
          value: 'preserved',
          label: 'Preservada',
          scientificMapping: 'Integridade cartilaginosa mantida (ICRS Grau 0–I)',
          scoringHint: { text: 'Favorece resposta regenerativa com ortobiológicos.', type: 'favorable' },
        },
        {
          value: 'partial',
          label: 'Parcial',
          scientificMapping: 'Perda parcial de espessura (ICRS Grau II–III, < 50%)',
          scoringHint: { text: 'Resposta possível dependendo do grau e da articulação.', type: 'conditional' },
        },
        {
          value: 'severe',
          label: 'Grave (Osso-Osso)',
          scientificMapping: 'Perda total de cartilagem, contato ósseo (ICRS Grau IV)',
          scoringHint: { text: 'Baixo potencial regenerativo. Discutir alternativas cirúrgicas.', type: 'adverse' },
        },
      ],
    },
  ],
};

const TENDINOPATHY_PROFILE: PathologyCharacterizationProfile = {
  id: 'tendinopathy',
  name: 'Tendinopatia',
  protocol: 'Continuum de Cook & Purdam',
  protocolReference: 'Cook & Purdam, British Journal of Sports Medicine, 2009',
  characterizationVersion: '1.0',
  keywords: ['tendinopat', 'tendinit', 'tendao', 'tendinose', 'tendinopatia', 'epicondilite', 'fasciite'],
  categoryKeywords: ['tendao', 'tendinoso', 'musculotendinoso'],
  fields: [
    {
      key: 'tendinopathy_stage',
      label: 'Estágio da Tendinopatia',
      description: 'Estágio segundo o Modelo Continuum de Cook & Purdam (2009)',
      tooltipText: 'O Modelo Continuum descreve a progressão patológica do tendão em 3 estágios com implicações diretas no tratamento.',
      required: true,
      options: [
        {
          value: 'reactive',
          label: 'Reativa',
          scientificMapping: 'Reactive Tendinopathy (Cook & Purdam Stage 1) — resposta adaptativa aguda',
          scoringHint: { text: 'Fase aguda/subaguda. Excelente resposta ao repouso e fisioterapia. Ortobiológicos raramente indicados.', type: 'favorable' },
        },
        {
          value: 'disrepair',
          label: 'Desorganização (Mista)',
          scientificMapping: 'Tendon Disrepair (Cook & Purdam Stage 2) — falha reparativa',
          scoringHint: { text: 'Fase intermediária com desorganização matricial. Ortobiológicos podem modular a progressão.', type: 'conditional' },
        },
        {
          value: 'degenerative',
          label: 'Degenerativa',
          scientificMapping: 'Degenerative Tendinopathy (Cook & Purdam Stage 3) — degeneração celular avançada',
          scoringHint: { text: 'Fase crônica com degeneração estrutural estabelecida. Maior indicação para ortobiológicos.', type: 'conditional' },
        },
      ],
    },
    {
      key: 'tendon_load_tolerance',
      label: 'Tolerância à Carga',
      description: 'Capacidade funcional de tolerância à carga mecânica progressiva',
      tooltipText: 'Avalia a resposta do tendão sob esforço mecânico — orienta protocolo de reabilitação e prognóstico de retorno.',
      required: false,
      advancedOnly: true,
      options: [
        {
          value: 'good',
          label: 'Boa (> 80%)',
          scientificMapping: 'Alta tolerância à carga — função preservada',
          scoringHint: { text: 'Favorece retorno esportivo mais precoce.', type: 'favorable' },
        },
        {
          value: 'moderate',
          label: 'Moderada (40–80%)',
          scientificMapping: 'Tolerância reduzida à carga — função parcialmente comprometida',
          scoringHint: { text: 'Progressão gradual de carga recomendada antes do retorno esportivo.', type: 'conditional' },
        },
        {
          value: 'poor',
          label: 'Baixa (< 40%)',
          scientificMapping: 'Grave intolerância à carga — risco de ruptura',
          scoringHint: { text: 'Risco de progressão para ruptura. Ortobiológicos antes de carga progressiva.', type: 'adverse' },
        },
      ],
    },
  ],
};

const MUSCLE_INJURY_PROFILE: PathologyCharacterizationProfile = {
  id: 'muscle_injury',
  name: 'Lesão Muscular',
  protocol: 'Munich Consensus',
  protocolReference: 'Mueller-Wohlfahrt et al., British Journal of Sports Medicine, 2013',
  characterizationVersion: '1.0',
  keywords: ['lesao muscular', 'distensao', 'ruptura muscular', 'strain muscular', 'fibra muscular', 'contusao muscular', 'musculo'],
  categoryKeywords: ['muscular', 'musculo'],
  fields: [
    {
      key: 'muscle_injury_grade',
      label: 'Grau da Lesão Muscular',
      description: 'Classificação segundo o Consenso de Munique (2013)',
      tooltipText: 'O Consenso de Munique estratifica lesões musculares em tipos funcionais (Graus 1–2) e estruturais (Graus 3–4), com implicações no retorno esportivo.',
      required: true,
      options: [
        {
          value: 'grade_1',
          label: 'Grau 1 – Funcional Leve',
          scientificMapping: 'Munich Consensus Type 1: Minor functional muscle disorder',
          scoringHint: { text: 'Lesão funcional sem dano estrutural. Recuperação em 7–14 dias com conservador.', type: 'favorable' },
        },
        {
          value: 'grade_2',
          label: 'Grau 2/3 – Estrutural Moderado',
          scientificMapping: 'Munich Consensus Type 2–3: Moderate structural muscle injury (partial tear)',
          scoringHint: { text: 'Ruptura parcial de fibras. Ortobiológicos podem acelerar a recuperação estrutural.', type: 'conditional' },
        },
        {
          value: 'grade_3',
          label: 'Grau 4 – Estrutural Grave',
          scientificMapping: 'Munich Consensus Type 4: Severe structural muscle injury (subtotal / complete rupture)',
          scoringHint: { text: 'Ruptura total ou subtotal. Avaliar intervenção cirúrgica antes de ortobiológicos.', type: 'adverse' },
        },
      ],
    },
    {
      key: 'muscle_location',
      label: 'Região Acometida',
      description: 'Localização anatômica da lesão no músculo',
      tooltipText: 'A localização influencia vascularização local, protocolo de reabilitação e prognóstico de recuperação.',
      required: false,
      advancedOnly: true,
      options: [
        {
          value: 'proximal',
          label: 'Proximal (Origem)',
          scientificMapping: 'Lesão na região de origem muscular — menor vascularização',
          scoringHint: { text: 'Região de menor vascularização. Pode requerer imobilização mais prolongada.', type: 'conditional' },
        },
        {
          value: 'belly',
          label: 'Ventre Muscular',
          scientificMapping: 'Lesão no ventre muscular — máxima vascularização',
          scoringHint: { text: 'Melhor vascularização. Excelente resposta a ortobiológicos nesta região.', type: 'favorable' },
        },
        {
          value: 'distal',
          label: 'Distal (Inserção)',
          scientificMapping: 'Lesão na junção musculotendinosa distal — transição tecidual',
          scoringHint: { text: 'Região de transição musculotendinosa. Recuperação mais lenta e maior risco de re-lesão.', type: 'conditional' },
        },
      ],
    },
  ],
};

const NEUROPATHY_PROFILE: PathologyCharacterizationProfile = {
  id: 'neuropathy',
  name: 'Neuropatia',
  protocol: 'Classificação de Seddon',
  protocolReference: 'Seddon, Brain, 1943 / Sunderland, Brain, 1951',
  characterizationVersion: '1.0',
  keywords: ['neuropati', 'neuralgia', 'compressao nervosa', 'sindrome compressiva', 'nervo', 'neural'],
  categoryKeywords: ['nervoso', 'neural', 'neurologico'],
  fields: [
    {
      key: 'neuropathy_severity',
      label: 'Grau da Lesão Neural',
      description: 'Classificação segundo Seddon (adaptada para uso clínico)',
      tooltipText: 'A Classificação de Seddon estratifica o dano axonal e o potencial de recuperação espontânea, orientando a indicação de intervenção.',
      required: true,
      options: [
        {
          value: 'neuropraxia',
          label: 'Leve (Neuropraxia)',
          scientificMapping: 'Seddon Grade I: Neuropraxia — bloqueio de condução sem dano axonal',
          scoringHint: { text: 'Recuperação espontânea esperada em semanas. Excelente prognóstico sem intervenção cirúrgica.', type: 'favorable' },
        },
        {
          value: 'axonotmesis',
          label: 'Moderada (Axonotmese)',
          scientificMapping: 'Seddon Grade II: Axonotmesis — lesão axonal com bainha de mielina intacta',
          scoringHint: { text: 'Recuperação possível em meses. Ortobiológicos podem modular neuroinflamação e acelerar regeneração axonal.', type: 'conditional' },
        },
        {
          value: 'neurotmesis',
          label: 'Grave (Neurotmese)',
          scientificMapping: 'Seddon Grade III: Neurotmesis — secção completa do nervo',
          scoringHint: { text: 'Recuperação espontânea improvável. Avaliar intervenção cirúrgica de reconstrução nervosa.', type: 'adverse' },
        },
      ],
    },
    {
      key: 'neuropathy_type',
      label: 'Mecanismo da Lesão',
      description: 'Mecanismo predominante do comprometimento neural',
      tooltipText: 'Diferencia compressão crônica de traumatismo agudo ou causa sistêmica, orientando a abordagem terapêutica prioritária.',
      required: false,
      advancedOnly: true,
      options: [
        {
          value: 'compressive',
          label: 'Compressiva (Crônica)',
          scientificMapping: 'Chronic nerve compression syndrome — pressão mecânica sustentada',
          scoringHint: { text: 'Descompressão precoce é a intervenção prioritária. Ortobiológicos como adjuvante.', type: 'conditional' },
        },
        {
          value: 'traumatic',
          label: 'Traumática (Aguda)',
          scientificMapping: 'Acute traumatic nerve injury — trauma direto ou tração',
          scoringHint: { text: 'Avaliar estabilização estrutural antes de ortobiológicos.', type: 'conditional' },
        },
        {
          value: 'metabolic',
          label: 'Metabólica / Sistêmica',
          scientificMapping: 'Metabolic peripheral neuropathy — causa sistêmica (DM, carências, etc.)',
          scoringHint: { text: 'Tratamento da causa base é prioritário. Ortobiológicos como suporte sintomático.', type: 'adverse' },
        },
      ],
    },
  ],
};

// =============================================================================
// REGISTRY
// =============================================================================

export const ALL_PROFILES: PathologyCharacterizationProfile[] = [
  OSTEOARTHRITIS_PROFILE,
  TENDINOPATHY_PROFILE,
  MUSCLE_INJURY_PROFILE,
  NEUROPATHY_PROFILE,
];

// =============================================================================
// FUZZY RESOLUTION
// =============================================================================

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolves a pathology characterization profile by fuzzy-matching labels/codes.
 * Returns null if no profile matches.
 */
export function resolveCharacterizationProfile(
  pathologyCode?: string | null,
  categoryCode?: string | null,
  pathologyLabel?: string | null,
  categoryLabel?: string | null,
): PathologyCharacterizationProfile | null {
  const tokens = [
    normalize(pathologyCode || ''),
    normalize(categoryCode || ''),
    normalize(pathologyLabel || ''),
    normalize(categoryLabel || ''),
  ].join(' ');

  if (!tokens.trim()) return null;

  for (const profile of ALL_PROFILES) {
    const allKeywords = [...profile.keywords, ...profile.categoryKeywords];
    const match = allKeywords.some(kw => tokens.includes(normalize(kw)));
    if (match) return profile;
  }

  return null;
}

// =============================================================================
// JSON BUILD / HYDRATE
// =============================================================================

/**
 * Builds the CharacterizationJson payload from a profile + current values.
 * Returns null if no fields are filled.
 */
export function buildCharacterizationJson(
  profile: PathologyCharacterizationProfile,
  values: Record<string, string>,
): CharacterizationJson | null {
  const filledFields = profile.fields
    .filter(f => values[f.key])
    .map(f => {
      const option = f.options.find(o => o.value === values[f.key]);
      return {
        key: f.key,
        label: f.label,
        value: values[f.key],
        scientific_mapping: option?.scientificMapping || values[f.key],
      };
    });

  if (filledFields.length === 0) return null;

  const summary = filledFields.map(f => `${f.label}: ${f.value}`).join(' | ');

  return {
    protocol: profile.protocol,
    protocol_reference: profile.protocolReference,
    characterization_version: profile.characterizationVersion,
    fields: filledFields,
    summary,
  };
}

/**
 * Hydrates characterizationValues Record<string, string> from persisted JSON.
 */
export function hydrateCharacterizationValues(
  json: CharacterizationJson | null | undefined,
): Record<string, string> {
  if (!json?.fields) return {};
  return Object.fromEntries(json.fields.map(f => [f.key, f.value]));
}
