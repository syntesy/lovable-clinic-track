import InternalPageLayout from "@/components/landing/InternalPageLayout";
import slideBg02 from "@/assets/slide-bg-02.jpg";

export default function EstruturaClinicaPage() {
  return (
    <InternalPageLayout>
      {/* SEÇÃO 1 – HERO */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: `url(${slideBg02})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-black/20" />
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

      {/* SEÇÃO 2 – CONTEXTO */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-2xl font-light text-white mb-4">Fluxo clínico organizado</h2>
            <p className="text-white/40 leading-relaxed">
              O REGHEN organiza a prática clínica em etapas sequenciais e padronizadas. Cada fase do atendimento segue um protocolo estruturado que garante consistência, independentemente do profissional ou da clínica.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-light text-white mb-4">Registro auditável</h2>
            <p className="text-white/40 leading-relaxed">
              Toda informação registrada é rastreável e versionada. O sistema garante que nenhum dado seja perdido ou alterado sem justificativa, criando uma trilha de auditoria completa.
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3 – DIFERENCIAIS */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <div className="space-y-12">
          {[
            { step: "01", title: "Registro inicial", desc: "Captura padronizada de dados do paciente, histórico e queixa principal com campos estruturados e validados." },
            { step: "02", title: "Avaliação e triagem", desc: "Score biológico e técnico para determinar elegibilidade e adequação do procedimento com critérios objetivos." },
            { step: "03", title: "Procedimento documentado", desc: "Registro completo do protocolo aplicado com parâmetros técnicos, variáveis de controle e rastreabilidade." },
            { step: "04", title: "Follow-up estruturado", desc: "Timepoints de acompanhamento com VAS, PRO e NPS em intervalos padronizados de 30, 90, 180 e 365 dias." },
            { step: "05", title: "Desfecho e análise", desc: "Consolidação dos resultados com métricas comparáveis, rastreabilidade completa e visão longitudinal." },
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

      {/* SEÇÃO 4 – VISUAL DO PRODUTO */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Fluxo padronizado</span>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-6">
              Cada etapa conectada ao resultado final
            </h2>
            <p className="text-white/40 leading-relaxed">
              O fluxo do REGHEN garante que nenhuma informação se perca entre a consulta inicial e o desfecho. Cada registro alimenta uma visão clínica completa e comparável.
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4" style={{ boxShadow: "0 20px 60px -15px rgba(0,0,0,0.5)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
              <span className="text-white/40 text-xs tracking-wider uppercase">Fluxo clínico</span>
            </div>
            <div className="space-y-3">
              {["Registro inicial", "Triagem & Score", "Procedimento", "Follow-up 30d", "Follow-up 90d", "Desfecho"].map((step, i) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 border border-primary/20">
                    <span className="text-primary text-[10px] font-medium">{i + 1}</span>
                  </div>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-white/40 text-xs">{step}</span>
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
          Com o fluxo estruturado, o profissional ganha velocidade no atendimento, consistência nos registros e segurança na documentação — sem perder flexibilidade clínica.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "Atendimento mais rápido", desc: "Campos pré-estruturados eliminam retrabalho e garantem que nenhuma informação essencial seja esquecida." },
            { title: "Dados consistentes", desc: "Todos os registros seguem a mesma lógica, permitindo comparação real entre pacientes e procedimentos." },
            { title: "Documentação segura", desc: "Trilha de auditoria e versionamento protegem o profissional e a integridade dos dados clínicos." },
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
