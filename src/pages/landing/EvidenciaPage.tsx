import InternalPageLayout from "@/components/landing/InternalPageLayout";
import slideBg05 from "@/assets/slide-bg-05.jpg";

export default function EvidenciaPage() {
  return (
    <InternalPageLayout>
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: `url(${slideBg05})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center px-8 max-w-4xl">
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Ciência</span>
          <h1 className="text-4xl md:text-6xl font-light text-white mb-6">
            Evidência conectada à prática
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Curadoria científica e rastreabilidade: cada decisão clínica conectada ao que existe de melhor na literatura.
          </p>
        </div>
      </section>

      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-2xl font-light text-white mb-4">Curadoria científica</h2>
            <p className="text-white/40 leading-relaxed">
              Artigos revisados por pares, classificados por nível de evidência e conectados diretamente às dimensões do registro clínico. A ciência deixa de ser abstrata e passa a informar cada decisão.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-light text-white mb-4">Decisão informada</h2>
            <p className="text-white/40 leading-relaxed">
              Ao registrar um caso, o profissional tem acesso à evidência disponível para aquela combinação de técnica, patologia e região — em tempo real, sem sair do fluxo clínico.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "Revisão por pares", desc: "Cada artigo passa por curadoria humana antes de ser conectado ao registro." },
            { title: "Nível de evidência", desc: "Classificação estruturada: RCT, meta-análise, coorte, série de casos." },
            { title: "Vínculo dimensional", desc: "Conexão direta entre evidência e as dimensões técnica, patologia e região." },
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
