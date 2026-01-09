import logoRegenapp from "@/assets/logo-regenapp-new.png";

export function ScoreReportHeader() {
  return (
    <div className="text-center mb-8 print:mb-6">
      <img 
        src={logoRegenapp} 
        alt="SYNTESY Logo" 
        className="h-12 mx-auto mb-4"
      />
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">
        Relatório do Score Clínico
      </h1>
      <p className="text-muted-foreground mt-2">
        Avaliação de prontidão biológica para procedimentos regenerativos
      </p>
      <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent mt-6" />
    </div>
  );
}
