import InternalPageLayout from "@/components/landing/InternalPageLayout";
import slideBg01 from "@/assets/slide-bg-01.jpg";

export default function ProblemaPage() {
  return (
    <InternalPageLayout>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: `url(${slideBg01})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center px-8 max-w-4xl">
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">O cenário atual</span>
          <h1 className="text-4xl md:text-6xl font-light text-white mb-6" style={{ fontFamily: "Georgia, serif" }}>
            O problema da Medicina Regenerativa
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Evidência fragmentada, protocolos variáveis e desfechos pouco comparáveis.
          </p>
        </div>
      </section>

      {/* Content sections */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-2xl font-light text-white mb-4" style={{ fontFamily: "Georgia, serif" }}>Fragmentação da evidência</h2>
            <p className="text-white/40 leading-relaxed">
              A medicina regenerativa avança rapidamente, mas sem padronização. Cada profissional segue protocolos próprios, tornando impossível comparar resultados entre clínicas, técnicas ou populações de pacientes.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-light text-white mb-4" style={{ fontFamily: "Georgia, serif" }}>Ausência de rastreabilidade</h2>
            <p className="text-white/40 leading-relaxed">
              Sem registro estruturado, cada procedimento é uma experiência isolada. Não há como construir uma base de evidência confiável, e o profissional não consegue demonstrar a qualidade da sua prática.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { num: "01", title: "Protocolos variáveis", desc: "Cada clínica opera de forma isolada, sem padrão de coleta ou registro." },
            { num: "02", title: "Desfechos incomparáveis", desc: "Sem métricas padronizadas, é impossível saber o que realmente funciona." },
            { num: "03", title: "Evidência como ruído", desc: "Dados existem, mas sem estrutura viram apenas anedotas clínicas." },
          ].map((item) => (
            <div key={item.num} className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <span className="text-primary text-xs tracking-[0.2em] mb-3 block">{item.num}</span>
              <h3 className="text-white text-lg font-medium mb-2">{item.title}</h3>
              <p className="text-white/35 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </InternalPageLayout>
  );
}
