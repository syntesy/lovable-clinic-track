import InternalPageLayout from "@/components/landing/InternalPageLayout";
import { useNavigate } from "react-router-dom";
import { BarChart3, TrendingUp, GitCompare, Link, Database } from "lucide-react";
import slideBg04 from "@/assets/slide-bg-04.jpg";

export default function ResultadosPage() {
  const navigate = useNavigate();

  return (
    <InternalPageLayout hideFooterCTA>
      {/* SEÇÃO 1 – HERO */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: `url(${slideBg04})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 text-center px-8 max-w-4xl">
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Mensuração Clínica</span>
          <h1 className="text-3xl md:text-5xl font-light text-white mb-6">
            Resultados estruturados e comparáveis
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed">
            Sem mensuração, não há clareza.
            <br />
            Com mensuração estruturada, há evolução clínica real.
          </p>
        </div>
      </section>

      {/* SEÇÃO 2 – PRINCIPAL */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
          O que acontece quando seus resultados são organizados de forma estruturada?
        </h2>
        <p className="text-white/50 text-lg leading-relaxed max-w-3xl mb-16">
          Quando desfechos são medidos de forma padronizada e longitudinal, cada intervenção passa a gerar evidência clínica aplicável.
        </p>

        <div className="space-y-12">
          {[
            { num: "01", title: "Métricas padronizadas", desc: "Utilização estruturada de escalas clínicas (VAS, PROs, funcionais) em checkpoints definidos." },
            { num: "02", title: "Acompanhamento longitudinal", desc: "Registro consistente da evolução do paciente ao longo do tempo." },
            { num: "03", title: "Comparabilidade clínica", desc: "Capacidade de analisar resultados entre diferentes protocolos e perfis de pacientes." },
            { num: "04", title: "Correlação protocolo × desfecho", desc: "Possibilidade de identificar padrões entre variáveis técnicas aplicadas e resposta clínica observada." },
            { num: "05", title: "Consolidação de dados estruturados", desc: "Transformação do atendimento individual em base organizada para análise metodológica." },
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
          Por que mensurar transforma a prática clínica?
        </h2>
        <p className="text-white/40 leading-relaxed max-w-3xl mb-10">
          Resultados organizados permitem sair da percepção subjetiva e avançar para decisão baseada em dados estruturados.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { icon: BarChart3, title: "Visibilidade da evolução", desc: "Clareza sobre resposta clínica real ao longo do tempo." },
            { icon: TrendingUp, title: "Identificação de padrões", desc: "Reconhecimento de tendências de melhora, estabilidade ou regressão." },
            { icon: GitCompare, title: "Aprimoramento metodológico", desc: "Ajuste progressivo de protocolos com base em dados organizados." },
            { icon: Link, title: "Integração com evidência científica", desc: "Correlação entre desfecho real e literatura disponível." },
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
          Resultados estruturados conectam prática e ciência
        </h2>
        <p className="text-white/40 leading-relaxed max-w-3xl mb-10">
          A mensuração organizada transforma atendimento individual em informação clínica comparável.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "Desfechos padronizados",
            "Acompanhamento longitudinal",
            "Análise comparativa estruturada",
            "Integração entre prática e literatura",
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
          Evolução clínica exige mensuração consistente.
        </h2>
        <p className="text-white/40 mb-8 max-w-xl mx-auto">
          Resultados estruturados permitem consistência metodológica ao longo do tempo.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate("/auth?mode=signup&redirect=%2Fselect-environment")}
            className="px-8 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Criar conta
          </button>
          <button
            onClick={() => navigate("/evidencia")}
            className="px-8 py-3 text-sm font-medium text-white/50 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-all"
          >
            Ver Evidência
          </button>
        </div>
      </section>
    </InternalPageLayout>
  );
}
