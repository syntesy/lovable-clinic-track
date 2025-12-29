import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { ComputedResult } from "@/types/fisioregen-score";

interface ScoreGaugeProps {
  result: ComputedResult;
}

function getScoreConfig(score: number, bloqueio: boolean) {
  if (bloqueio) {
    return {
      color: "#6B7280",
      bgColor: "bg-gray-100",
      textColor: "text-gray-600",
      label: "Não apto no momento",
      Icon: XCircle,
    };
  }
  if (score < 40) {
    return {
      color: "#D9534F",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
      label: "Não apto no momento",
      Icon: XCircle,
    };
  }
  if (score < 60) {
    return {
      color: "#F2A93B",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
      label: "Apto com restrições",
      Icon: AlertTriangle,
    };
  }
  if (score < 80) {
    return {
      color: "#2FAF6C",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      label: "Apto",
      Icon: CheckCircle,
    };
  }
  return {
    color: "#059669",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-600",
    label: "Excelente prontidão biológica",
    Icon: CheckCircle,
  };
}

export function ScoreGauge({ result }: ScoreGaugeProps) {
  const config = getScoreConfig(result.biological_readiness_score, result.bloqueio);
  const { color, bgColor, textColor, label, Icon } = config;
  const percentage = result.biological_readiness_score;

  // SVG semicircle gauge
  const radius = 80;
  const strokeWidth = 12;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`rounded-2xl p-6 md:p-8 ${bgColor} border border-gray-100 shadow-sm`}>
      <div className="flex flex-col items-center">
        {/* Gauge SVG */}
        <div className="relative">
          <svg width="200" height="120" viewBox="0 0 200 120" className="overflow-visible">
            {/* Background arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Progress arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 1s ease-out" }}
            />
          </svg>
          {/* Score number in center */}
          <div className="absolute inset-0 flex items-end justify-center pb-2">
            <span className="text-5xl font-bold" style={{ color }}>
              {result.biological_readiness_score}
            </span>
          </div>
        </div>

        {/* Scale labels */}
        <div className="flex justify-between w-[200px] text-xs text-[#797E88] -mt-2">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>

        {/* Status badge */}
        <div className={`flex items-center gap-2 mt-4 px-4 py-2 rounded-full ${bgColor} border`}>
          <Icon className={`h-5 w-5 ${textColor}`} />
          <span className={`font-semibold ${textColor}`}>{label}</span>
        </div>

        {/* Explanation */}
        <p className="text-center text-[#797E88] text-sm mt-4 max-w-md">
          Este score representa o nível atual de prontidão biológica do paciente para 
          procedimentos regenerativos, considerando fatores clínicos, laboratoriais e comportamentais.
        </p>
      </div>
    </div>
  );
}
