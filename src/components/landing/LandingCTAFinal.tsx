import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

export default function LandingCTAFinal() {
  const navigate = useNavigate();
  const location = useLocation();

  const getRedirectPath = useCallback(() => {
    const params = new URLSearchParams(location.search);
    return params.get("redirect") || "/select-environment";
  }, [location.search]);

  const handleSignup = useCallback(() => {
    navigate(`/auth?mode=signup&redirect=${encodeURIComponent(getRedirectPath())}`);
  }, [navigate, getRedirectPath]);

  return (
    <section className="relative py-28 md:py-40 px-6" style={{ background: "#080b14" }}>
      <div className="max-w-3xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-white text-2xl md:text-3xl lg:text-4xl tracking-tight mb-4"
          style={{ fontWeight: 400 }}
        >
          A prática regenerativa não pode depender de improviso.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-white/40 text-base md:text-lg mb-10"
        >
          Ela precisa de infraestrutura.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <button
            onClick={handleSignup}
            className="px-10 py-3.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Fazer parte da infraestrutura nacional
          </button>
        </motion.div>
      </div>
    </section>
  );
}
