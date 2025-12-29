import logoRegenapp from "@/assets/logo-regenapp.png";

export function ScoreReportHeader() {
  return (
    <div className="text-center mb-8 print:mb-6">
      <img 
        src={logoRegenapp} 
        alt="REGENAPP Logo" 
        className="h-12 mx-auto mb-4"
      />
      <h1 className="text-2xl md:text-3xl font-bold text-[#051F41]">
        Relatório do Score Clínico
      </h1>
      <p className="text-[#797E88] mt-2">
        Avaliação de prontidão biológica para procedimentos regenerativos
      </p>
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#051F41]/20 to-transparent mt-6" />
    </div>
  );
}
