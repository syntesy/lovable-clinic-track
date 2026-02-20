import { useEffect, useRef } from "react";
import InternalPageLayout from "@/components/landing/InternalPageLayout";
import { useNavigate } from "react-router-dom";
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
          <h1 className="text-4xl md:text-6xl font-light text-white mb-6">
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
            <h2 className="text-2xl font-light text-white mb-4">Fragmentação da evidência</h2>
            <p className="text-white/40 leading-relaxed">
              A medicina regenerativa avança rapidamente, mas sem padronização. Cada profissional segue protocolos próprios, tornando impossível comparar resultados entre clínicas, técnicas ou populações de pacientes.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-light text-white mb-4">Ausência de rastreabilidade</h2>
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

      {/* Seção Solução */}
      <SolucaoSection />
    </InternalPageLayout>
  );
}

function SolucaoSection() {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("opacity-100", "translate-y-0");
          el.classList.remove("opacity-0", "translate-y-8");
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const getRedirectPath = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("redirect") || "/select-environment";
  };

  return (
    <section
      ref={sectionRef}
      id="estrutura-solucao"
      className="min-h-[90vh] flex items-center px-8 md:px-16 py-24 opacity-0 translate-y-8 transition-all duration-[900ms] ease-out"
      style={{ background: "linear-gradient(180deg, rgba(8,11,20,1) 0%, rgba(14,18,30,1) 50%, rgba(8,11,20,1) 100%)" }}
    >
      <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center">
        {/* Left — Text */}
          <div className="space-y-8">
          <span className="text-primary text-xs tracking-[0.3em] uppercase block">Como o REGHEN resolve isso</span>
          <h2 className="text-3xl md:text-[2.6rem] leading-[1.2] font-light text-white">
            Estrutura criada para potencializar seus{" "}
            <span className="text-[#A06F4C]">resultados clínicos</span>.
          </h2>

          <div className="space-y-1 text-white/40 text-lg italic">
            <p>Sem organização, não há clareza.</p>
            <p>Sem clareza, não há evolução clínica.</p>
          </div>

          <ul className="space-y-3 text-white/50 leading-relaxed text-[15px]">
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#A06F4C] flex-shrink-0" />
              Organiza o registro clínico e padroniza o fluxo do atendimento
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#A06F4C] flex-shrink-0" />
              Transforma cada procedimento em acompanhamento comparável (baseline e follow-ups)
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#A06F4C] flex-shrink-0" />
              Mostra o que funciona na sua prática — para melhorar seus resultados
            </li>
          </ul>

          <p className="text-white/60 font-medium text-[15px]">
            Melhorar resultado deixa de ser tentativa.<br />
            Passa a ser método.
          </p>

          <div className="flex items-center gap-4 pt-4">
            <button
              onClick={() => navigate(`/auth?mode=signup&redirect=${encodeURIComponent(getRedirectPath())}`)}
              className="px-7 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Criar conta
            </button>
            <button
              onClick={() => navigate(`/auth?redirect=${encodeURIComponent(getRedirectPath())}`)}
              className="px-7 py-3 text-sm font-medium text-white/50 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-all"
            >
              Entrar
            </button>
          </div>
        </div>

        {/* Right — Dashboard Mock */}
        <div className="relative">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-5" style={{ boxShadow: "0 20px 60px -15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
            {/* Mock header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#A06F4C]/60" />
                <span className="text-white/40 text-xs tracking-wider uppercase">Painel clínico</span>
              </div>
              <span className="text-white/20 text-[11px]">Atualizado agora</span>
            </div>

            {/* Score bar */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/50 text-xs">SCORE geral</span>
                <span className="text-[#A06F4C] text-sm font-semibold">78 / 100</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#A06F4C]/60 to-[#A06F4C] w-[78%] transition-all duration-700" />
              </div>
            </div>

            {/* Mini cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Procedimentos", value: "124" },
                { label: "Follow-ups", value: "89" },
                { label: "Melhora VAS", value: "62%" },
              ].map((m) => (
                <div key={m.label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                  <span className="block text-white/30 text-[10px] uppercase tracking-wider mb-1">{m.label}</span>
                  <span className="block text-white text-lg font-light">{m.value}</span>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <span className="text-white/30 text-[10px] uppercase tracking-wider">Timeline recente</span>
              {[
                { dot: "bg-[#5E8F7B]", text: "PRP Joelho — Follow-up 90d concluído" },
                { dot: "bg-[#4A6378]", text: "Registro padronizado — Score atualizado" },
                { dot: "bg-[#A06F4C]", text: "Novo procedimento — Baseline registrado" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${item.dot} flex-shrink-0`} />
                  <span className="text-white/35 text-xs">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subtle glow behind card */}
          <div className="absolute -inset-4 rounded-3xl bg-[#A06F4C]/[0.03] blur-2xl -z-10" />
        </div>
      </div>
    </section>
  );
}
