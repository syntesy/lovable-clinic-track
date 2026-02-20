import InternalPageLayout from "@/components/landing/InternalPageLayout";
import slideBg03 from "@/assets/slide-bg-03.jpg";

export default function ScorePage() {
  return (
    <InternalPageLayout>
      {/* SEÇÃO 1 – HERO */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: `url(${slideBg03})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 text-center px-8 max-w-4xl">
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Quantificação</span>
          <h1 className="text-3xl md:text-5xl font-light text-white mb-6">
            SCORE biológico e técnico
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Critérios objetivos para apoiar elegibilidade, avaliar risco e proteger a conduta do profissional com base em ciência.
          </p>
        </div>
      </section>

      {/* SEÇÃO 2 – CONTEXTO */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-2xl font-light text-white mb-4">Critérios objetivos</h2>
            <p className="text-white/40 leading-relaxed">
              O SCORE combina variáveis biológicas e técnicas para gerar um índice numérico que apoia a decisão clínica. Ele não substitui o julgamento do profissional — ele o protege com dados objetivos.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-light text-white mb-4">Proteção profissional</h2>
            <p className="text-white/40 leading-relaxed">
              Documentar a adequação de cada procedimento com um índice estruturado demonstra diligência clínica. O SCORE é uma ferramenta de proteção para o profissional que quer operar com segurança.
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3 – DIFERENCIAIS */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <div className="space-y-12">
          {[
            { num: "01", title: "Elegibilidade do paciente", desc: "Avaliação padronizada de critérios clínicos que determinam se o paciente é candidato adequado ao procedimento." },
            { num: "02", title: "Risco do procedimento", desc: "Quantificação objetiva dos fatores de risco associados, permitindo decisão informada antes da intervenção." },
            { num: "03", title: "Adequação técnica", desc: "Verificação estruturada de que o protocolo escolhido é compatível com o perfil clínico do paciente." },
            { num: "04", title: "Qualidade do preparo biológico", desc: "Índice que avalia parâmetros laboratoriais e de processamento, garantindo controle de qualidade do material." },
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
            <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Índice estruturado</span>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-6">
              Um número que protege sua decisão
            </h2>
            <p className="text-white/40 leading-relaxed">
              O SCORE transforma variáveis clínicas dispersas em um índice consolidado e comparável — documentando a qualidade técnica de cada procedimento.
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6" style={{ boxShadow: "0 20px 60px -15px rgba(0,0,0,0.5)" }}>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
              <span className="text-white/40 text-xs tracking-wider uppercase">Score do procedimento</span>
            </div>
            <div className="flex items-center justify-center mb-6">
              <div className="w-40 h-40 rounded-full border-4 border-primary/20 flex items-center justify-center relative">
                <div className="text-center">
                  <span className="text-5xl font-light text-primary">87</span>
                  <span className="block text-white/30 text-xs tracking-[0.2em] uppercase mt-1">Score</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Biológico", value: "91" },
                { label: "Técnico", value: "83" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                  <span className="block text-white/30 text-[10px] uppercase tracking-wider mb-1">{s.label}</span>
                  <span className="block text-white text-lg font-light">{s.value}</span>
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
          O SCORE dá ao profissional uma base objetiva para justificar sua conduta. Cada procedimento passa a ter documentação quantificada de adequação — protegendo a prática e demonstrando qualidade.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "Decisão documentada", desc: "Cada procedimento tem um registro objetivo que justifica a escolha técnica e a adequação ao paciente." },
            { title: "Segurança jurídica", desc: "A quantificação de critérios demonstra diligência e aderência a padrões clínicos reconhecidos." },
            { title: "Qualidade mensurável", desc: "O índice permite acompanhar a evolução da qualidade técnica ao longo do tempo e entre procedimentos." },
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
