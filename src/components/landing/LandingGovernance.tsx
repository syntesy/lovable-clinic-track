import { motion } from "framer-motion";
import { FileText, Search, Settings, GitBranch, Scale } from "lucide-react";

const items = [
  { icon: FileText, text: "Organização documental" },
  { icon: Search, text: "Estrutura auditável" },
  { icon: Settings, text: "Padronização técnica" },
  { icon: GitBranch, text: "Rastreabilidade de procedimentos" },
  { icon: Scale, text: "Compatibilidade com futuras exigências regulatórias" },
];

export default function LandingGovernance() {
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
          <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-medium mb-4">Governança</p>
          <h2 className="text-white text-2xl md:text-3xl lg:text-4xl tracking-tight" style={{ fontWeight: 400 }}>
            Governança e Segurança Metodológica
          </h2>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="space-y-4"
        >
          {items.map((item) => (
            <li key={item.text} className="flex items-start gap-3 text-white/50 text-[15px]">
              <item.icon className="w-4 h-4 mt-0.5 text-primary/60 flex-shrink-0" strokeWidth={1.5} />
              <span>{item.text}</span>
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
