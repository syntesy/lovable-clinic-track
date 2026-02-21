import { useNavigate, useLocation } from "react-router-dom";
import { Eye, GitBranch, RefreshCw, ShieldCheck } from "lucide-react";
import InternalPageLayout from "@/components/landing/InternalPageLayout";
import slideBg02 from "@/assets/slide-bg-02.jpg";

export default function EstruturaClinicaPage() {
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
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Metodologia clínica</span>
          <h1 className="text-3xl md:text-5xl font-light text-white mb-6">
            Estrutura clínica padronizada para Medicina Regenerativa
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-4 text-teal-50">
            Organização transforma variáveis em método.<br />
            Método transforma prática em consistência clínica.
          </p>
        </div>
      </section>

      {/* SEÇÃO 2 – PRINCIPAL */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
          Como funciona uma prática clínica estruturada
        </h2>
        <p className="text-white/50 leading-relaxed max-w-3xl mb-14">
          Quando há método estruturado e mensuração longitudinal, cada intervenção passa a contribuir para consistência clínica aplicável.
        </p>

        <div className="space-y-12">
          {[
            { num: "01", title: "Registro clínico estruturado", desc: "Coleta organizada de dados do paciente, histórico clínico e variáveis técnicas relevantes em formato padronizado." },
            { num: "02", title: "Elegibilidade baseada em critérios objetivos", desc: "Avaliação estruturada alinhada à ciência atual para determinar adequação e indicação do procedimento." },
            { num: "03", title: "Padronização de variáveis técnicas", desc: "Registro claro de concentração, volume, técnica aplicada e parâmetros do procedimento." },
            { num: "04", title: "Follow-up longitudinal organizado", desc: "Checkpoints definidos com métricas consistentes para acompanhar resposta clínica ao longo do tempo." },
            { num: "05", title: "Consolidação de dados clínicos", desc: "Integração das informações coletadas para permitir análise comparável e evolução metodológica da prática." },
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
            Por que a estrutura fortalece a prática clínica?
          </h2>
          <p className="text-white/50 leading-relaxed max-w-2xl mx-auto">
            A organização de variáveis técnicas, elegibilidade e desfechos permite transformar intervenção em método consistente.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { icon: Eye, title: "Clareza longitudinal", desc: "Visualização estruturada da evolução do paciente ao longo do tempo." },
            { icon: GitBranch, title: "Correlação protocolo × resposta", desc: "Possibilidade de relacionar variáveis técnicas com resposta clínica individual." },
            { icon: RefreshCw, title: "Consistência metodológica", desc: "Capacidade de repetir condutas baseadas em dados organizados." },
            { icon: ShieldCheck, title: "Segurança documental", desc: "Rastreabilidade clara que demonstra adequação técnica e alinhamento à ciência atual." },
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
          A estrutura clínica é composta por pilares organizados
        </h2>
        <p className="text-white/40 leading-relaxed max-w-3xl mb-10">
          Cada etapa da prática regenerativa passa a integrar um fluxo consistente e documentado.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            "Registro clínico padronizado",
            "Critérios objetivos de elegibilidade",
            "Follow-up longitudinal estruturado",
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
          Estruturar é o primeiro passo para evoluir com consistência.
        </h2>
        <p className="text-white/40 mb-8 max-w-xl mx-auto">
          Método clínico começa com organização.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate(`/auth?mode=signup&redirect=${encodeURIComponent(getRedirectPath())}`)}
            className="px-8 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Criar conta
          </button>
          <button
            onClick={() => navigate("/score")}
            className="px-8 py-3 text-sm font-medium text-white/50 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-all"
          >
            Ver SCORE
          </button>
        </div>
      </section>
    </InternalPageLayout>
  );
}
