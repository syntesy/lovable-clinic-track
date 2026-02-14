import { motion } from "framer-motion";
import { FileText, Stethoscope, TestTube2, Gauge, ClipboardList, BarChart3 } from "lucide-react";

const modules = [
  {
    icon: FileText,
    title: "Procedimento Padronizado (PSR)",
    desc: "Registro estruturado de cada procedimento com protocolo, método e rastreabilidade completa.",
  },
  {
    icon: Stethoscope,
    title: "Triagem e Avaliação Estruturada",
    desc: "Critérios clínicos objetivos para decisão segura antes de cada intervenção regenerativa.",
  },
  {
    icon: TestTube2,
    title: "Exames e Contexto Biológico",
    desc: "Integração de dados laboratoriais e perfil biológico para fundamentar a conduta clínica.",
  },
  {
    icon: Gauge,
    title: "SCORE e Indicadores",
    desc: "Avaliação quantitativa e qualitativa para apoiar a tomada de decisão do profissional de saúde.",
  },
  {
    icon: ClipboardList,
    title: "Desfechos do Paciente (PRO)",
    desc: "Registro longitudinal de desfechos reportados pelo paciente por timepoint definido.",
  },
  {
    icon: BarChart3,
    title: "Análise de Resultados",
    desc: "Painel interno da clínica com filtros por procedimento, patologia e período de acompanhamento.",
  },
];

export default function LandingModules() {
  return (
    <section id="modulos" className="relative py-28 md:py-36 px-6" aria-labelledby="modules-heading">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-medium mb-4">Módulos</p>
          <h2 id="modules-heading" className="text-foreground text-2xl md:text-3xl font-semibold tracking-tight">
            Infraestrutura completa para a prática regenerativa
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((mod, i) => (
            <motion.div
              key={mod.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="group"
            >
              <div className="h-full p-6 md:p-7 rounded-xl bg-card/50 border border-border/20 transition-all duration-500 hover:border-border/40 hover:bg-card/70 hover:shadow-lg hover:shadow-primary/[0.04] hover:-translate-y-0.5">
                <mod.icon className="w-5 h-5 text-primary/70 mb-4 transition-colors duration-300 group-hover:text-primary" strokeWidth={1.5} />
                <h3 className="text-foreground text-[15px] font-medium mb-2">{mod.title}</h3>
                <p className="text-muted-foreground/70 text-sm leading-relaxed">{mod.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
