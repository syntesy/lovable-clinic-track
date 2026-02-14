import { motion } from "framer-motion";
import { TrendingUp, PieChart, CalendarCheck } from "lucide-react";

const cards = [
  { icon: CalendarCheck, label: "Cobertura de follow-up", desc: "Acompanhamento por timepoint com visibilidade de adesão." },
  { icon: PieChart, label: "Distribuição de resposta", desc: "Classificação estruturada dos desfechos reportados." },
  { icon: TrendingUp, label: "Evolução temporal", desc: "Tendência interna ao longo dos períodos de registro." },
];

export default function LandingOutcomes() {
  return (
    <section id="desfechos" className="relative py-28 md:py-36 px-6" aria-labelledby="outcomes-heading">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-medium mb-4">Desfechos e Análise</p>
            <h2 id="outcomes-heading" className="text-foreground text-2xl md:text-3xl font-semibold tracking-tight mb-6">
              Dados organizados para decisão informada
            </h2>
            <p className="text-muted-foreground text-[15px] leading-[1.8]">
              Os desfechos são organizados por baseline e follow-up, consolidados
              em um painel interno com filtros por procedimento, patologia e período.
            </p>
          </motion.div>

          <div className="grid gap-4">
            {cards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="flex items-start gap-4 p-5 rounded-xl bg-card/40 border border-border/20"
              >
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <card.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-foreground text-sm font-medium mb-1">{card.label}</h3>
                  <p className="text-muted-foreground/70 text-xs leading-relaxed">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
