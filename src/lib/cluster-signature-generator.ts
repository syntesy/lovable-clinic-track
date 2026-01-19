/**
 * Cluster Key and Protocol Signature Generator
 * 
 * Generates deterministic keys for grouping comparable cases
 * Uses only enum values (no free text)
 */

interface ClusterKeyInput {
  procedure_type: string;
  anatomic_region: string;
  pathology: string;
  severity_classification: string;
  specific_location?: string | null;
  prp_with_hyaluronic_acid: boolean;
}

interface ProtocolSignatureInput {
  sessions_count: string;
  sessions_interval?: string | null;
  volume_per_session_range: string;
  imaging_guidance: string;
  prp_type: string;
  prp_activation: string;
  recent_nsaid_use: string;
  shockwave_therapy: string;
  epi_associated: boolean;
}

/**
 * Generates cluster_key for grouping comparable clinical cases
 * 
 * Format: {PROCEDURE}|{REGION}|{PATHOLOGY}|{SEVERITY}|{LOCATION?}|HA:{YES/NO}
 * 
 * Example: PRP|JOELHO|ARTROSE|KL2|HA:NAO
 */
export function generateClusterKey(input: ClusterKeyInput): string {
  const parts: string[] = [
    (input.procedure_type || 'UNKNOWN').toUpperCase(),
    (input.anatomic_region || 'UNKNOWN').toUpperCase(),
    (input.pathology || 'UNKNOWN').toUpperCase(),
    (input.severity_classification || 'UNKNOWN').toUpperCase(),
  ];

  // Add specific location for spine procedures
  if (input.specific_location) {
    parts.push(input.specific_location.toUpperCase());
  }

  // Add HA indicator
  parts.push(`HA:${input.prp_with_hyaluronic_acid ? 'SIM' : 'NAO'}`);

  return parts.join('|');
}

/**
 * Generates protocol_signature for grouping similar protocols
 * 
 * Format: S:{sessions}|INT:{interval}|VOL:{volume}|GUIDE:{guidance}|TYPE:{prp_type}|ACT:{activation}|AINE:{nsaid}|CHOQUE:{shockwave}|EPI:{epi}
 * 
 * Example: S:3|INT:1-2s|VOL:4-6|GUIDE:US|TYPE:LR|ACT:SIM|AINE:NAO|CHOQUE:none|EPI:NAO
 */
export function generateProtocolSignature(input: ProtocolSignatureInput): string {
  const parts: string[] = [
    `S:${input.sessions_count || '?'}`,
    `INT:${input.sessions_interval || 'N/A'}`,
    `VOL:${shortenVolume(input.volume_per_session_range)}`,
    `GUIDE:${shortenGuidance(input.imaging_guidance)}`,
    `TYPE:${shortenPRPType(input.prp_type)}`,
    `ACT:${input.prp_activation === 'ativado' ? 'SIM' : 'NAO'}`,
    `AINE:${input.recent_nsaid_use === 'nao' ? 'NAO' : 'SIM'}`,
    `CHOQUE:${input.shockwave_therapy || 'none'}`,
    `EPI:${input.epi_associated ? 'SIM' : 'NAO'}`,
  ];

  return parts.join('|');
}

// Helper functions to shorten values
function shortenVolume(volume: string): string {
  if (!volume) return '?';
  if (volume.includes('1-3')) return '1-3';
  if (volume.includes('4-6')) return '4-6';
  if (volume.includes('7-10')) return '7-10';
  if (volume.includes('>10')) return '>10';
  return volume;
}

function shortenGuidance(guidance: string): string {
  if (!guidance) return '?';
  if (guidance.includes('ultrassonografia')) return 'US';
  if (guidance.includes('radioscopia')) return 'RX';
  if (guidance.includes('tomografia')) return 'TC';
  if (guidance.includes('sem_guia')) return 'NONE';
  return guidance.toUpperCase().slice(0, 4);
}

function shortenPRPType(type: string): string {
  if (!type) return '?';
  if (type.includes('lp_prp')) return 'LP';
  if (type.includes('lr_prp')) return 'LR';
  if (type.includes('desconhecido')) return 'DESC';
  return type.toUpperCase().slice(0, 4);
}

/**
 * Human-readable label for cluster key
 */
export function humanReadableClusterKey(clusterKey: string): string {
  if (!clusterKey) return 'Não definido';
  
  const labelMap: Record<string, string> = {
    'PRP': 'PRP',
    'JOELHO': 'Joelho',
    'OMBRO': 'Ombro',
    'QUADRIL': 'Quadril',
    'COTOVELO': 'Cotovelo',
    'COLUNA_CERVICAL': 'Coluna Cervical',
    'COLUNA_LOMBAR': 'Coluna Lombar',
    'ARTROSE': 'Artrose',
    'TENDINOPATIA': 'Tendinopatia',
    'LESAO_MUSCULAR': 'Lesão Muscular',
    'HERNIA_DISCO': 'Hérnia de Disco',
    'KL_0': 'K-L 0',
    'KL_1': 'K-L 1',
    'KL_2': 'K-L 2',
    'KL_3': 'K-L 3',
    'KL_4': 'K-L 4',
    'LEVE': 'Leve',
    'MODERADA': 'Moderada',
    'SEVERA': 'Severa',
    'RUPTURA_PARCIAL': 'Ruptura Parcial',
    'GRAU_1': 'Grau I',
    'GRAU_2': 'Grau II',
    'GRAU_3': 'Grau III',
    'PROTUSAO': 'Protusão',
    'EXTRUSAO': 'Extrusão',
    'SEQUESTRO': 'Sequestro',
    'DISCO_INTERVERTEBRAL': 'Disco',
    'FORAME_NEURAL': 'Forame',
    'FACETARIA': 'Facetária',
    'EPIDURAL': 'Epidural',
    'HA:SIM': 'c/ HA',
    'HA:NAO': 's/ HA',
  };

  return clusterKey
    .split('|')
    .map(part => labelMap[part] || part)
    .join(' • ');
}
