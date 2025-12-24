export type CuradoriaStatus = 
  | 'sem_curadoria' 
  | 'solicitada' 
  | 'em_analise' 
  | 'em_producao' 
  | 'disponivel' 
  | 'indeferida';

export type CuradoriaInterest = 'PRP' | 'PRF' | 'PPP' | 'BMP' | 'Outro';

export type CuradoriaPurpose = 'pratica_clinica' | 'ensino' | 'pesquisa';

export interface CuradoriaArticle {
  id: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  interest: CuradoriaInterest;
  tags: string[];
  doi?: string;
  pubmed_url?: string;
  pdf_url?: string;
  pdf_path?: string;
  abstract?: string;
  status: CuradoriaStatus;
  practice_change?: string;
  created_at: string;
  updated_at: string;
}

export interface CuradoriaContent {
  id: string;
  article_id: string;
  summary?: string;
  objective?: string;
  methodology?: string;
  main_results?: string;
  clinical_applicability?: string;
  limitations?: string;
  evidence_level?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CuradoriaRequest {
  id: string;
  article_id: string;
  user_id: string;
  interest: CuradoriaInterest;
  purpose?: CuradoriaPurpose;
  comment?: string;
  status: CuradoriaStatus;
  created_at: string;
  updated_at: string;
}

export const statusConfig: Record<CuradoriaStatus, { label: string; color: string; description: string }> = {
  sem_curadoria: {
    label: 'Sem curadoria',
    color: 'bg-muted text-muted-foreground border-muted-foreground/30',
    description: 'Este artigo ainda não possui curadoria clínica disponível.'
  },
  solicitada: {
    label: 'Curadoria solicitada',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    description: 'Uma solicitação de curadoria foi registrada e está aguardando análise.'
  },
  em_analise: {
    label: 'Em análise',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    description: 'A equipe científica está analisando a viabilidade da curadoria.'
  },
  em_producao: {
    label: 'Curadoria em produção',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    description: 'A curadoria clínica está sendo elaborada pela equipe científica.'
  },
  disponivel: {
    label: 'Curadoria disponível',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    description: 'A curadoria clínica está disponível para consulta.'
  },
  indeferida: {
    label: 'Indeferida',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    description: 'A solicitação de curadoria não foi aprovada.'
  }
};

export const interestColors: Record<string, string> = {
  PRP: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  PRF: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  PPP: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  BMP: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Outro: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};
