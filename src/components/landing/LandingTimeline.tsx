import { motion } from "framer-motion";

const steps = [
  { num: "01", title: "Paciente e atendimento", desc: "Cadastro e abertura do atendimento clínico." },
  { num: "02", title: "Registro Padronizado (PSR)", desc: "Procedimento documentado com estrutura e rastreabilidade." },
  { num: "03", title: "Checklist e método", desc: "Verificação técnica, protocolo e controle de conformidade." },
  { num: "04", title: "Desfechos longitudinais", desc: "Registro por timepoint: baseline → m1 → m3 → m6 → m12." },
  { num: "05", title: "Painel de análise", desc: "Visualização interna dos resultados da clínica." },
];

export default function LandingTimeline() {
  return (
    <section id="como-funciona" className="relative py-28 md:py-36 px-6" aria-labelledby="timeline-heading">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-medium mb-4">Como funciona</p>
          <h2 id="timeline-heading" className="text-foreground text-2xl md:text-3xl font-semibold tracking-tight">
            Da consulta ao desfecho, com estrutura clínica
          </h2>
        </motion.div>

        {/* Desktop: horizontal timeline */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Line */}
            <div className="absolute top-6 left-0 right-0 h-px bg-border/40" aria-hidden="true" />

            <div className="grid grid-cols-5 gap-4">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="relative pt-12"
                >
                  {/* Dot */}
                  <div className="absolute top-4 left-0 w-4 h-4 rounded-full border-2 border-primary/50 bg-background" aria-hidden="true" />
                  <span className="text-primary/50 text-[11px] font-mono tracking-wider">{step.num}</span>
                  <h3 className="text-foreground text-sm font-medium mt-2 mb-1.5">{step.title}</h3>
                  <p className="text-muted-foreground/70 text-xs leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: vertical timeline */}
        <div className="md:hidden space-y-0">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex gap-4 relative"
            >
              {/* Vertical line + dot */}
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full border-2 border-primary/50 bg-background flex-shrink-0 mt-1" />
                {i < steps.length - 1 && <div className="w-px flex-1 bg-border/30" />}
              </div>
              <div className="pb-8">
                <span className="text-primary/50 text-[10px] font-mono tracking-wider">{step.num}</span>
                <h3 className="text-foreground text-sm font-medium mt-1 mb-1">{step.title}</h3>
                <p className="text-muted-foreground/70 text-xs leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
