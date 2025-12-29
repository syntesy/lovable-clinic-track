import { Info } from "lucide-react";

export function ScoreDisclaimer() {
  return (
    <div className="mt-8 rounded-xl p-4 bg-[#F5F6F8] border border-gray-200">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-[#797E88] mt-0.5 flex-shrink-0" />
        <p className="text-sm text-[#797E88] italic">
          Este relatório é uma ferramenta de apoio à decisão clínica. 
          Não substitui a avaliação presencial, o julgamento profissional 
          nem garante resultados clínicos.
        </p>
      </div>
    </div>
  );
}
