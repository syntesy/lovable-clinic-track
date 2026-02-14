import { motion } from "framer-motion";
import { Building2, Users, Lock } from "lucide-react";

const pillars = [
  {
    icon: Building2,
    title: "Isolamento por clínica",
    desc: "Cada clínica opera em um ambiente completamente isolado. Nenhum dado é compartilhado entre organizações.",
  },
  {
    icon: Users,
    title: "Controle de acesso por perfil",
    desc: "Permissões granulares por função: administrador, profissional de saúde, técnico e recepção.",
  },
  {
    icon: Lock,
    title: "Políticas de segurança no banco",
    desc: "Row Level Security garante que cada consulta ao banco respeita as permissões do usuário autenticado.",
  },
];

export default function LandingSecurity() {
  return (
    <section id="seguranca" className="relative py-28 md:py-36 px-6" aria-labelledby="security-heading">
      {/* Darker background block */}
      <div className="absolute inset-0 bg-secondary/30" aria-hidden="true" />

      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-medium mb-4">Segurança</p>
          <h2 id="security-heading" className="text-foreground text-2xl md:text-3xl font-semibold tracking-tight mb-4">
            Arquitetura pensada para proteção de dados clínicos
          </h2>
          <p className="text-muted-foreground text-[15px] max-w-2xl mx-auto">
            Segurança não é uma funcionalidade opcional. É a base da infraestrutura.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="p-7 rounded-xl bg-card/60 border border-border/20"
            >
              <div className="p-2.5 rounded-lg bg-primary/10 w-fit mb-5">
                <p.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-foreground text-[15px] font-medium mb-2">{p.title}</h3>
              <p className="text-muted-foreground/70 text-sm leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
