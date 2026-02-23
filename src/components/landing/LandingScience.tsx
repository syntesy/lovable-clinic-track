import { motion } from "framer-motion";
import { FlaskConical, ClipboardList, Target, BarChart3, FileSearch } from "lucide-react";

const items = [
  { icon: FlaskConical, text: "Curadoria clínica contínua" },
  { icon: ClipboardList, text: "Padronização de protocolos" },
  { icon: Target, text: "Critérios estruturados de score" },
  { icon: BarChart3, text: "Métricas objetivas de desfecho" },
  { icon: FileSearch, text: "Rastreabilidade metodológica" },
];

export default function LandingScience() {
  return (
    <section className="relative py-28 md:py-36 px-6" style={{ background: "#080b14" }}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-medium mb-4">Base Metodológica</p>
          <h2 className="text-white text-2xl md:text-3xl lg:text-4xl tracking-tight mb-3" style={{ fontWeight: 400 }}>
            Estrutura Científica REGHEN
          </h2>
          <p className="text-white/40 text-base md:text-lg max-w-3xl leading-relaxed">
            Conversão da literatura científica em critérios clínicos aplicáveis, com mensuração objetiva e rastreabilidade metodológica.
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-white/50 text-[15px] leading-[1.8] mb-10 max-w-3xl"
        >
          A Estrutura Científica REGHEN converte literatura científica em critérios clínicos aplicáveis, transformando revisões sistemáticas e metanálises em parâmetros objetivos dentro da prática real.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mb-12"
        >
          <p className="text-white/30 text-[11px] tracking-[0.2em] uppercase font-medium mb-5">Ela integra:</p>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.text} className="flex items-center gap-3 text-white/50 text-[15px]">
                <item.icon className="w-4 h-4 text-primary/60 flex-shrink-0" strokeWidth={1.5} />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="pt-8 border-t border-white/[0.08]"
        >
          <p className="text-white/50 text-[15px] leading-[1.8]">
            O REGHEN não substitui a ciência.{" "}
            <span className="text-white/70">Ele organiza a ciência dentro da prática.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
