import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "O REGHEN é exclusivo para médicos?",
    a: "Não. O REGHEN é destinado a profissionais de saúde habilitados que atuam ou desejam atuar com medicina regenerativa de forma ética e baseada em evidência. Cada profissional acessa apenas os módulos e permissões compatíveis com seu perfil.",
  },
  {
    q: "O sistema compara resultados entre clínicas?",
    a: "Não. O REGHEN não realiza qualquer comparação entre clínicas ou profissionais. Todos os dados são isolados por organização. A análise de resultados é estritamente interna à sua clínica.",
  },
  {
    q: "Como funciona o isolamento por clínica?",
    a: "Cada clínica opera em um ambiente completamente isolado no banco de dados. Políticas de segurança (RLS) garantem que nenhum dado seja acessível fora da organização correspondente. Isso inclui procedimentos, pacientes, desfechos e configurações.",
  },
  {
    q: "É possível acompanhar desfechos por período?",
    a: "Sim. O sistema organiza desfechos por timepoints definidos (baseline, 1 mês, 3 meses, 6 meses e 12 meses). O painel de análise permite filtrar por procedimento, patologia e período de acompanhamento.",
  },
  {
    q: "Preciso preencher todos os campos do procedimento?",
    a: "Campos obrigatórios são definidos pelo protocolo ativo. O sistema orienta o preenchimento mínimo para garantir rastreabilidade e qualidade do registro, sem impedir a continuidade do atendimento.",
  },
];

export default function LandingFAQ() {
  return (
    <section id="faq" className="relative py-28 md:py-36 px-6" aria-labelledby="faq-heading">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-medium mb-4">FAQ</p>
          <h2 id="faq-heading" className="text-foreground text-2xl md:text-3xl font-semibold tracking-tight">
            Perguntas frequentes
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-border/20 rounded-xl px-5 bg-card/30 data-[state=open]:bg-card/50 transition-colors duration-300"
              >
                <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
