import InternalPageLayout from "@/components/landing/InternalPageLayout";
import slideBg03 from "@/assets/slide-bg-03.jpg";

export default function ScorePage() {
  return (
    <InternalPageLayout>
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: `url(${slideBg03})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center px-8 max-w-4xl">
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Quantificação</span>
          <h1 className="text-3xl md:text-5xl font-light text-white mb-6">
            SCORE biológico e técnico
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Um índice estruturado para apoiar elegibilidade, risco e qualidade do procedimento com base em variáveis objetivas.
          </p>
        </div>
      </section>

      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-2xl font-light text-white mb-4">Variáveis objetivas</h2>
            <p className="text-white/40 leading-relaxed mb-6">
              O SCORE combina variáveis biológicas (idade, comorbidades, marcadores) e técnicas (tipo de procedimento, parâmetros, co-intervenções) para gerar um índice numérico comparável.
            </p>
            <div className="space-y-3">
              {["Elegibilidade do paciente", "Risco do procedimento", "Adequação técnica", "Qualidade do preparo"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-white/50 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-48 h-48 rounded-full border-4 border-primary/20 flex items-center justify-center relative">
              <div className="text-center">
                <span className="text-5xl font-light text-primary">87</span>
                <span className="block text-white/30 text-xs tracking-[0.2em] uppercase mt-1">Score</span>
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-primary" style={{ clipPath: "polygon(0 0, 100% 0, 100% 87%, 0 87%)" }} />
            </div>
          </div>
        </div>
      </section>
    </InternalPageLayout>
  );
}
