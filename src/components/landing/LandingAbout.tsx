import { motion } from "framer-motion";

export default function LandingAbout() {
  return (
    <section id="visao-geral" className="relative py-28 md:py-36 px-6" aria-labelledby="about-heading">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-medium mb-4">O que é o REGHEN</p>
          <h2 id="about-heading" className="text-foreground text-2xl md:text-3xl font-semibold tracking-tight mb-6 leading-snug">
            Estrutura para decisões clínicas, não atalhos.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-5"
        >
          <p className="text-muted-foreground text-[15px] leading-[1.8]">
            REGHEN é um sistema clínico estruturado para padronizar procedimentos regenerativos
            e organizar desfechos com governança e segurança.
          </p>
          <p className="text-muted-foreground/70 text-[15px] leading-[1.8]">
            Ele transforma registros clínicos em dados analisáveis, preservando a autonomia
            da prática e o isolamento por clínica.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
