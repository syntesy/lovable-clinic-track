import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logoReghen from "@/assets/logo-reghen.png";

import LandingHeroInstitutional from "@/components/landing/LandingHeroInstitutional";
import LandingProblem from "@/components/landing/LandingProblem";
import LandingArchitecture from "@/components/landing/LandingArchitecture";
import LandingScience from "@/components/landing/LandingScience";
import LandingGovernance from "@/components/landing/LandingGovernance";
import LandingEvidenceResults from "@/components/landing/LandingEvidenceResults";
import LandingEcosystem from "@/components/landing/LandingEcosystem";
import LandingCTAFinal from "@/components/landing/LandingCTAFinal";

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const getRedirectPath = useCallback(() => {
    const params = new URLSearchParams(location.search);
    return params.get("redirect") || "/select-environment";
  }, [location.search]);

  const handleLogin = useCallback(() => {
    navigate(`/auth?redirect=${encodeURIComponent(getRedirectPath())}`);
  }, [navigate, getRedirectPath]);

  const handleSignup = useCallback(() => {
    navigate(`/auth?mode=signup&redirect=${encodeURIComponent(getRedirectPath())}`);
  }, [navigate, getRedirectPath]);

  return (
    <div className="w-full overflow-x-hidden" style={{ background: "#080b14" }}>
      {/* ═══ STICKY HEADER ═══ */}
      <header className="fixed top-0 left-0 right-0 z-50 px-8 md:px-12 h-20 flex items-center justify-between bg-[#080b14]/80 backdrop-blur-md border-b border-white/[0.04]">
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex-shrink-0">
          <img src={logoReghen} alt="REGHEN" className="h-[72px] w-auto opacity-80 hover:opacity-100 transition-opacity" />
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogin}
            className="px-5 py-2 text-[13px] font-medium text-white/60 hover:text-white transition-colors"
          >
            Entrar
          </button>
          <button
            onClick={handleSignup}
            className="px-5 py-2 text-[13px] font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Criar conta
          </button>
        </div>
      </header>

      {/* ═══ SECTIONS ═══ */}
      <LandingHeroInstitutional />
      <LandingProblem />
      <LandingArchitecture />
      <LandingScience />
      <LandingGovernance />
      <LandingEvidenceResults />
      <LandingEcosystem />
      <LandingCTAFinal />

      {/* ═══ FOOTER ═══ */}
      <footer className="py-10 px-6 border-t border-white/[0.06]" style={{ background: "#080b14" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-white/25 text-[11px] tracking-[0.2em] uppercase">
            REGHEN — Infraestrutura Nacional da Prática Regenerativa
          </span>
          <span className="text-white/20 text-[11px]">
            © {new Date().getFullYear()} REGHEN. Todos os direitos reservados.
          </span>
        </div>
      </footer>
    </div>
  );
}
