import { useNavigate, useLocation } from "react-router-dom";
import { Users, Building2, BookOpen, Network } from "lucide-react";
import InternalPageLayout from "@/components/landing/InternalPageLayout";
import slideBg06 from "@/assets/slide-bg-06.jpg";

export default function EcossistemaPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const getRedirectPath = () => {
    const params = new URLSearchParams(location.search);
    return params.get("redirect") || "/select-environment";
  };

  return (
    <InternalPageLayout hideFooterCTA>
      {/* SEÇÃO 1 – HERO */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: `url(${slideBg06})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-black/[0.03]" />
        <div className="relative z-10 text-center px-8 max-w-4xl">
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Ecossistema</span>
          <h1 className="text-3xl md:text-5xl font-light text-white mb-6">Um Ecossistema Estruturado para a Medicina Regenerativa</h1>
          <p className="text-lg max-w-2xl mx-auto mb-4 text-teal-50">
            Profissionais, centros e metodologia conectados por uma mesma arquitetura científica.
          </p>
          <p className="text-sm max-w-2xl mx-auto leading-relaxed text-sidebar-primary"></p>
        </div>
      </section>

      {/* SEÇÃO 2 – PRINCIPAL */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
          O que caracteriza um ecossistema estruturado?
        </h2>
        <p className="text-white/50 leading-relaxed max-w-3xl mb-14">
          Um ecossistema não é apenas um conjunto de profissionais. É uma rede conectada por critérios metodológicos comuns.
        </p>

        <div className="space-y-12">
          {[
            { num: "01", title: "Profissionais Integrados", desc: "Atuam dentro de uma mesma arquitetura metodológica." },
            { num: "02", title: "Centros Estruturados", desc: "Operam com fluxo clínico, mensuração e governança padronizados." },
            { num: "03", title: "Metodologia Compartilhada", desc: "Aplicação de critérios científicos convertidos em prática estruturada." },
            { num: "04", title: "Evolução Profissional", desc: "Acompanhamento da performance clínica dentro de critérios objetivos." },
            { num: "05", title: "Career Engine", desc: "Ferramenta de desenvolvimento baseada em consistência metodológica e estrutura técnica." },
          ].map((item) => (
            <div key={item.num} className="group flex gap-8 items-start cursor-default">
              <span className="text-primary/30 text-5xl font-light shrink-0 w-16 transition-all duration-300 group-hover:text-primary/60 group-hover:drop-shadow-[0_0_12px_rgba(160,111,76,0.3)]">{item.num}</span>
              <div>
                <h3 className="text-white text-xl font-medium mb-2 transition-all duration-300 group-hover:text-primary/90">{item.title}</h3>
                <p className="text-white/40 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEÇÃO 3 – IMPACTO NA PRÁTICA */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <div className="text-center mb-16">
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Integração estrutural</span>
          <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
            O que muda quando existe um ecossistema organizado?
          </h2>
          <p className="text-white/50 leading-relaxed max-w-2xl mx-auto">
            A prática deixa de ser isolada e passa a operar dentro de um ambiente metodológico estruturado.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { icon: Network, title: "Consistência Nacional", desc: "Aplicação de critérios dentro da mesma arquitetura científica." },
            { icon: Users, title: "Evolução Técnica", desc: "Profissionais evoluem com base em métricas estruturadas." },
            { icon: Building2, title: "Clareza Metodológica", desc: "Centros operam dentro de fluxo clínico organizado." },
            { icon: BookOpen, title: "Base Compartilhada de Conhecimento", desc: "Experiência clínica estruturada em ambiente comum." },
          ].map((item) => (
            <div key={item.title} className="group relative p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.05] hover:shadow-[0_8px_40px_-12px_rgba(160,111,76,0.15),inset_0_1px_0_rgba(255,255,255,0.04)] hover:-translate-y-1 cursor-default">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/[0.08] border border-primary/[0.12] flex items-center justify-center shrink-0 transition-all duration-500 group-hover:bg-primary/[0.15] group-hover:border-primary/[0.25] group-hover:shadow-[0_0_20px_-4px_rgba(160,111,76,0.3)]">
                  <item.icon className="w-4.5 h-4.5 text-primary/60 transition-colors duration-500 group-hover:text-primary" />
                </div>
                <div>
                  <h3 className="text-white text-[15px] font-medium mb-1.5 transition-colors duration-300 group-hover:text-primary/90">{item.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEÇÃO 4 – ECOSSISTEMA COMO INFRAESTRUTURA */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
          Ecossistema não é rede informal. É arquitetura conectada.
        </h2>
        <p className="text-white/40 leading-relaxed max-w-3xl mb-10">
          O REGHEN integra:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            "Profissionais",
            "Centros",
            "Metodologia",
            "Governança",
            "Formação contínua (Academy)",
            "Desenvolvimento estruturado (Career Engine)",
          ].map((item) => (
            <div key={item} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-start gap-3 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.06] hover:shadow-[0_8px_30px_-10px_rgba(160,111,76,0.15),inset_0_1px_0_rgba(255,255,255,0.04)] hover:-translate-y-0.5 cursor-default">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
              <span className="text-white/40 text-sm leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
        <p className="text-white/30 text-sm italic">Todos operando dentro de uma mesma lógica científica.</p>
      </section>

      {/* SEÇÃO 5 – CTA FINAL */}
      <section className="py-24 px-8 md:px-16 text-center border-t border-white/[0.06]">
        <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
          Infraestrutura cria conexão.
        </h2>
        <p className="text-white/40 mb-8 max-w-xl mx-auto">
          Conexão estruturada gera evolução consistente.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate(`/auth?mode=signup&redirect=${encodeURIComponent(getRedirectPath())}`)}
            className="px-8 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Criar conta
          </button>
          <button
            onClick={() => navigate("/arquitetura")}
            className="px-8 py-3 text-sm font-medium text-white/50 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-all"
          >
            Conhecer a Arquitetura
          </button>
        </div>
      </section>
    </InternalPageLayout>
  );
}
