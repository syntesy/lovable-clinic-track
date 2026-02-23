import { useNavigate, useLocation } from "react-router-dom";
import { Layers, GitMerge, TrendingUp, Globe } from "lucide-react";
import InternalPageLayout from "@/components/landing/InternalPageLayout";
import slideBg02 from "@/assets/slide-bg-02.jpg";

export default function ArquiteturaPage() {
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
        <div className="absolute inset-0" style={{ backgroundImage: `url(${slideBg02})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 text-center px-8 max-w-4xl">
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Arquitetura</span>
          <h1 className="text-3xl md:text-5xl font-light text-white mb-6">Engenharia Estrutural para Padronização da Medicina Regenerativa no Brasil</h1>
          <p className="text-lg max-w-2xl mx-auto mb-4 text-teal-50">
            Uma arquitetura metodológica que integra fluxo clínico, critérios científicos, mensuração longitudinal e governança em um sistema estruturado.
          </p>
          <p className="text-sm max-w-2xl mx-auto leading-relaxed text-sidebar-primary"></p>
        </div>
      </section>

      {/* SEÇÃO 2 – PRINCIPAL */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
          Como se constrói padronização em uma prática clínica complexa?
        </h2>
        <p className="text-white/50 leading-relaxed max-w-3xl mb-14">
          A padronização não surge de protocolos isolados. Ela exige uma engenharia estrutural que conecte todas as etapas da prática clínica.
        </p>

        <div className="space-y-12">
          {[
            { num: "01", title: "Integração do Fluxo Assistencial", desc: "Avaliação, elegibilidade, intervenção e acompanhamento organizados em sequência estruturada e coerente." },
            { num: "02", title: "Critérios Clínicos Objetivos", desc: "Aplicação de parâmetros científicos convertidos em critérios práticos e mensuráveis." },
            { num: "03", title: "Mensuração Longitudinal Estruturada", desc: "Definição de checkpoints evolutivos com métricas claras de desfecho." },
            { num: "04", title: "Consolidação de Dados Clínicos", desc: "Registro organizado em base estruturada para análise contínua." },
            { num: "05", title: "Rastreabilidade Metodológica", desc: "Cada decisão clínica vinculada a critérios, registro e acompanhamento documentado." },
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
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Padronização estrutural</span>
          <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
            O que muda quando existe engenharia estrutural?
          </h2>
          <p className="text-white/50 leading-relaxed max-w-2xl mx-auto">
            A prática deixa de depender de variabilidade individual e passa a operar dentro de um sistema organizado.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { icon: Layers, title: "Consistência Clínica", desc: "Protocolos aplicados dentro de critérios estruturados." },
            { icon: GitMerge, title: "Coerência Metodológica", desc: "Integração entre decisão, execução e acompanhamento." },
            { icon: TrendingUp, title: "Previsibilidade Evolutiva", desc: "Desfechos acompanhados com métricas definidas." },
            { icon: Globe, title: "Base Nacional Estruturada", desc: "Organização sistemática da prática regenerativa." },
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

      {/* SEÇÃO 4 – ARQUITETURA COMO SISTEMA */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
          Padronização exige sistema, não apenas protocolo.
        </h2>
        <p className="text-white/40 leading-relaxed max-w-3xl mb-10">
          A engenharia estrutural do REGHEN integra componentes que operam dentro da mesma lógica metodológica.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            "Estrutura Clínica",
            "SCORE",
            "Follow-up",
            "Resultados",
            "Evidência",
            "Governança",
            "Academy",
          ].map((item) => (
            <div key={item} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-start gap-3 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.06] hover:shadow-[0_8px_30px_-10px_rgba(160,111,76,0.15),inset_0_1px_0_rgba(255,255,255,0.04)] hover:-translate-y-0.5 cursor-default">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
              <span className="text-white/40 text-sm leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
        <p className="text-white/30 text-sm italic">Todos interligados por uma mesma arquitetura científica.</p>
      </section>

      {/* SEÇÃO 5 – CTA FINAL */}
      <section className="py-24 px-8 md:px-16 text-center border-t border-white/[0.06]">
        <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
          Padronizar é estruturar.
        </h2>
        <p className="text-white/40 mb-8 max-w-xl mx-auto">
          Estruturar é integrar método, mensuração e governança em um único sistema.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate(`/auth?mode=signup&redirect=${encodeURIComponent(getRedirectPath())}`)}
            className="px-8 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Criar conta
          </button>
          <button
            onClick={() => navigate("/estrutura-clinica")}
            className="px-8 py-3 text-sm font-medium text-white/50 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-all"
          >
            Conhecer a Estrutura Científica
          </button>
        </div>
      </section>
    </InternalPageLayout>
  );
}
