import { 
  Activity, 
  Pill, 
  TestTube, 
  Heart, 
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle
} from "lucide-react";
import { ComputedResult, FisioRegenFormData, FlagType, BlockType } from "@/types/fisioregen-score";

interface ScoreFactorsProps {
  result: ComputedResult;
  formData: FisioRegenFormData;
}

interface Factor {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: "favorable" | "attention" | "unfavorable";
  explanation: string;
}

function getFactorStatus(flags: FlagType[], blocks: BlockType[], relatedFlags: string[], relatedBlocks: string[]): "favorable" | "attention" | "unfavorable" {
  const hasBlock = blocks.some(b => relatedBlocks.includes(b));
  if (hasBlock) return "unfavorable";
  
  const hasFlag = flags.some(f => relatedFlags.includes(f));
  if (hasFlag) return "attention";
  
  return "favorable";
}

function buildFactors(result: ComputedResult, formData: FisioRegenFormData): Factor[] {
  const factors: Factor[] = [];

  // 1. Estado inflamatório (PCR)
  const inflammatoryStatus = getFactorStatus(
    result.triggered_flags,
    result.triggered_blocks,
    ["A_CRP_MILD", "A_CRP_HIGH", "A_CRP_NOT_AVAILABLE"],
    ["BLOCK_INF_OR_SKIN"]
  );
  factors.push({
    id: "inflammatory",
    name: "Estado Inflamatório",
    icon: <Activity className="h-5 w-5" />,
    status: inflammatoryStatus,
    explanation: inflammatoryStatus === "favorable" 
      ? "Marcadores inflamatórios dentro do esperado." 
      : inflammatoryStatus === "attention"
      ? "Marcadores inflamatórios elevados podem reduzir a resposta biológica."
      : "Presença de infecção ativa ou comprometimento cutâneo no local."
  });

  // 2. Medicações
  const medsStatus = getFactorStatus(
    result.triggered_flags,
    result.triggered_blocks,
    ["A_MEDS_GRAY_WINDOW"],
    ["BLOCK_ASPIRIN_WINDOW", "BLOCK_NSAID_WINDOW", "BLOCK_P2Y12_WINDOW", "BLOCK_SYS_STEROID_WINDOW", "BLOCK_LOCAL_STEROID_WINDOW"]
  );
  factors.push({
    id: "medications",
    name: "Uso de Medicamentos",
    icon: <Pill className="h-5 w-5" />,
    status: medsStatus,
    explanation: medsStatus === "favorable"
      ? "Sem medicamentos interferentes recentes."
      : medsStatus === "attention"
      ? "Uso recente de medicamentos que podem interferir na resposta biológica."
      : "Medicamento em janela crítica - aguardar período de segurança."
  });

  // 3. Parâmetros laboratoriais
  const labStatus = getFactorStatus(
    result.triggered_flags,
    result.triggered_blocks,
    ["A_GLYCEMIA_BORDERLINE", "A_GLYCEMIA_HIGH", "A_HBA1C_REQUESTED", "A_PLATELETS_REQUESTED", "A_PLATELETS_BORDERLINE"],
    ["BLOCK_PLATELETS_LOW"]
  );
  factors.push({
    id: "labs",
    name: "Parâmetros Laboratoriais",
    icon: <TestTube className="h-5 w-5" />,
    status: labStatus,
    explanation: labStatus === "favorable"
      ? "Exames laboratoriais dentro dos parâmetros adequados."
      : labStatus === "attention"
      ? "Alguns valores laboratoriais necessitam atenção ou complementação."
      : "Valores laboratoriais fora da faixa segura para procedimento."
  });

  // 4. Condições teciduais
  const tissueStatus = getFactorStatus(
    result.triggered_flags,
    result.triggered_blocks,
    ["B_COMPLETE_RUPTURE", "B_COLLAPSE", "B_LOW_REGEN", "B_PRIOR_FAILURE", "B_MULTIPLE_FAILURES"],
    ["BLOCK_COMPLETE_RUPTURE", "BLOCK_BONE_COLLAPSE"]
  );
  factors.push({
    id: "tissue",
    name: "Condição Tecidual",
    icon: <Target className="h-5 w-5" />,
    status: tissueStatus,
    explanation: tissueStatus === "favorable"
      ? "Tecido-alvo em condições favoráveis para regeneração."
      : tissueStatus === "attention"
      ? "Condição tecidual com alterações que podem limitar resultados."
      : "Alteração estrutural significativa que contraindica o procedimento."
  });

  // 5. Hábitos (tabagismo)
  const habitsStatus = getFactorStatus(
    result.triggered_flags,
    result.triggered_blocks,
    ["A_SMOKING", "A_SMOKING_HEAVY"],
    []
  );
  factors.push({
    id: "habits",
    name: "Hábitos de Vida",
    icon: <Heart className="h-5 w-5" />,
    status: habitsStatus,
    explanation: habitsStatus === "favorable"
      ? "Hábitos de vida favoráveis à cicatrização."
      : "Tabagismo pode reduzir a capacidade regenerativa dos tecidos."
  });

  // 6. Adesão e logística
  const adherenceStatus = getFactorStatus(
    result.triggered_flags,
    result.triggered_blocks,
    ["C_LOGISTICS_LIMIT", "C_LOGISTICS_POOR", "C_ADH_MED", "C_ADH_LOW", "C_EXPECT_PARTIAL", "C_EXPECT_UNREAL"],
    []
  );
  factors.push({
    id: "adherence",
    name: "Capacidade de Adesão",
    icon: <Clock className="h-5 w-5" />,
    status: adherenceStatus,
    explanation: adherenceStatus === "favorable"
      ? "Boa capacidade logística e expectativas realistas."
      : "Fatores logísticos ou de expectativa podem impactar resultados."
  });

  return factors;
}

const statusConfig = {
  favorable: {
    bg: "bg-green-50",
    border: "border-green-200",
    icon: CheckCircle,
    iconColor: "text-green-600",
    label: "Favorável",
    labelColor: "text-green-700",
  },
  attention: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: AlertTriangle,
    iconColor: "text-amber-600",
    label: "Atenção",
    labelColor: "text-amber-700",
  },
  unfavorable: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: XCircle,
    iconColor: "text-red-600",
    label: "Desfavorável",
    labelColor: "text-red-700",
  },
};

export function ScoreFactors({ result, formData }: ScoreFactorsProps) {
  const factors = buildFactors(result, formData);

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-[#051F41] mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5" />
        Como este score foi calculado
      </h2>
      
      <div className="grid gap-4 md:grid-cols-2">
        {factors.map((factor) => {
          const config = statusConfig[factor.status];
          const StatusIcon = config.icon;
          
          return (
            <div
              key={factor.id}
              className={`rounded-xl p-4 ${config.bg} ${config.border} border`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white/60">
                  {factor.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-[#051F41]">{factor.name}</h3>
                    <div className={`flex items-center gap-1 text-sm ${config.labelColor}`}>
                      <StatusIcon className={`h-4 w-4 ${config.iconColor}`} />
                      <span>{config.label}</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#797E88]">{factor.explanation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
