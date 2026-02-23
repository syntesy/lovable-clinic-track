import { useNavigate, useLocation } from "react-router-dom";
import { Shield, FileCheck, ClipboardList, Search } from "lucide-react";
import InternalPageLayout from "@/components/landing/InternalPageLayout";
import slideBg04 from "@/assets/slide-bg-04.jpg";

export default function GovernancaLandingPage() {
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
        <div className="absolute inset-0" style={{ backgroundImage: `url(${slideBg04})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 text-center px-8 max-w-4xl">
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Governança</span>
          <h1 className="text-3xl md:text-5xl font-light text-white mb-6">Governança e Segurança Metodológica na Medicina Regenerativa</h1>
          <p className="text-lg max-w-2xl mx-auto mb-4 text-teal-50">
            Estrutura documental, rastreabilidade técnica e organização metodológica integradas à prática clínica.
          </p>
          <p className="text-sm max-w-2xl mx-auto leading-relaxed text-sidebar-primary"></p>
        </div>
      </section>

      {/* SEÇÃO 2 – PRINCIPAL */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
          O que significa governança em prática regenerativa estruturada?
        </h2>
        <p className="text-white/50 leading-relaxed max-w-3xl mb-14">
          Governança não é controle externo. É organização interna da prática com critérios documentais e rastreabilidade metodológica.
        </p>

        <div className="space-y-12">
          {[
            { num: "01", title: "Organização Documental Estruturada", desc: "Registro clínico organizado com padronização de dados e critérios." },
            { num: "02", title: "Rastreabilidade de Procedimentos", desc: "Cada intervenção vinculada a parâmetros clínicos e acompanhamento documentado." },
            { num: "03", title: "Padronização Técnica", desc: "Aplicação consistente de critérios dentro de estrutura metodológica definida." },
            { num: "04", title: "Registro Longitudinal", desc: "Acompanhamento documentado da evolução clínica com checkpoints estruturados." },
            { num: "05", title: "Base Preparada para Exigências Futuras", desc: "Arquitetura compatível com possíveis demandas regulatórias e auditorias técnicas." },
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
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Segurança metodológica</span>
          <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
            O que muda quando existe governança estruturada?
          </h2>
          <p className="text-white/50 leading-relaxed max-w-2xl mx-auto">
            A prática passa a operar com clareza documental, consistência técnica e previsibilidade metodológica.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { icon: Shield, title: "Segurança Profissional", desc: "Decisões clínicas documentadas e rastreáveis." },
            { icon: FileCheck, title: "Clareza Técnica", desc: "Critérios aplicados dentro de padrão estruturado." },
            { icon: ClipboardList, title: "Consistência Documental", desc: "Histórico clínico organizado longitudinalmente." },
            { icon: Search, title: "Base Auditável", desc: "Arquitetura preparada para análise técnica estruturada." },
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

      {/* SEÇÃO 4 – GOVERNANÇA COMO INFRAESTRUTURA */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
          Governança não é burocracia. É estrutura.
        </h2>
        <p className="text-white/40 leading-relaxed max-w-3xl mb-10">
          No REGHEN, governança integra:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            "Registro clínico estruturado",
            "Critérios objetivos vinculados à decisão",
            "Documentação longitudinal",
            "Rastreabilidade de protocolos",
            "Consolidação de dados clínicos",
          ].map((item) => (
            <div key={item} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-start gap-3 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.06] hover:shadow-[0_8px_30px_-10px_rgba(160,111,76,0.15),inset_0_1px_0_rgba(255,255,255,0.04)] hover:-translate-y-0.5 cursor-default">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
              <span className="text-white/40 text-sm leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SEÇÃO 5 – CTA FINAL */}
      <section className="py-24 px-8 md:px-16 text-center border-t border-white/[0.06]">
        <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
          Sem estrutura, há risco.
        </h2>
        <p className="text-white/40 mb-8 max-w-xl mx-auto">
          Com governança, há segurança metodológica.
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
            Explorar a Arquitetura
          </button>
        </div>
      </section>
    </InternalPageLayout>
  );
}
