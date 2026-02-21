import { useNavigate, useLocation } from "react-router-dom";
import { BookOpen, GitCompare, Search, GraduationCap } from "lucide-react";
import InternalPageLayout from "@/components/landing/InternalPageLayout";
import slideBg05 from "@/assets/slide-bg-05.jpg";

export default function EvidenciaPage() {
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
        <div className="absolute inset-0" style={{ backgroundImage: `url(${slideBg05})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 text-center px-8 max-w-4xl">
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Base científica integrada</span>
          <h1 className="text-3xl md:text-5xl font-light text-white mb-6">
            Evidência estruturada para prática regenerativa
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-4 text-teal-50">
            Prática clínica exige atualização contínua.<br />
            Atualização estruturada fortalece decisão e consistência.
          </p>
        </div>
      </section>

      {/* SEÇÃO 2 – PRINCIPAL */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
          O que acontece quando a evidência é integrada à prática?
        </h2>
        <p className="text-white/50 leading-relaxed max-w-3xl mb-14">
          Quando ciência atual, critérios técnicos e desfechos clínicos reais são conectados, a decisão deixa de ser isolada e passa a ser fundamentada.
        </p>

        <div className="space-y-12">
          {[
            { num: "01", title: "Curadoria científica contínua", desc: "Seleção estruturada de literatura relevante, priorizando revisões sistemáticas, metanálises e estudos de maior nível de evidência." },
            { num: "02", title: "Tradução prática da evidência", desc: "O REGHEN transforma evidência científica em critérios operacionais claros, convertendo revisões sistemáticas e metanálises em parâmetros objetivos para decisão clínica, elegibilidade e monitoramento longitudinal." },
            { num: "03", title: "Chat especializado baseado em curadoria científica estruturada", desc: "Interface consultiva construída sobre literatura selecionada e organizada, voltada ao suporte técnico e interpretação científica." },
            { num: "04", title: "Mecanismo de busca estruturada na literatura", desc: "Pesquisa organizada para acesso direcionado a evidências relevantes conforme tema, patologia ou procedimento." },
            { num: "05", title: "Integração entre desfecho real e literatura", desc: "Correlação entre resultados clínicos registrados no sistema e evidências científicas publicadas." },
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
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Impacto na prática</span>
          <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
            Por que integrar evidência fortalece a prática clínica?
          </h2>
          <p className="text-white/50 leading-relaxed max-w-2xl mx-auto">
            A ciência deixa de ser externa ao atendimento e passa a fazer parte do fluxo estruturado da prática regenerativa.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { icon: BookOpen, title: "Atualização contínua fundamentada", desc: "Acesso organizado à literatura relevante com priorização de evidência de maior nível." },
            { icon: GitCompare, title: "Redução de variabilidade clínica", desc: "Decisão fundamentada em critérios científicos estruturados." },
            { icon: Search, title: "Integração prática × evidência", desc: "Correlação entre protocolo aplicado e base científica disponível." },
            { icon: GraduationCap, title: "Educação integrada ao método", desc: "REGHEN Academy conectada à prática clínica estruturada." },
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

      {/* SEÇÃO 4 – HORIZONTAL */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
          Evidência integrada ao método clínico
        </h2>
        <p className="text-white/40 leading-relaxed max-w-3xl mb-10">
          O conhecimento científico passa a integrar o fluxo estruturado da prática regenerativa.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            "Curadoria contínua de artigos",
            "Chat especializado com base estruturada",
            "Base de conhecimento atualizada",
            "REGHEN Academy integrada",
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
          Prática consistente exige ciência integrada.
        </h2>
        <p className="text-white/40 mb-8 max-w-xl mx-auto">
          Atualização estruturada é parte essencial de uma medicina regenerativa consistente.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate(`/auth?mode=signup&redirect=${encodeURIComponent(getRedirectPath())}`)}
            className="px-8 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Criar conta
          </button>
          <button
            onClick={() => navigate("/seguranca")}
            className="px-8 py-3 text-sm font-medium text-white/50 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-all"
          >
            Ver Segurança
          </button>
        </div>
      </section>
    </InternalPageLayout>
  );
}
