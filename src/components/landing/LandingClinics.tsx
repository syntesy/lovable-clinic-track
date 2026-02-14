import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const benefits = [
  "Padronização da equipe com protocolos estruturados",
  "Rastreamento completo do processo clínico",
  "Crescimento com consistência e governança",
];

export default function LandingClinics() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignup = useCallback(() => {
    const params = new URLSearchParams(location.search);
    const r = params.get("redirect") || "/select-environment";
    navigate(`/auth?mode=signup&redirect=${encodeURIComponent(r)}`);
  }, [navigate, location.search]);

  return (
    <section className="relative py-28 md:py-36 px-6" aria-labelledby="clinics-heading">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-medium mb-4">Para clínicas</p>
          <h2 id="clinics-heading" className="text-foreground text-2xl md:text-3xl font-semibold tracking-tight mb-8">
            Estrutura institucional para sua equipe
          </h2>

          <ul className="space-y-3 mb-10 inline-block text-left">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-3 text-muted-foreground text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary/60 mt-0.5 flex-shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div>
            <button
              onClick={handleSignup}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-medium bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-400 hover:bg-primary/90 hover:shadow-xl"
            >
              Criar conta <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
