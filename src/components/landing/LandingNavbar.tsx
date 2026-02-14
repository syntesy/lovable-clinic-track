import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import logoReghen from "@/assets/logo-reghen.png";

const navLinks = [
  { label: "Visão geral", href: "#visao-geral" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Módulos", href: "#modulos" },
  { label: "Segurança", href: "#seguranca" },
  { label: "Desfechos", href: "#desfechos" },
  { label: "FAQ", href: "#faq" },
];

export default function LandingNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const getRedirectPath = useCallback(() => {
    const params = new URLSearchParams(location.search);
    return params.get("redirect") || "/select-environment";
  }, [location.search]);

  const handleLogin = useCallback(() => {
    const r = getRedirectPath();
    navigate(`/auth?redirect=${encodeURIComponent(r)}`);
  }, [navigate, getRedirectPath]);

  const handleSignup = useCallback(() => {
    const r = getRedirectPath();
    navigate(`/auth?mode=signup&redirect=${encodeURIComponent(r)}`);
  }, [navigate, getRedirectPath]);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/30 shadow-lg shadow-background/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex-shrink-0">
          <img src={logoReghen} alt="REGHEN" className="h-8 w-auto" width={100} height={32} />
        </button>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="px-3 py-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-300 rounded-md hover:bg-secondary/50"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={handleLogin}
            className="px-5 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground border border-border/40 rounded-lg transition-all duration-300 hover:border-border/60 hover:bg-secondary/30"
          >
            Entrar
          </button>
          <button
            onClick={handleSignup}
            className="px-5 py-2 text-[13px] font-medium bg-primary text-primary-foreground rounded-lg shadow-md shadow-primary/20 transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
          >
            Criar conta
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="sm:hidden p-2 text-muted-foreground"
          aria-label="Menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            {mobileOpen ? (
              <path d="M5 5l10 10M15 5L5 15" />
            ) : (
              <>
                <path d="M3 6h14M3 10h14M3 14h14" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="sm:hidden bg-background/95 backdrop-blur-xl border-b border-border/30 px-6 py-4 space-y-2"
        >
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="block w-full text-left py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </button>
          ))}
          <div className="flex gap-3 pt-3 border-t border-border/20">
            <button onClick={handleLogin} className="flex-1 py-2.5 text-sm border border-border/40 rounded-lg text-muted-foreground">
              Entrar
            </button>
            <button onClick={handleSignup} className="flex-1 py-2.5 text-sm bg-primary text-primary-foreground rounded-lg">
              Criar conta
            </button>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
