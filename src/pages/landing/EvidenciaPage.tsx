import InternalPageLayout from "@/components/landing/InternalPageLayout";
import slideBg05 from "@/assets/slide-bg-05.jpg";

export default function EvidenciaPage() {
  return (
    <InternalPageLayout>
      {/* SEÇÃO 1 – HERO */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: `url(${slideBg05})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 text-center px-8 max-w-4xl">
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Ciência aplicada</span>
          <h1 className="text-3xl md:text-5xl font-light text-white mb-6">
            Evidência conectada à prática
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Curadoria científica integrada ao fluxo clínico — cada decisão conectada ao que existe de melhor na literatura.
          </p>
        </div>
      </section>

      {/* SEÇÃO 2 – CONTEXTO */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-2xl font-light text-white mb-4">Ciência dentro do fluxo</h2>
            <p className="text-white/40 leading-relaxed">
              O REGHEN conecta evidência científica diretamente ao registro clínico. O profissional acessa a literatura relevante no momento da decisão — sem sair do fluxo de atendimento e sem depender de buscas manuais.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-light text-white mb-4">Curadoria estruturada</h2>
            <p className="text-white/40 leading-relaxed">
              Cada artigo é revisado, classificado por nível de evidência e vinculado às dimensões clínicas do registro — técnica, patologia e região. A ciência deixa de ser abstrata e passa a informar a prática.
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3 – DIFERENCIAIS */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <div className="space-y-12">
          {[
            { num: "01", title: "Revisão por pares", desc: "Cada artigo passa por curadoria humana antes de ser conectado ao registro clínico, garantindo qualidade e relevância." },
            { num: "02", title: "Classificação por nível de evidência", desc: "RCT, meta-análise, coorte, série de casos — cada estudo classificado para que o profissional saiba o peso da informação." },
            { num: "03", title: "Vínculo dimensional", desc: "Conexão direta entre evidência e as dimensões do registro: técnica aplicada, patologia tratada e região anatômica." },
            { num: "04", title: "Acesso contextual", desc: "Ao registrar um caso, o profissional visualiza a evidência disponível para aquela combinação específica — em tempo real." },
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
            <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Evidência integrada</span>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-6">
              Ciência que informa, não que paralisa
            </h2>
            <p className="text-white/40 leading-relaxed">
              O REGHEN traz a evidência para dentro do fluxo clínico, sem transformar o profissional em pesquisador. A ciência aparece no momento certo, no contexto certo.
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4" style={{ boxShadow: "0 20px 60px -15px rgba(0,0,0,0.5)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
              <span className="text-white/40 text-xs tracking-wider uppercase">Curadoria científica</span>
            </div>
            <div className="space-y-3">
              {[
                { level: "Meta-análise", tag: "Nível I", articles: "12 artigos" },
                { level: "RCT", tag: "Nível II", articles: "34 artigos" },
                { level: "Coorte", tag: "Nível III", articles: "28 artigos" },
                { level: "Série de casos", tag: "Nível IV", articles: "45 artigos" },
              ].map((item) => (
                <div key={item.level} className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/[0.06] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-primary/60 text-[10px] tracking-wider uppercase font-medium">{item.tag}</span>
                    <span className="text-white/40 text-sm">{item.level}</span>
                  </div>
                  <span className="text-white/25 text-xs">{item.articles}</span>
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
          Com evidência integrada ao fluxo, o profissional toma decisões mais seguras, justifica condutas com base científica e evolui sua prática de forma contínua e informada.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "Decisão informada", desc: "Acesse a evidência relevante para cada caso no momento da decisão clínica, sem interromper o fluxo." },
            { title: "Justificativa científica", desc: "Documente a base científica de cada conduta, fortalecendo sua posição profissional e técnica." },
            { title: "Evolução contínua", desc: "Acompanhe atualizações da literatura conectadas à sua prática e refine protocolos com base em ciência." },
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
