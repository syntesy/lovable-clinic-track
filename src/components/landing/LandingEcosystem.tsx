import { motion } from "framer-motion";
import { Users, Building2, Handshake, Rocket } from "lucide-react";

const items = [
  { icon: Users, label: "Profissionais", desc: "Prática organizada e mensurável" },
  { icon: Building2, label: "Centros", desc: "Padronização institucional" },
  { icon: Handshake, label: "Parceiros", desc: "Integração ao ecossistema" },
  { icon: Rocket, label: "Evolução Profissional", desc: "Career Engine e formação contínua" },
];

export default function LandingEcosystem() {
  return (
    <section className="relative py-28 md:py-36 px-6" style={{ background: "#080b14" }}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-medium mb-4">Ecossistema</p>
          <h2 className="text-white text-2xl md:text-3xl lg:text-4xl tracking-tight mb-3" style={{ fontWeight: 400 }}>
            Um Ecossistema Estruturado
          </h2>
          <p className="text-white/40 text-base max-w-2xl mx-auto leading-relaxed">
            Profissionais, centros e metodologia conectados por uma mesma arquitetura científica.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="text-center p-6 rounded-xl bg-white/[0.03] border border-white/[0.06] transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.05]"
            >
              <item.icon className="w-6 h-6 text-primary/70 mx-auto mb-3" strokeWidth={1.5} />
              <h3 className="text-white text-[15px] font-medium mb-1">{item.label}</h3>
              <p className="text-white/40 text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
