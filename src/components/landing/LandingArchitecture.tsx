import { motion } from "framer-motion";
import { Layers, Target, Activity, BarChart3, BookOpen, Shield, GraduationCap } from "lucide-react";

const pillars = [
  { icon: Layers, title: "Estrutura Clínica", desc: "Organiza o fluxo assistencial." },
  { icon: Target, title: "SCORE", desc: "Padroniza critérios clínicos objetivos." },
  { icon: Activity, title: "Follow-up", desc: "Garante acompanhamento estruturado e contínuo." },
  { icon: BarChart3, title: "Resultados", desc: "Mensura desfechos clínicos de forma sistemática." },
  { icon: BookOpen, title: "Evidência", desc: "Transforma dados clínicos em base estruturada de análise." },
  { icon: Shield, title: "Governança", desc: "Estabelece rastreabilidade e padrão metodológico." },
  { icon: GraduationCap, title: "Academy", desc: "Estrutura formação contínua alinhada à prática real." },
];

export default function LandingArchitecture() {
  return (
    <section id="arquitetura" className="relative py-28 md:py-36 px-6" style={{ background: "#080b14" }}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-medium mb-4">Arquitetura</p>
          <h2 className="text-white text-2xl md:text-3xl lg:text-4xl tracking-tight" style={{ fontWeight: 400 }}>
            A Arquitetura que Organiza a Prática
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.07 }}
              className="group"
            >
              <div className="h-full p-6 rounded-xl bg-white/[0.03] border border-white/[0.06] transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.05]">
                <p.icon className="w-5 h-5 text-primary/70 mb-4 transition-colors duration-300 group-hover:text-primary" strokeWidth={1.5} />
                <h3 className="text-white text-[15px] font-medium mb-2">{p.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
