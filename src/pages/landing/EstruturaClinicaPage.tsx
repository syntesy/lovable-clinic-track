import InternalPageLayout from "@/components/landing/InternalPageLayout";
import slideBg02 from "@/assets/slide-bg-02.jpg";

export default function EstruturaClinicaPage() {
  return (
    <InternalPageLayout>
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: `url(${slideBg02})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center px-8 max-w-4xl">
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Metodologia</span>
          <h1 className="text-3xl md:text-5xl font-light text-white mb-6">
            Estrutura clínica padronizada
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Do primeiro registro ao follow-up, tudo documentado em um fluxo consistente e auditável.
          </p>
        </div>
      </section>

      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto">
        <div className="space-y-16">
          {[
            { step: "01", title: "Registro inicial", desc: "Captura padronizada de dados do paciente, histórico e queixa principal com campos estruturados." },
            { step: "02", title: "Avaliação e triagem", desc: "Score biológico e técnico para determinar elegibilidade e adequação do procedimento." },
            { step: "03", title: "Procedimento documentado", desc: "Registro completo do protocolo aplicado com parâmetros técnicos e variáveis de controle." },
            { step: "04", title: "Follow-up estruturado", desc: "Timepoints de acompanhamento com VAS, PRO e NPS em intervalos padronizados." },
            { step: "05", title: "Desfecho e análise", desc: "Consolidação dos resultados com métricas comparáveis e rastreabilidade completa." },
          ].map((item) => (
            <div key={item.step} className="flex gap-8 items-start">
              <span className="text-primary/30 text-5xl font-light shrink-0 w-16">{item.step}</span>
              <div>
                <h3 className="text-white text-xl font-medium mb-2">{item.title}</h3>
                <p className="text-white/40 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </InternalPageLayout>
  );
}
