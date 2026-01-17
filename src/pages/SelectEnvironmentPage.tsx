import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Stethoscope, 
  GraduationCap, 
  Heart,
  ArrowRight,
  Lock
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoReghen from "@/assets/logo-reghen.png";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EnvironmentCard {
  id: "clinical" | "academy" | "patient";
  title: string;
  subtitle: string;
  description: string;
  microcopy?: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  variant: "primary" | "secondary" | "tertiary";
  enabled: boolean;
  disabledMessage?: string;
  cta: string;
}

export default function SelectEnvironmentPage() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [clinicalEnabled, setClinicalEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setClinicalEnabled(true);
    } catch (error) {
      console.error("Error checking permissions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnvironmentSelect = (env: EnvironmentCard) => {
    if (!env.enabled) return;
    localStorage.setItem("regenapp_last_environment", env.id);
    navigate(env.route);
  };

  const environments: EnvironmentCard[] = [
    {
      id: "clinical",
      title: "REGHEN",
      subtitle: "Clínico",
      description: "Infraestrutura clínica avançada para decisão, execução e acompanhamento.",
      microcopy: "Uso profissional regulado",
      icon: Stethoscope,
      route: "/pacientes",
      variant: "primary",
      enabled: clinicalEnabled,
      disabledMessage: "Este ambiente não está habilitado para sua conta.",
      cta: "Acessar ambiente clínico"
    },
    {
      id: "academy",
      title: "REGHEN",
      subtitle: "Academy",
      description: "Conhecimento aplicado, mentorias clínicas e curadoria científica contínua.",
      microcopy: "Formação avançada · Curadoria institucional",
      icon: GraduationCap,
      route: "/academy/home",
      variant: "secondary",
      enabled: true,
      cta: "Entrar no Academy"
    },
    {
      id: "patient",
      title: "Área do",
      subtitle: "Paciente",
      description: "Acesso responsável a informações, orientações e acompanhamento.",
      icon: Heart,
      route: "/patient/login",
      variant: "tertiary",
      enabled: true,
      cta: "Entrar como paciente"
    }
  ];

  // Animation variants with refined easing
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.12,
        delayChildren: prefersReducedMotion ? 0 : 0.3
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: prefersReducedMotion ? 0 : 40,
      scale: 0.98
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0.1 : 0.7,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number]
      }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : -30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.1 : 0.9,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number]
      }
    }
  };

  const getCardClasses = (variant: string, enabled: boolean, isHovered: boolean) => {
    const base = "relative overflow-hidden rounded-2xl border transition-all duration-700 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
    
    if (!enabled) {
      return `${base} bg-card/20 border-border/10 opacity-50 cursor-not-allowed`;
    }

    const hoverStyles = isHovered 
      ? "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)] -translate-y-[3px]" 
      : "shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)]";
    
    switch (variant) {
      case "primary":
        return `${base} ${hoverStyles} cursor-pointer bg-gradient-to-br from-card via-card/95 to-primary/[0.08] ${
          isHovered ? "border-primary/30" : "border-primary/15"
        }`;
      case "secondary":
        return `${base} ${hoverStyles} cursor-pointer bg-gradient-to-br from-card via-card/95 to-accent/[0.15] ${
          isHovered ? "border-accent-foreground/25" : "border-accent-foreground/10"
        }`;
      case "tertiary":
        return `${base} ${hoverStyles} cursor-pointer bg-gradient-to-br from-card via-card/95 to-muted/[0.15] ${
          isHovered ? "border-border/50" : "border-border/25"
        }`;
      default:
        return base;
    }
  };

  const getIconStyles = (variant: string, isHovered: boolean) => {
    const baseGlow = isHovered ? "transition-all duration-500" : "transition-all duration-500";
    
    switch (variant) {
      case "primary":
        return `text-primary ${baseGlow} ${isHovered ? "drop-shadow-[0_0_12px_hsl(var(--primary)/0.4)]" : ""}`;
      case "secondary":
        return `text-accent-foreground ${baseGlow} ${isHovered ? "drop-shadow-[0_0_12px_hsl(var(--accent-foreground)/0.25)]" : ""}`;
      case "tertiary":
        return `text-muted-foreground ${baseGlow} ${isHovered ? "drop-shadow-[0_0_12px_hsl(var(--muted-foreground)/0.25)]" : ""}`;
      default:
        return "";
    }
  };

  const getButtonClasses = (variant: string, enabled: boolean) => {
    const base = "w-full py-3.5 px-6 rounded-xl text-sm font-medium flex items-center justify-center gap-2.5 transition-all duration-300";
    
    if (!enabled) {
      return `${base} bg-muted/30 text-muted-foreground/50 cursor-not-allowed`;
    }
    
    switch (variant) {
      case "primary":
        return `${base} bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25`;
      case "secondary":
        return `${base} bg-accent/80 text-accent-foreground hover:bg-accent border border-accent-foreground/15`;
      case "tertiary":
        return `${base} bg-secondary/80 text-secondary-foreground hover:bg-secondary border border-border/40`;
      default:
        return base;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground/50 text-xs tracking-widest uppercase">Preparando</p>
        </motion.div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Sophisticated layered background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
        
        {/* Subtle radial gradients for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.03),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_100%,hsl(var(--accent)/0.04),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_0%_80%,hsl(var(--primary)/0.02),transparent)]" />
        
        {/* Ultra-subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />

        {/* Noise texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
          }}
        />

        <motion.div 
          className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo with refined animation */}
          <motion.div 
            variants={headerVariants}
            className="mb-14"
          >
            <motion.img 
              src={logoReghen} 
              alt="REGHEN" 
              className="h-40 md:h-48 w-auto object-contain"
              style={{ filter: 'brightness(0.95)' }}
              whileHover={!prefersReducedMotion ? { scale: 1.02, filter: 'brightness(1)' } : {}}
              transition={{ duration: 0.4 }}
            />
          </motion.div>

          {/* Microtexto superior - extremamente discreto */}
          <motion.p 
            variants={headerVariants}
            className="text-muted-foreground/40 text-[10px] tracking-[0.35em] uppercase mb-8 font-light"
          >
            Ecossistema integrado · Experiências distintas
          </motion.p>

          {/* Título principal - forte mas elegante */}
          <motion.h1 
            variants={headerVariants}
            className="text-foreground text-3xl md:text-[2.5rem] font-light tracking-tight mb-5 text-center leading-tight"
          >
            Onde deseja atuar agora?
          </motion.h1>

          {/* Subtítulo - curto e preciso */}
          <motion.p 
            variants={headerVariants}
            className="text-muted-foreground/70 text-sm md:text-[15px] mb-20 text-center max-w-lg font-light"
          >
            Cada ambiente do REGHEN foi desenhado para um propósito específico.
          </motion.p>

          {/* Cards de escolha */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-7 w-full max-w-5xl"
            variants={containerVariants}
          >
            <AnimatePresence mode="wait">
              {environments.map((env) => {
                const isHovered = hoveredCard === env.id;
                const Icon = env.icon;

                const cardContent = (
                  <motion.div
                    key={env.id}
                    variants={cardVariants}
                    className={getCardClasses(env.variant, env.enabled, isHovered)}
                    onMouseEnter={() => env.enabled && setHoveredCard(env.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onFocus={() => env.enabled && setHoveredCard(env.id)}
                    onBlur={() => setHoveredCard(null)}
                    onClick={() => handleEnvironmentSelect(env)}
                    tabIndex={env.enabled ? 0 : -1}
                    role="button"
                    aria-label={`${env.title} ${env.subtitle}`}
                    aria-disabled={!env.enabled}
                    whileTap={env.enabled && !prefersReducedMotion ? { scale: 0.985 } : {}}
                  >
                    {/* Hover gradient overlay - very subtle */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-t from-primary/[0.02] via-transparent to-transparent"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isHovered ? 1 : 0 }}
                      transition={{ duration: 0.5 }}
                    />

                    {/* Subtle border glow on hover */}
                    <motion.div 
                      className="absolute inset-0 rounded-2xl"
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: isHovered ? 1 : 0,
                        boxShadow: env.variant === 'primary' 
                          ? 'inset 0 0 0 1px hsl(var(--primary)/0.15)' 
                          : env.variant === 'secondary'
                            ? 'inset 0 0 0 1px hsl(var(--accent-foreground)/0.1)'
                            : 'inset 0 0 0 1px hsl(var(--border)/0.3)'
                      }}
                      transition={{ duration: 0.4 }}
                    />

                    <div className="relative z-10 p-9 md:p-10 flex flex-col h-full min-h-[340px]">
                      {/* Icon with elegant animation */}
                      <div className="mb-9">
                        <motion.div
                          animate={{
                            scale: isHovered && !prefersReducedMotion ? 1.08 : 1,
                            y: isHovered && !prefersReducedMotion ? -2 : 0
                          }}
                          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <Icon className={`w-9 h-9 ${getIconStyles(env.variant, isHovered)}`} />
                        </motion.div>
                      </div>

                      {/* Title block */}
                      <div className="mb-5">
                        <span className="text-muted-foreground/50 text-[11px] tracking-[0.25em] uppercase block mb-1.5 font-light">
                          {env.title}
                        </span>
                        <h2 className="text-foreground text-[1.65rem] font-medium tracking-tight">
                          {env.subtitle}
                        </h2>
                      </div>

                      {/* Description */}
                      <p className="text-muted-foreground/80 text-[13px] leading-[1.7] mb-5 flex-grow font-light">
                        {env.description}
                      </p>

                      {/* Microcopy */}
                      {env.microcopy && (
                        <p className="text-muted-foreground/40 text-[11px] mb-7 tracking-wide font-light">
                          {env.microcopy}
                        </p>
                      )}

                      {/* CTA Button */}
                      <div className="mt-auto">
                        {env.enabled ? (
                          <motion.button
                            className={getButtonClasses(env.variant, env.enabled)}
                            whileHover={!prefersReducedMotion ? { gap: "14px" } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            {env.cta}
                            <motion.span
                              animate={{ x: isHovered && !prefersReducedMotion ? 3 : 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <ArrowRight className="w-4 h-4" strokeWidth={2} />
                            </motion.span>
                          </motion.button>
                        ) : (
                          <button
                            className={getButtonClasses(env.variant, env.enabled)}
                            disabled
                            aria-disabled="true"
                          >
                            <Lock className="w-4 h-4" strokeWidth={2} />
                            <span>Indisponível</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );

                // Wrap disabled cards with elegant tooltip
                if (!env.enabled && env.disabledMessage) {
                  return (
                    <Tooltip key={env.id}>
                      <TooltipTrigger asChild>
                        {cardContent}
                      </TooltipTrigger>
                      <TooltipContent 
                        side="top"
                        sideOffset={8}
                        className="bg-popover/95 backdrop-blur-sm border-border/50 text-popover-foreground text-xs px-4 py-2.5 rounded-lg shadow-xl"
                      >
                        <p className="font-light">{env.disabledMessage}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return cardContent;
              })}
            </AnimatePresence>
          </motion.div>

          {/* Footer subtle text */}
          <motion.p 
            variants={headerVariants}
            className="mt-20 text-muted-foreground/30 text-[11px] tracking-[0.15em] font-light"
          >
            Você pode alternar entre ambientes a qualquer momento
          </motion.p>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}
