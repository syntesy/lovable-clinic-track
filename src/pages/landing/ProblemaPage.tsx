import InternalPageLayout from "@/components/landing/InternalPageLayout";
import slideBg01 from "@/assets/slide-bg-01-new.png";

export default function ProblemaPage() {
  return (
    <InternalPageLayout>
      {/* SEÇÃO 1 – HERO */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: `url(${slideBg01})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 text-center px-8 max-w-4xl">
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">O cenário atual</span>
          <h1 className="text-3xl md:text-5xl font-light text-white mb-6">
            O problema da Medicina Regenerativa
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Evidência fragmentada, protocolos variáveis e desfechos pouco comparáveis. Sem padronização, a prática clínica se torna imprevisível.
          </p>
        </div>
      </section>

      {/* SEÇÃO 2 – CONTEXTO */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-2xl font-light text-white mb-4">Fragmentação da evidência</h2>
            <p className="text-white/40 leading-relaxed">
              A medicina regenerativa avança rapidamente, mas sem padronização. Cada profissional segue protocolos próprios, tornando impossível comparar resultados entre clínicas, técnicas ou populações de pacientes.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-light text-white mb-4">Ausência de rastreabilidade</h2>
            <p className="text-white/40 leading-relaxed">
              Sem registro estruturado, cada procedimento é uma experiência isolada. O profissional não consegue demonstrar a qualidade da sua prática nem construir uma base de dados confiável.
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3 – DIFERENCIAIS */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <div className="space-y-12">
          {[
            { num: "01", title: "Protocolos variáveis", desc: "Cada clínica opera de forma isolada, sem padrão de coleta ou registro. O resultado é uma prática descoordenada e não comparável." },
            { num: "02", title: "Desfechos incomparáveis", desc: "Sem métricas padronizadas, é impossível saber o que realmente funciona. Cada profissional mede o sucesso à sua maneira." },
            { num: "03", title: "Evidência como ruído", desc: "Dados existem, mas sem estrutura viram apenas anedotas clínicas. Não há base para decisão informada." },
            { num: "04", title: "Risco profissional", desc: "Sem documentação estruturada, o profissional fica exposto juridicamente. Não há como comprovar a adequação da conduta." },
            { num: "05", title: "Evolução estagnada", desc: "Sem mensuração longitudinal, não há como identificar padrões de melhora ou piora. A prática não evolui de forma objetiva." },
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
            <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Como o REGHEN resolve isso</span>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-6">
              Estrutura criada para organizar sua prática clínica
            </h2>
            <p className="text-white/40 leading-relaxed">
              O REGHEN substitui a fragmentação por um fluxo padronizado — do registro à mensuração de resultados — garantindo rastreabilidade e consistência em cada procedimento.
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4" style={{ boxShadow: "0 20px 60px -15px rgba(0,0,0,0.5)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
              <span className="text-white/40 text-xs tracking-wider uppercase">Visão do cenário</span>
            </div>
            <div className="space-y-3">
              {[
                { label: "Sem REGHEN", items: ["Registros manuais", "Sem padronização", "Dados isolados"] },
                { label: "Com REGHEN", items: ["Fluxo estruturado", "Métricas padronizadas", "Dados comparáveis"] },
              ].map((col) => (
                <div key={col.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <span className="text-white/50 text-xs uppercase tracking-wider block mb-3">{col.label}</span>
                  <div className="space-y-2">
                    {col.items.map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                        <span className="text-white/35 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
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
          Quando o cenário é estruturado, o profissional sai da tentativa e erro para a decisão informada. O REGHEN transforma cada procedimento em dado comparável — e cada dado em melhoria real.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "Clareza no registro", desc: "Cada atendimento gera dados padronizados que podem ser auditados e comparados." },
            { title: "Base para decisão", desc: "Dados estruturados permitem identificar o que funciona — e replicar com segurança." },
            { title: "Proteção profissional", desc: "Documentação rastreável que protege sua conduta e demonstra diligência clínica." },
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
