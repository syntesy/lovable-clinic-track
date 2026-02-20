import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logoReghen from "@/assets/logo-reghen.png";

const navItems = [
  { id: "problema", label: "Problema", route: "/problema" },
  { id: "estrutura-clinica", label: "Estrutura Clínica", route: "/estrutura-clinica" },
  { id: "score", label: "SCORE", route: "/score" },
  { id: "resultados", label: "Resultados", route: "/resultados" },
  { id: "evidencia", label: "Evidência", route: "/evidencia" },
  { id: "integridade", label: "Integridade", route: "/integridade" },
];

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
    <div className="h-screen w-screen overflow-hidden relative" style={{ background: "#080b14" }}>
      {/* ═══ HEADER ═══ */}
      <header className="absolute top-0 left-0 right-0 z-30 px-8 md:px-12 h-20 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex-shrink-0">
          <img src={logoReghen} alt="REGHEN" className="h-7 w-auto opacity-80 hover:opacity-100 transition-opacity" />
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

      {/* ═══ CENTER CONTENT ═══ */}
      <main className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 md:px-24">
        <div className="text-center max-w-3xl">
          <h1
            className="text-4xl md:text-6xl lg:text-7xl text-white leading-[1.05] tracking-tight mb-6"
            style={{ fontWeight: 400 }}
          >
            Infraestrutura clínica para{" "}
            <span className="text-primary">Medicina Regenerativa</span>
          </h1>

          <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-4">
            Padronize condutas. Proteja sua prática. Potencialize seus resultados clínicos.
          </p>

          <p className="text-white/30 text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-10">
            O REGHEN organiza o fluxo clínico da medicina regenerativa com estrutura, rastreabilidade e mensuração de desfechos — do primeiro registro ao follow-up.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleSignup}
              className="px-8 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Criar conta
            </button>
            <button
              onClick={() => navigate("/problema")}
              className="px-8 py-3 text-sm font-medium text-white/40 border border-white/10 rounded-lg hover:text-white/70 hover:border-white/20 transition-all"
            >
              Explorar estrutura
            </button>
          </div>
        </div>
      </main>

      {/* ═══ BOTTOM NAV ═══ */}
      <nav className="absolute bottom-0 left-0 right-0 z-30 px-6 md:px-12 pb-8 md:pb-10">
        <div className="h-px bg-white/[0.08] mb-5" />

        <div className="flex items-start gap-0 overflow-x-auto no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.route)}
              className="flex-1 min-w-[120px] md:min-w-0 group relative text-left px-2 md:px-3 pt-3 pb-1 transition-all duration-500"
            >
              <div className="absolute top-0 left-2 right-2 md:left-3 md:right-3 h-[2px] bg-white/[0.06] overflow-hidden" />

              <span
                className="block text-[10px] md:text-[11px] tracking-[0.15em] uppercase font-medium transition-all duration-500 text-white/30 group-hover:text-white/50"
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
