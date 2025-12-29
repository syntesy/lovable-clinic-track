import { CheckCircle, AlertTriangle, XCircle, Shield } from "lucide-react";
import { ComputedResult } from "@/types/fisioregen-score";

interface ScoreAptitudeStatusProps {
  result: ComputedResult;
}

function getAptitudeConfig(score: number, bloqueio: boolean) {
  if (bloqueio || score < 40) {
    return {
      status: "NAO_APTO",
      label: "Paciente NÃO APTO no momento",
      description: "Existem condições que precisam ser resolvidas antes de prosseguir com o procedimento regenerativo. O profissional irá orientá-lo sobre os próximos passos.",
      bg: "bg-red-50",
      border: "border-red-200",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      Icon: XCircle,
    };
  }
  if (score < 60) {
    return {
      status: "APTO_COM_RESTRICOES",
      label: "Paciente APTO COM RESTRIÇÕES",
      description: "O paciente pode prosseguir com o procedimento, porém com atenção especial aos pontos indicados. Os resultados podem ser limitados pelos fatores de risco identificados.",
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      Icon: AlertTriangle,
    };
  }
  return {
    status: "APTO",
    label: "Paciente APTO",
    description: "O paciente apresenta condições favoráveis para prosseguir com procedimento regenerativo, respeitando as recomendações acima.",
    bg: "bg-green-50",
    border: "border-green-200",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    Icon: CheckCircle,
  };
}

export function ScoreAptitudeStatus({ result }: ScoreAptitudeStatusProps) {
  const config = getAptitudeConfig(result.biological_readiness_score, result.bloqueio);
  const { label, description, bg, border, iconBg, iconColor, Icon } = config;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-[#051F41] mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5" />
        Status para procedimento
      </h2>
      
      <div className={`rounded-xl p-6 ${bg} ${border} border`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${iconBg}`}>
            <Icon className={`h-8 w-8 ${iconColor}`} />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${iconColor}`}>{label}</h3>
            <p className="text-[#797E88] mt-1">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
