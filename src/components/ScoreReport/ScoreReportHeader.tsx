import logoRhegen from "@/assets/logo-rhegen.png";
import logoRhegenLight from "@/assets/logo-rhegen-light.png";
import { useTheme } from "@/contexts/ThemeContext";

export function ScoreReportHeader() {
  const { theme } = useTheme();
  const currentLogo = theme === 'light' ? logoRhegenLight : logoRhegen;

  return (
    <div className="text-center mb-8 print:mb-6">
      <img 
        src={currentLogo} 
        alt="rhegen" 
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
