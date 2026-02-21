import { useNavigate, useLocation } from "react-router-dom";
import InternalPageLayout from "@/components/landing/InternalPageLayout";
import slideBg01 from "@/assets/slide-bg-01-new.png";

export default function ProblemaPage() {
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
        <div className="absolute inset-0" style={{ backgroundImage: `url(${slideBg01})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 text-center px-8 max-w-4xl">
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">O cenário atual</span>
          <h1 className="text-3xl md:text-5xl font-light text-white mb-6">O problema estrutural da 
Medicina Regenerativa
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-4 text-teal-50">
            Sem organização, não há clareza.<br />
            Sem clareza, não há evolução clínica.
          </p>
          <p className="text-sm max-w-2xl mx-auto leading-relaxed text-sidebar-primary">

          </p>
        </div>
      </section>

      {/* SEÇÃO 2 – PRINCIPAL */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
          O que acontece quando a prática clínica não é estruturada?
        </h2>
        <p className="text-white/50 leading-relaxed max-w-3xl mb-14">
          Sem método estruturado e mensuração longitudinal, a intervenção ocorre — mas não se consolida em evidência clínica aplicável.
        </p>

        <div className="space-y-12">
          {[
          { num: "01", title: "Protocolos heterogêneos", desc: "Variáveis técnicas como indicação, concentração, volume, número de aplicações e tempo de acompanhamento variam entre profissionais, dificultando replicabilidade e previsibilidade de resposta clínica." },
          { num: "02", title: "Elegibilidade pouco estruturada", desc: "Sem critérios objetivos alinhados à ciência atual, a indicação pode não considerar adequadamente o perfil biológico do paciente." },
          { num: "03", title: "Desfechos não padronizados", desc: "Sem métricas estruturadas (VAS, PROs, escalas funcionais e checkpoints definidos), não é possível avaliar evolução clínica de forma consistente." },
          { num: "04", title: "Fragilidade documental", desc: "Sem registro estruturado, o profissional não consegue demonstrar que a conduta aplicada estava alinhada à ciência atual, aos critérios técnicos de elegibilidade e às variáveis biológicas do paciente." },
          { num: "05", title: "Evolução limitada da prática", desc: "Sem dados organizados, não é possível identificar padrões, ajustar protocolos com precisão ou construir método clínico consistente." }].
          map((item) =>
          <div key={item.num} className="group flex gap-8 items-start cursor-default">
              <span className="text-primary/30 text-5xl font-light shrink-0 w-16 transition-all duration-300 group-hover:text-primary/60 group-hover:drop-shadow-[0_0_12px_rgba(160,111,76,0.3)]">{item.num}</span>
              <div>
                <h3 className="text-white text-xl font-medium mb-2 transition-all duration-300 group-hover:text-primary/90">{item.title}</h3>
                <p className="text-white/40 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SEÇÃO 3 – COMPLEMENTAR */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
          Por que isso compromete a evolução clínica?
        </h2>
        <p className="text-white/40 leading-relaxed max-w-3xl mb-10">
          A medicina regenerativa exige critérios objetivos, alinhamento à ciência atual e acompanhamento longitudinal.
          Sem estrutura, esses elementos permanecem desconectados.
        </p>
        <div className="space-y-4">
          {[
          "Decisão clínica com baixa visibilidade longitudinal",
          "Dificuldade de correlacionar protocolo e resposta biológica",
          "Impossibilidade de construir consistência ao longo do tempo",
          "Maior exposição profissional por ausência de rastreabilidade"].
          map((item) =>
          <div key={item} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-2 shrink-0" />
              <span className="text-white/40 leading-relaxed">{item}</span>
            </div>
          )}
        </div>
      </section>

      {/* SEÇÃO 4 – TRANSIÇÃO CONTROLADA */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
          Existe uma forma estruturada de organizar a prática clínica
        </h2>
        <p className="text-white/40 leading-relaxed max-w-3xl mb-10">
          Organizar variáveis técnicas, critérios de elegibilidade e métricas de evolução é o que transforma intervenção em prática consistente.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
          "Registro clínico estruturado",
          "Critérios objetivos de elegibilidade",
          "Follow-up longitudinal automatizado",
          "Consolidação de dados clínicos"].
          map((item) =>
          <div key={item} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-start gap-3 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.06] hover:shadow-[0_8px_30px_-10px_rgba(160,111,76,0.15),inset_0_1px_0_rgba(255,255,255,0.04)] hover:-translate-y-0.5 cursor-default">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
              <span className="text-white/40 text-sm leading-relaxed">{item}</span>
            </div>
          )}
        </div>
      </section>

      {/* SEÇÃO 5 – CTA FINAL (substitui o CTA padrão do layout) */}
      <section className="py-24 px-8 md:px-16 text-center border-t border-white/[0.06]">
        <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
          Evoluir exige método.
        </h2>
        <p className="text-white/40 mb-8 max-w-xl mx-auto">
          Clareza estrutural é o que permite consistência clínica ao longo do tempo.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate(`/auth?mode=signup&redirect=${encodeURIComponent(getRedirectPath())}`)}
            className="px-8 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">

            Criar conta
          </button>
          <button
            onClick={() => navigate("/estrutura-clinica")}
            className="px-8 py-3 text-sm font-medium text-white/50 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-all">

            Ver Estrutura Clínica
          </button>
        </div>
      </section>
    </InternalPageLayout>);

}