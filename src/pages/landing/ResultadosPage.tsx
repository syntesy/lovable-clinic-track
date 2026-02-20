import InternalPageLayout from "@/components/landing/InternalPageLayout";
import slideBg04 from "@/assets/slide-bg-04.jpg";

export default function ResultadosPage() {
  return (
    <InternalPageLayout>
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: `url(${slideBg04})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center px-8 max-w-4xl">
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Mensuração</span>
          <h1 className="text-4xl md:text-6xl font-light text-white mb-6" style={{ fontFamily: "Georgia, serif" }}>
            Resultados mensuráveis
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            VAS, PRO, NPS e desfechos longitudinais por timepoints — mensuração real do que funciona na sua prática.
          </p>
        </div>
      </section>

      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { label: "VAS", value: "Dor", desc: "Escala visual analógica padronizada" },
            { label: "PRO", value: "Funcional", desc: "Resultado reportado pelo paciente" },
            { label: "NPS", value: "Satisfação", desc: "Net Promoter Score clínico" },
            { label: "Follow-up", value: "Longitudinal", desc: "30, 90, 180 e 365 dias" },
          ].map((item) => (
            <div key={item.label} className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
              <span className="text-primary text-xs tracking-[0.2em] uppercase block mb-2">{item.label}</span>
              <span className="text-white text-xl font-medium block mb-1">{item.value}</span>
              <span className="text-white/30 text-xs">{item.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <h2 className="text-2xl font-light text-white mb-8" style={{ fontFamily: "Georgia, serif" }}>Desfechos por timepoint</h2>
        <div className="space-y-4">
          {[
            { time: "Baseline", pct: 0 },
            { time: "30 dias", pct: 35 },
            { time: "90 dias", pct: 62 },
            { time: "180 dias", pct: 78 },
            { time: "365 dias", pct: 85 },
          ].map((tp) => (
            <div key={tp.time} className="flex items-center gap-4">
              <span className="text-white/40 text-sm w-20 shrink-0">{tp.time}</span>
              <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${tp.pct}%` }} />
              </div>
              <span className="text-white/30 text-xs w-10 text-right">{tp.pct}%</span>
            </div>
          ))}
        </div>
      </section>
    </InternalPageLayout>
  );
}
