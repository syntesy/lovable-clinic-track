import { useNavigate, useLocation } from "react-router-dom";
import { Zap, FlaskConical, Puzzle, Award } from "lucide-react";
import InternalPageLayout from "@/components/landing/InternalPageLayout";
import slideBg05 from "@/assets/slide-bg-05.jpg";

export default function AcademyLandingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const getRedirectPath = () => {
    const params = new URLSearchParams(location.search);
    return params.get("redirect") || "/select-environment";
  };

  return (
    <InternalPageLayout hideFooterCTA>
      {/* SEÇÃO 1 – HERO */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: `url(${slideBg05})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-black/[0.03]" />
        <div className="relative z-10 text-center px-8 max-w-4xl">
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Reghen Academy</span>
          <h1 className="text-3xl md:text-5xl font-light text-white mb-6">
            Formação integrada à prática clínica
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-4 text-teal-50">
            Aprender sem aplicar gera informação.<br />
            Aprender com estrutura gera evolução clínica.
          </p>
          <p className="text-white/40 text-sm max-w-xl mx-auto mb-10">
            A REGHEN Academy conecta atualização científica, padronização metodológica e aplicação prática no fluxo clínico.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate(`/auth?mode=signup&redirect=${encodeURIComponent(getRedirectPath())}`)}
              className="px-8 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Criar conta
            </button>
            <button
              onClick={() => navigate("/estrutura-clinica")}
              className="px-8 py-3 text-sm font-medium text-white/50 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-all"
            >
              Ver Estrutura Clínica
            </button>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2 – BLOCOS 01–05 */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
          O que diferencia a REGHEN Academy?
        </h2>
        <p className="text-white/50 leading-relaxed max-w-3xl mb-14">
          Educação aplicada é parte da infraestrutura clínica.
        </p>

        <div className="space-y-12">
          {[
            { num: "01", title: "Conteúdo orientado à prática", desc: "Formação focada em decisão clínica, acompanhamento e desfechos estruturados." },
            { num: "02", title: "Integração com o fluxo clínico", desc: "Aprendizado conectado às etapas reais do método: elegibilidade, protocolo, follow-up e resultado." },
            { num: "03", title: "Atualização baseada em evidência", desc: "Conteúdo alinhado à curadoria científica contínua e à literatura de maior nível de evidência." },
            { num: "04", title: "Padronização metodológica", desc: "Ensino de critérios objetivos para elegibilidade, monitoramento e mensuração longitudinal." },
            { num: "05", title: "Evolução profissional contínua", desc: "Ambiente educacional integrado ao ecossistema REGHEN, promovendo atualização permanente." },
          ].map((item) => (
            <div key={item.num} className="group flex gap-8 items-start cursor-default">
              <span className="text-primary/30 text-5xl font-light shrink-0 w-16 transition-all duration-300 group-hover:text-primary/60 group-hover:drop-shadow-[0_0_12px_rgba(160,111,76,0.3)]">{item.num}</span>
              <div>
                <h3 className="text-white text-xl font-medium mb-2 transition-all duration-300 group-hover:text-primary/90">{item.title}</h3>
                <p className="text-white/40 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEÇÃO 3 – IMPACTO NA PRÁTICA */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <div className="text-center mb-16">
          <span className="text-primary text-xs tracking-[0.3em] uppercase mb-4 block">Impacto na prática</span>
          <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
            Educação que transforma conduta
          </h2>
          <p className="text-white/50 leading-relaxed max-w-2xl mx-auto">
            Quando formação e prática estão conectadas, a evolução clínica se torna consistente e mensurável.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { icon: Zap, title: "Aplicação imediata", desc: "Conteúdo transferível diretamente para o atendimento clínico." },
            { icon: FlaskConical, title: "Critério científico consolidado", desc: "Evidência traduzida em parâmetros objetivos de decisão." },
            { icon: Puzzle, title: "Integração com estrutura clínica", desc: "Conhecimento alinhado ao método e às métricas do sistema." },
            { icon: Award, title: "Autoridade profissional ampliada", desc: "Clareza técnica e consistência fortalecem posicionamento clínico." },
          ].map((item) => (
            <div key={item.title} className="group relative p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.05] hover:shadow-[0_8px_40px_-12px_rgba(160,111,76,0.15),inset_0_1px_0_rgba(255,255,255,0.04)] hover:-translate-y-1 cursor-default">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/[0.08] border border-primary/[0.12] flex items-center justify-center shrink-0 transition-all duration-500 group-hover:bg-primary/[0.15] group-hover:border-primary/[0.25] group-hover:shadow-[0_0_20px_-4px_rgba(160,111,76,0.3)]">
                  <item.icon className="w-4.5 h-4.5 text-primary/60 transition-colors duration-500 group-hover:text-primary" />
                </div>
                <div>
                  <h3 className="text-white text-[15px] font-medium mb-1.5 transition-colors duration-300 group-hover:text-primary/90">{item.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEÇÃO 4 – PAPEL ESTRATÉGICO */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
          Educação não é evento. É processo contínuo.
        </h2>
        <p className="text-white/40 leading-relaxed max-w-3xl mb-10">
          A REGHEN Academy funciona como eixo formativo permanente, conectando ciência atual, aplicação prática e padronização clínica.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            "Trilhas estruturadas por procedimento",
            "Conteúdo alinhado à ciência atual",
            "Integração com SCORE e Follow-up",
            "Base para consistência metodológica",
          ].map((item) => (
            <div key={item} className="p-5 rounded-xl border border-white/[0.10] bg-white/[0.04] flex items-start gap-3 transition-all duration-500 hover:border-white/[0.18] hover:bg-white/[0.08] hover:shadow-[0_8px_30px_-10px_rgba(160,111,76,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] hover:-translate-y-0.5 cursor-default">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0" />
              <span className="text-white/60 text-sm leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SEÇÃO 5 – CTA FINAL */}
      <section className="py-24 px-8 md:px-16 text-center border-t border-white/[0.06]">
        <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
          Evoluir exige método.
        </h2>
        <p className="text-white/40 mb-8 max-w-xl mx-auto">
          Integre conhecimento, prática e evidência no mesmo ecossistema clínico.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate(`/auth?mode=signup&redirect=${encodeURIComponent(getRedirectPath())}`)}
            className="px-8 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Criar conta
          </button>
          <button
            onClick={() => navigate("/evidencia")}
            className="px-8 py-3 text-sm font-medium text-white/50 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-all"
          >
            Ver Evidência
          </button>
        </div>
      </section>
    </InternalPageLayout>
  );
}
