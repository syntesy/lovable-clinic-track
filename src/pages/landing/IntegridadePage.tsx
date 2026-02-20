import InternalPageLayout from "@/components/landing/InternalPageLayout";
import slideBg06 from "@/assets/slide-bg-06.jpg";

export default function IntegridadePage() {
  return (
    <InternalPageLayout>
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: `url(${slideBg06})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center px-8 max-w-4xl">
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Governança</span>
          <h1 className="text-4xl md:text-6xl font-light text-white mb-6" style={{ fontFamily: "Georgia, serif" }}>
            Integridade estrutural dos dados
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Consistência metodológica, rastreabilidade e estabilidade dos registros para produzir dados comparáveis e confiáveis.
          </p>
        </div>
      </section>

      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-2xl font-light text-white mb-4" style={{ fontFamily: "Georgia, serif" }}>Registro auditável</h2>
            <p className="text-white/40 leading-relaxed">
              Cada alteração é versionada. Cada registro possui hash de integridade. A trilha de auditoria permite verificar a autenticidade e a consistência dos dados ao longo do tempo.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-light text-white mb-4" style={{ fontFamily: "Georgia, serif" }}>Dados comparáveis</h2>
            <p className="text-white/40 leading-relaxed">
              Com estrutura padronizada e controle de versão, os dados clínicos passam a ser comparáveis entre profissionais, clínicas e períodos — base essencial para evidência real.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "Versionamento", desc: "Cada registro mantém histórico completo de alterações com justificativa." },
            { title: "Hash de integridade", desc: "Verificação criptográfica da autenticidade dos dados clínicos." },
            { title: "Trilha de auditoria", desc: "Log imutável de todas as ações realizadas sobre cada registro." },
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
