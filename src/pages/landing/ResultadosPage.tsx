import InternalPageLayout from "@/components/landing/InternalPageLayout";
import slideBg04 from "@/assets/slide-bg-04.jpg";

export default function ResultadosPage() {
  return (
    <InternalPageLayout>
      {/* SEÇÃO 1 – HERO */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: `url(${slideBg04})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 text-center px-8 max-w-4xl">
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Mensuração</span>
          <h1 className="text-3xl md:text-5xl font-light text-white mb-6">
            Resultados mensuráveis
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            VAS, PRO, NPS e desfechos longitudinais por timepoints — mensuração real do que funciona na sua prática.
          </p>
        </div>
      </section>

      {/* SEÇÃO 2 – CONTEXTO */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-2xl font-light text-white mb-4">Mensuração padronizada</h2>
            <p className="text-white/40 leading-relaxed">
              O REGHEN utiliza escalas clínicas validadas para medir dor, função e satisfação em intervalos padronizados. Cada procedimento gera dados comparáveis que mostram a evolução real do paciente.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-light text-white mb-4">Desfechos longitudinais</h2>
            <p className="text-white/40 leading-relaxed">
              Com timepoints em 30, 90, 180 e 365 dias, o profissional acompanha a trajetória do resultado ao longo do tempo — não apenas o efeito imediato, mas a sustentabilidade da melhora.
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3 – DIFERENCIAIS */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <div className="space-y-12">
          {[
            { num: "01", title: "VAS — Escala de dor", desc: "Escala visual analógica padronizada aplicada em cada timepoint para mensuração objetiva da evolução da dor." },
            { num: "02", title: "PRO — Resultado funcional", desc: "Resultado reportado pelo paciente que captura a percepção funcional e a melhoria na qualidade de vida." },
            { num: "03", title: "NPS — Satisfação clínica", desc: "Net Promoter Score clínico que mede a satisfação do paciente com o procedimento e o atendimento." },
            { num: "04", title: "Follow-up longitudinal", desc: "Acompanhamento estruturado em 30, 90, 180 e 365 dias para visão completa da trajetória do resultado." },
            { num: "05", title: "Comparação entre procedimentos", desc: "Dados padronizados permitem comparar desfechos entre técnicas, regiões e perfis de paciente." },
          ].map((item) => (
            <div key={item.num} className="flex gap-8 items-start">
              <span className="text-primary/30 text-5xl font-light shrink-0 w-16">{item.num}</span>
              <div>
                <h3 className="text-white text-xl font-medium mb-2">{item.title}</h3>
                <p className="text-white/40 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEÇÃO 4 – VISUAL DO PRODUTO */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Evolução do paciente</span>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-6">
              Cada resultado rastreável e comparável
            </h2>
            <p className="text-white/40 leading-relaxed">
              O REGHEN transforma cada follow-up em dado mensurável. Ao longo do tempo, o profissional constrói uma visão clara do que funciona na sua prática.
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4" style={{ boxShadow: "0 20px 60px -15px rgba(0,0,0,0.5)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
              <span className="text-white/40 text-xs tracking-wider uppercase">Desfechos por timepoint</span>
            </div>
            <div className="space-y-3">
              {[
                { time: "Baseline", pct: 0 },
                { time: "30 dias", pct: 35 },
                { time: "90 dias", pct: 62 },
                { time: "180 dias", pct: 78 },
                { time: "365 dias", pct: 85 },
              ].map((tp) => (
                <div key={tp.time} className="flex items-center gap-3">
                  <span className="text-white/40 text-xs w-16 shrink-0">{tp.time}</span>
                  <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full bg-primary/50 rounded-full" style={{ width: `${tp.pct}%` }} />
                  </div>
                  <span className="text-white/30 text-xs w-8 text-right">{tp.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 5 – IMPACTO PRÁTICO */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <h2 className="text-2xl font-light text-white mb-4">Impacto na sua prática</h2>
        <p className="text-white/40 leading-relaxed max-w-3xl mb-10">
          A mensuração contínua permite ao profissional identificar padrões de melhora, ajustar protocolos e demonstrar a eficácia real de cada intervenção com dados objetivos.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "Visibilidade real", desc: "Saiba exatamente como seus pacientes evoluem ao longo do tempo com métricas padronizadas." },
            { title: "Ajuste de protocolo", desc: "Identifique quais técnicas geram melhores desfechos e refine sua abordagem com base em dados." },
            { title: "Demonstração de valor", desc: "Apresente resultados mensuráveis que comprovam a qualidade do seu trabalho clínico." },
          ].map((item) => (
            <div key={item.title} className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <h3 className="text-white text-lg font-medium mb-2">{item.title}</h3>
              <p className="text-white/35 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </InternalPageLayout>
  );
}
