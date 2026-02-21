import InternalPageLayout from "@/components/landing/InternalPageLayout";
import { useNavigate } from "react-router-dom";
import { Target, Activity, BookOpen, Layers, FileCheck } from "lucide-react";
import slideBg03 from "@/assets/slide-bg-03.jpg";

export default function ScorePage() {
  const navigate = useNavigate();

  return (
    <InternalPageLayout hideFooterCTA>
      {/* SEÇÃO 1 – HERO */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: `url(${slideBg03})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 text-center px-8 max-w-4xl">
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Elegibilidade Clínica</span>
          <h1 className="text-3xl md:text-5xl font-light text-white mb-6">
            SCORE baseado em critérios objetivos e ciência atual
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed">
            Decisão clínica exige critério estruturado.
            <br />
            Critério estruturado reduz risco e aumenta consistência.
          </p>
        </div>
      </section>

      {/* SEÇÃO 2 – PRINCIPAL */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
          O que acontece quando a elegibilidade é estruturada?
        </h2>
        <p className="text-white/50 text-lg leading-relaxed max-w-3xl mb-16">
          Quando critérios técnicos e biológicos são organizados, a indicação deixa de ser intuitiva e passa a ser fundamentada.
        </p>

        <div className="space-y-12">
          {[
            { num: "01", title: "Avaliação de critérios clínicos", desc: "Organização de dados clínicos relevantes para análise objetiva da indicação." },
            { num: "02", title: "Análise de variáveis biológicas", desc: "Consideração estruturada de fatores que influenciam resposta terapêutica." },
            { num: "03", title: "Alinhamento à ciência atual", desc: "Aplicação de critérios baseados em evidências disponíveis e parâmetros técnicos reconhecidos." },
            { num: "04", title: "Estratificação de elegibilidade", desc: "Classificação objetiva do paciente quanto à adequação para determinado procedimento." },
            { num: "05", title: "Registro rastreável da decisão", desc: "Documentação estruturada que demonstra que a conduta foi fundamentada em critérios técnicos e científicos." },
          ].map((item) => (
            <div key={item.num} className="group flex gap-8 items-start p-4 -mx-4 rounded-xl transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.02] hover:border-white/[0.06]" style={{ boxShadow: "inset 0 0 0 transparent" }}>
              <span className="text-primary/30 text-5xl font-light shrink-0 w-16 transition-colors duration-500 group-hover:text-primary/50">{item.num}</span>
              <div>
                <h3 className="text-white text-xl font-medium mb-2 transition-colors duration-500">{item.title}</h3>
                <p className="text-white/40 leading-relaxed transition-colors duration-500 group-hover:text-white/55">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEÇÃO 3 – IMPACTO NA PRÁTICA */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Impacto na Prática</span>
        <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
          Por que o SCORE fortalece a decisão clínica?
        </h2>
        <p className="text-white/40 leading-relaxed max-w-3xl mb-10">
          A elegibilidade estruturada reduz variabilidade, aumenta previsibilidade e protege o profissional.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { icon: Target, title: "Indicação mais consistente", desc: "Decisão baseada em critérios organizados e não apenas em experiência isolada." },
            { icon: Activity, title: "Redução de variabilidade clínica", desc: "Menor dependência de julgamento subjetivo não documentado." },
            { icon: Layers, title: "Maior previsibilidade de resposta", desc: "Melhor correlação entre perfil do paciente e intervenção proposta." },
            { icon: FileCheck, title: "Proteção documental", desc: "Registro claro de que a decisão foi fundamentada em critérios técnicos e alinhada à ciência atual." },
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
          O SCORE integra múltiplas dimensões da decisão clínica
        </h2>
        <p className="text-white/40 leading-relaxed max-w-3xl mb-10">
          A elegibilidade passa a considerar fatores clínicos, biológicos e técnicos de forma estruturada.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "Critérios clínicos organizados",
            "Variáveis biológicas consideradas",
            "Alinhamento à ciência atual",
            "Registro rastreável da decisão",
          ].map((label) => (
            <div key={label} className="group p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center transition-all duration-500 hover:-translate-y-1 hover:border-white/[0.12] hover:bg-white/[0.04]" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
              <span className="text-white/60 text-sm leading-relaxed transition-colors duration-500 group-hover:text-white/80">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SEÇÃO 5 – CTA FINAL */}
      <section className="py-24 px-8 md:px-16 text-center border-t border-white/[0.06]">
        <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
          Decidir com método é decidir com segurança.
        </h2>
        <p className="text-white/40 mb-8 max-w-xl mx-auto">
          Elegibilidade estruturada é parte essencial de uma prática regenerativa consistente.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate("/auth?mode=signup&redirect=%2Fselect-environment")}
            className="px-8 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Criar conta
          </button>
          <button
            onClick={() => navigate("/resultados")}
            className="px-8 py-3 text-sm font-medium text-white/50 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-all"
          >
            Ver Resultados
          </button>
        </div>
      </section>
    </InternalPageLayout>
  );
}
