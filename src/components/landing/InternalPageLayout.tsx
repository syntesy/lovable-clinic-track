import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logoReghen from "@/assets/logo-reghen.png";

interface InternalPageLayoutProps {
  children: React.ReactNode;
  hideFooterCTA?: boolean;
}

export default function InternalPageLayout({ children, hideFooterCTA = false }: InternalPageLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const getRedirectPath = () => {
    const params = new URLSearchParams(location.search);
    return params.get("redirect") || "/select-environment";
  };

  return (
    <div className="min-h-screen bg-[#080b14] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 px-8 md:px-12 h-20 flex items-center justify-between bg-[#080b14]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <button onClick={() => navigate("/")} className="flex-shrink-0">
          <img src={logoReghen} alt="REGHEN" className="h-7 w-auto opacity-80 hover:opacity-100 transition-opacity" />
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar
          </button>
          <button
            onClick={() => navigate(`/auth?redirect=${encodeURIComponent(getRedirectPath())}`)}
            className="px-5 py-2 text-[13px] font-medium text-white/60 hover:text-white transition-colors"
          >
            Entrar
          </button>
          <button
            onClick={() => navigate(`/auth?mode=signup&redirect=${encodeURIComponent(getRedirectPath())}`)}
            className="px-5 py-2 text-[13px] font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Criar conta
          </button>
        </div>
      </header>

      {/* Content */}
      <main>{children}</main>

      {/* Footer CTA */}
      {!hideFooterCTA && (
        <section className="py-24 px-8 md:px-16 text-center border-t border-white/[0.06]">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
            Pronto para transformar sua prática?
          </h2>
          <p className="text-white/40 mb-8 max-w-xl mx-auto">
            Comece agora com o REGHEN e tenha acesso à estrutura clínica que sua prática precisa.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate(`/auth?mode=signup&redirect=${encodeURIComponent(getRedirectPath())}`)}
              className="px-8 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Criar conta
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-8 py-3 text-sm font-medium text-white/50 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-all"
            >
              Ver demonstração
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
