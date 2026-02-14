import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logoReghen from "@/assets/logo-reghen.png";

const anchors = [
  { label: "Visão geral", href: "#visao-geral" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Módulos", href: "#modulos" },
  { label: "Segurança", href: "#seguranca" },
  { label: "FAQ", href: "#faq" },
];

export default function LandingFooter() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = useCallback(() => {
    const params = new URLSearchParams(location.search);
    const r = params.get("redirect") || "/select-environment";
    navigate(`/auth?redirect=${encodeURIComponent(r)}`);
  }, [navigate, location.search]);

  const handleSignup = useCallback(() => {
    const params = new URLSearchParams(location.search);
    const r = params.get("redirect") || "/select-environment";
    navigate(`/auth?mode=signup&redirect=${encodeURIComponent(r)}`);
  }, [navigate, location.search]);

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <footer className="relative py-12 px-6 border-t border-border/15" role="contentinfo">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <img src={logoReghen} alt="REGHEN" className="h-7 w-auto opacity-50" width={90} height={28} loading="lazy" />
            <p className="text-muted-foreground/40 text-[11px] tracking-wide">
              © REGHEN · Infraestrutura clínica para medicina regenerativa
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-5" aria-label="Links do rodapé">
            {anchors.map((a) => (
              <button
                key={a.href}
                onClick={() => scrollTo(a.href)}
                className="text-muted-foreground/50 text-xs hover:text-foreground/70 transition-colors duration-300"
              >
                {a.label}
              </button>
            ))}
            <button onClick={handleLogin} className="text-muted-foreground/50 text-xs hover:text-foreground/70 transition-colors duration-300">
              Entrar
            </button>
            <button onClick={handleSignup} className="text-muted-foreground/50 text-xs hover:text-foreground/70 transition-colors duration-300">
              Criar conta
            </button>
          </nav>
        </div>
      </div>
    </footer>
  );
}
