import InternalPageLayout from "@/components/landing/InternalPageLayout";
import slideBg06 from "@/assets/slide-bg-06.jpg";

export default function IntegridadePage() {
  return (
    <InternalPageLayout>
      {/* SEÇÃO 1 – HERO */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: `url(${slideBg06})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 text-center px-8 max-w-4xl">
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Governança</span>
          <h1 className="text-3xl md:text-5xl font-light text-white mb-6">
            Integridade estrutural dos dados
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Rastreabilidade, auditoria e segurança jurídica para cada registro da sua prática clínica.
          </p>
        </div>
      </section>

      {/* SEÇÃO 2 – CONTEXTO */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-2xl font-light text-white mb-4">Registro auditável</h2>
            <p className="text-white/40 leading-relaxed">
              Cada alteração é versionada. Cada registro possui hash de integridade. A trilha de auditoria permite verificar a autenticidade e a consistência dos dados ao longo do tempo — protegendo o profissional e o paciente.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-light text-white mb-4">Dados comparáveis</h2>
            <p className="text-white/40 leading-relaxed">
              Com estrutura padronizada e controle de versão, os dados clínicos passam a ser comparáveis entre profissionais, clínicas e períodos — base essencial para evolução da prática clínica.
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3 – DIFERENCIAIS */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <div className="space-y-12">
          {[
            { num: "01", title: "Versionamento completo", desc: "Cada registro mantém histórico completo de alterações com justificativa, permitindo rastrear qualquer mudança ao longo do tempo." },
            { num: "02", title: "Hash de integridade", desc: "Verificação criptográfica da autenticidade dos dados clínicos. Qualquer alteração não autorizada é detectável." },
            { num: "03", title: "Trilha de auditoria", desc: "Log imutável de todas as ações realizadas sobre cada registro — quem alterou, quando e por quê." },
            { num: "04", title: "Conformidade regulatória", desc: "Estrutura de dados que atende aos requisitos de documentação clínica e proteção de informações sensíveis." },
            { num: "05", title: "Segurança jurídica", desc: "Documentação rastreável que protege o profissional ao demonstrar aderência a padrões e diligência clínica." },
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
            <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Trilha de auditoria</span>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-6">
              Cada ação registrada. Cada dado protegido.
            </h2>
            <p className="text-white/40 leading-relaxed">
              O REGHEN cria uma camada de governança sobre seus dados clínicos. Toda alteração é documentada, toda versão preservada, toda decisão rastreável.
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4" style={{ boxShadow: "0 20px 60px -15px rgba(0,0,0,0.5)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
              <span className="text-white/40 text-xs tracking-wider uppercase">Log de auditoria</span>
            </div>
            <div className="space-y-3">
              {[
                { action: "Registro criado", time: "Hoje, 14:32", user: "Dr. Silva" },
                { action: "Score atualizado", time: "Hoje, 14:35", user: "Dr. Silva" },
                { action: "Follow-up 30d registrado", time: "Ontem, 09:10", user: "Dr. Silva" },
                { action: "Versão anterior preservada", time: "Ontem, 09:10", user: "Sistema" },
                { action: "Hash de integridade gerado", time: "Ontem, 09:11", user: "Sistema" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/[0.06] px-4 py-3">
                  <div>
                    <span className="text-white/40 text-sm block">{item.action}</span>
                    <span className="text-white/20 text-[10px]">{item.user}</span>
                  </div>
                  <span className="text-white/20 text-xs">{item.time}</span>
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
          A integridade dos dados não é apenas técnica — é proteção profissional. Com rastreabilidade completa, o profissional demonstra diligência, comprova condutas e opera com segurança jurídica.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "Comprovação de conduta", desc: "Cada decisão clínica documentada com trilha de auditoria que demonstra aderência a padrões." },
            { title: "Proteção contra disputas", desc: "Registros imutáveis e versionados que servem como evidência da qualidade da prática." },
            { title: "Confiança nos dados", desc: "Hash criptográfico e versionamento garantem que os dados clínicos são autênticos e íntegros." },
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
