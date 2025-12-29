import { 
  CheckSquare, 
  Pill, 
  Apple, 
  AlertCircle,
  Cigarette,
  Calendar,
  Stethoscope,
  Dumbbell
} from "lucide-react";
import { ComputedResult, FisioRegenFormData, FlagType, BlockType } from "@/types/fisioregen-score";

interface ScoreRecommendationsProps {
  result: ComputedResult;
  formData: FisioRegenFormData;
}

interface Recommendation {
  id: string;
  category: "biological" | "nutritional" | "clinical";
  text: string;
  icon: React.ReactNode;
}

function buildRecommendations(result: ComputedResult, formData: FisioRegenFormData): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const { triggered_flags, triggered_blocks } = result;

  // Medication-related
  const medBlocks: BlockType[] = ["BLOCK_ASPIRIN_WINDOW", "BLOCK_NSAID_WINDOW", "BLOCK_P2Y12_WINDOW", "BLOCK_SYS_STEROID_WINDOW", "BLOCK_LOCAL_STEROID_WINDOW"];
  if (medBlocks.some(b => triggered_blocks.includes(b)) || triggered_flags.includes("A_MEDS_GRAY_WINDOW")) {
    recommendations.push({
      id: "meds",
      category: "biological",
      text: "Suspender medicamentos conforme orientação médica e respeitar janela de segurança antes do procedimento.",
      icon: <Pill className="h-4 w-4" />
    });
  }

  // Smoking
  if (triggered_flags.includes("A_SMOKING") || triggered_flags.includes("A_SMOKING_HEAVY")) {
    recommendations.push({
      id: "smoking",
      category: "biological",
      text: "Cessar ou reduzir tabagismo pelo menos 2 semanas antes do procedimento para otimizar cicatrização.",
      icon: <Cigarette className="h-4 w-4" />
    });
  }

  // Lab-related
  if (triggered_flags.includes("A_PLATELETS_REQUESTED") || triggered_flags.includes("A_HBA1C_REQUESTED")) {
    recommendations.push({
      id: "labs",
      category: "clinical",
      text: "Realizar exames laboratoriais pendentes (hemograma completo, HbA1c se diabético).",
      icon: <Stethoscope className="h-4 w-4" />
    });
  }

  if (triggered_flags.includes("A_GLYCEMIA_BORDERLINE") || triggered_flags.includes("A_GLYCEMIA_HIGH")) {
    recommendations.push({
      id: "glycemia",
      category: "clinical",
      text: "Otimizar controle glicêmico antes do procedimento. Considerar avaliação com endocrinologista.",
      icon: <AlertCircle className="h-4 w-4" />
    });
  }

  // Inflammatory
  if (triggered_flags.includes("A_CRP_MILD") || triggered_flags.includes("A_CRP_HIGH")) {
    recommendations.push({
      id: "crp",
      category: "clinical",
      text: "Investigar e controlar processo inflamatório ativo antes do procedimento.",
      icon: <AlertCircle className="h-4 w-4" />
    });
  }

  // Nutritional (general recommendations)
  recommendations.push({
    id: "nutrition1",
    category: "nutritional",
    text: "Manter alimentação equilibrada, rica em proteínas e vitaminas nas semanas que antecedem o procedimento.",
    icon: <Apple className="h-4 w-4" />
  });

  recommendations.push({
    id: "nutrition2",
    category: "nutritional",
    text: "Hidratação adequada (mínimo 2L de água/dia).",
    icon: <Apple className="h-4 w-4" />
  });

  // Adherence
  if (triggered_flags.includes("C_LOGISTICS_LIMIT") || triggered_flags.includes("C_LOGISTICS_POOR")) {
    recommendations.push({
      id: "logistics",
      category: "biological",
      text: "Organizar agenda e logística para garantir comparecimento às sessões de acompanhamento.",
      icon: <Calendar className="h-4 w-4" />
    });
  }

  if (triggered_flags.includes("C_EXPECT_PARTIAL") || triggered_flags.includes("C_EXPECT_UNREAL")) {
    recommendations.push({
      id: "expectations",
      category: "clinical",
      text: "Alinhar expectativas sobre resultados e tempo de recuperação com o profissional.",
      icon: <AlertCircle className="h-4 w-4" />
    });
  }

  // Exercise (general)
  recommendations.push({
    id: "exercise",
    category: "biological",
    text: "Seguir orientações de repouso ou exercício supervisionado conforme indicação profissional.",
    icon: <Dumbbell className="h-4 w-4" />
  });

  return recommendations;
}

const categoryConfig = {
  biological: {
    title: "Preparação Biológica",
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  nutritional: {
    title: "Preparação Nutricional",
    bg: "bg-green-50",
    border: "border-green-200",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  clinical: {
    title: "Pontos de Atenção Clínica",
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
};

export function ScoreRecommendations({ result, formData }: ScoreRecommendationsProps) {
  const recommendations = buildRecommendations(result, formData);
  
  const biologicalRecs = recommendations.filter(r => r.category === "biological");
  const nutritionalRecs = recommendations.filter(r => r.category === "nutritional");
  const clinicalRecs = recommendations.filter(r => r.category === "clinical");

  const renderCategory = (recs: Recommendation[], category: "biological" | "nutritional" | "clinical") => {
    if (recs.length === 0) return null;
    const config = categoryConfig[category];
    
    return (
      <div className={`rounded-xl p-4 ${config.bg} ${config.border} border`}>
        <h3 className="font-semibold text-[#051F41] mb-3">{config.title}</h3>
        <ul className="space-y-2">
          {recs.map((rec) => (
            <li key={rec.id} className="flex items-start gap-2">
              <div className={`p-1 rounded ${config.iconBg} ${config.iconColor} mt-0.5`}>
                <CheckSquare className="h-3 w-3" />
              </div>
              <span className="text-sm text-[#797E88]">{rec.text}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-[#051F41] mb-4 flex items-center gap-2">
        <CheckSquare className="h-5 w-5" />
        Recomendações para preparação antes do procedimento
      </h2>
      
      <div className="grid gap-4 md:grid-cols-3">
        {renderCategory(biologicalRecs, "biological")}
        {renderCategory(nutritionalRecs, "nutritional")}
        {renderCategory(clinicalRecs, "clinical")}
      </div>
    </div>
  );
}
