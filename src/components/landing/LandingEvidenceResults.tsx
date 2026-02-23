import { motion } from "framer-motion";
import { Database, LineChart, Activity, TrendingUp } from "lucide-react";

const points = [
  { icon: Database, text: "Dados clínicos organizados em estrutura comparável" },
  { icon: LineChart, text: "Visualização de performance clínica individual" },
  { icon: Activity, text: "Mensuração sistemática de resultados por timepoint" },
  { icon: TrendingUp, text: "Acompanhamento longitudinal que gera base de evidência" },
];

export default function LandingEvidenceResults() {
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
          <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-medium mb-4">Resultados</p>
          <h2 className="text-white text-2xl md:text-3xl lg:text-4xl tracking-tight mb-3" style={{ fontWeight: 400 }}>
            Da prática à evidência estruturada
          </h2>
          <p className="text-white/40 text-base max-w-2xl leading-relaxed">
            Organização de dados clínicos, mensuração longitudinal e consolidação de desfechos com critérios objetivos.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-5">
          {points.map((p, i) => (
            <motion.div
              key={p.text}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="flex items-start gap-4 p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
            >
              <p.icon className="w-5 h-5 text-primary/70 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
              <span className="text-white/50 text-[15px] leading-relaxed">{p.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
