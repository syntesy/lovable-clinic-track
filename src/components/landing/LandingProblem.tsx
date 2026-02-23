import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

const problems = [
  "Ausência de padronização clínica nacional",
  "Evidência fragmentada",
  "Falta de rastreabilidade estruturada",
  "Critérios não uniformes",
  "Dificuldade de mensuração objetiva de resultados",
];

export default function LandingProblem() {
  return (
    <section className="relative py-28 md:py-36 px-6" style={{ background: "#080b14" }}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="mb-14"
        >
          <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-medium mb-4">Cenário Atual</p>
          <h2 className="text-white text-2xl md:text-3xl lg:text-4xl leading-[1.15] tracking-tight mb-4" style={{ fontWeight: 400 }}>
            A prática regenerativa evoluiu.{" "}
            <span className="text-white/40">A estrutura científica precisa evoluir junto.</span>
          </h2>
          <p className="text-white/40 text-base max-w-3xl leading-relaxed">
            Sem padronização metodológica e mensuração longitudinal, a prática ocorre — mas não se consolida como sistema clínico consistente.
          </p>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="space-y-4 mb-14"
        >
          {problems.map((p) => (
            <li key={p} className="flex items-start gap-3 text-white/50 text-[15px]">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-primary/60 flex-shrink-0" strokeWidth={1.5} />
              <span>{p}</span>
            </li>
          ))}
        </motion.ul>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="pt-8 border-t border-white/[0.08]"
        >
          <p className="text-white/60 text-base md:text-lg italic">
            O REGHEN nasce para organizar essa estrutura.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
