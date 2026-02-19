import { motion } from "framer-motion";
import { MessageSquare, BookOpen, Database, GraduationCap, Link, Layers } from "lucide-react";

const modules = [
  {
    icon: MessageSquare,
    title: "Chat Científico Especializado",
    desc: "Ferramenta de apoio técnico baseada em literatura científica sobre ortobiológicos e protocolos regenerativos.",
  },
  {
    icon: BookOpen,
    title: "Curadoria de Evidência",
    desc: "Organização estruturada de revisões sistemáticas e estudos relevantes em medicina regenerativa.",
  },
  {
    icon: Database,
    title: "Base de Conhecimento Técnica",
    desc: "Conteúdo estruturado sobre fundamentos, protocolos e critérios clínicos aplicáveis à prática regenerativa.",
  },
  {
    icon: GraduationCap,
    title: "REGHEN Academy",
    desc: "Aulas e conteúdos conectados à prática clínica regenerativa, com abordagem técnica e aplicada.",
  },
  {
    icon: Link,
    title: "Integração entre prática e evidência",
    desc: "Ambiente que conecta registro clínico com referências científicas organizadas.",
  },
  {
    icon: Layers,
    title: "Estrutura de Padronização Científica",
    desc: "Arquitetura projetada para organizar variáveis clínicas e desfechos em um formato estruturado, comparável e potencialmente utilizável para produção científica.",
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
            Ecossistema científico integrado
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
