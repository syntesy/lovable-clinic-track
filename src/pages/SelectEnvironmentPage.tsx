import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Stethoscope, 
  GraduationCap, 
  Heart,
  ArrowRight,
  Lock
} from "lucide-react";
import { useState, useEffect } from "react";
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
}

export default function SelectEnvironmentPage() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [clinicalEnabled, setClinicalEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPermissions();
    saveEnvironmentPreference();
  }, []);

  const checkPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      
      // Check if user has clinical access (for now, all authenticated users have access)
      // This can be enhanced later with proper role checking
      setClinicalEnabled(true);
    } catch (error) {
      console.error("Error checking permissions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveEnvironmentPreference = () => {
    // Clear any previous preference when arriving at this page
    localStorage.removeItem("regenapp_last_environment");
  };

  const handleEnvironmentSelect = (env: EnvironmentCard) => {
    if (!env.enabled) return;
    
    // Save preference for future sessions
    localStorage.setItem("regenapp_last_environment", env.id);
    
    navigate(env.route);
  };

  const environments: EnvironmentCard[] = [
    {
      id: "clinical",
      title: "REGHEN",
      subtitle: "Clínico",
      description: "Infraestrutura clínica avançada para tomada de decisão, execução e acompanhamento.",
      microcopy: "Uso profissional regulado",
      icon: Stethoscope,
      route: "/pacientes",
      variant: "primary",
      enabled: clinicalEnabled,
      disabledMessage: "Este ambiente não está habilitado para sua conta."
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
      enabled: true
    },
    {
      id: "patient",
      title: "Área do",
      subtitle: "Paciente",
      description: "Acesso responsável a informações, orientações e acompanhamento.",
      icon: Heart,
      route: "/patient/login",
      variant: "tertiary",
      enabled: true
    }
  ];

  const getCardStyles = (variant: string, enabled: boolean, isHovered: boolean) => {
    const baseStyles = "relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-500 ease-out cursor-pointer";
    
    if (!enabled) {
      return `${baseStyles} bg-card/30 border-border/20 opacity-60 cursor-not-allowed`;
    }

    const hoverElevation = isHovered ? "shadow-2xl -translate-y-1" : "shadow-lg";
    
    switch (variant) {
      case "primary":
        return `${baseStyles} ${hoverElevation} bg-gradient-to-br from-card via-card to-primary/5 border-primary/20 ${isHovered ? "border-primary/40" : ""}`;
      case "secondary":
        return `${baseStyles} ${hoverElevation} bg-gradient-to-br from-card via-card to-accent/10 border-accent-foreground/10 ${isHovered ? "border-accent-foreground/20" : ""}`;
      case "tertiary":
        return `${baseStyles} ${hoverElevation} bg-gradient-to-br from-card via-card to-muted/20 border-border/30 ${isHovered ? "border-border/50" : ""}`;
      default:
        return baseStyles;
    }
  };

  const getIconGlow = (variant: string, isHovered: boolean) => {
    if (!isHovered) return "";
    
    switch (variant) {
      case "primary":
        return "drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]";
      case "secondary":
        return "drop-shadow-[0_0_8px_hsl(var(--accent-foreground)/0.3)]";
      case "tertiary":
        return "drop-shadow-[0_0_8px_hsl(var(--muted-foreground)/0.3)]";
      default:
        return "";
    }
  };

  const getButtonStyles = (variant: string, enabled: boolean) => {
    if (!enabled) {
      return "bg-muted/50 text-muted-foreground cursor-not-allowed";
    }
    
    switch (variant) {
      case "primary":
        return "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20";
      case "secondary":
        return "bg-accent text-accent-foreground hover:bg-accent/80 border border-accent-foreground/20";
      case "tertiary":
        return "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border";
      default:
        return "";
    }
  };

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.15,
        delayChildren: prefersReducedMotion ? 0 : 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: prefersReducedMotion ? 0 : 30 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.1 : 0.6,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
      }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.1 : 0.8,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"
        />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Sophisticated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/[0.02]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/[0.03] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent/[0.03] via-transparent to-transparent" />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />

        <motion.div 
          className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo */}
          <motion.div 
            variants={headerVariants}
            className="mb-12"
          >
            <img 
              src={logoReghen} 
              alt="REGHEN" 
              className="h-16 md:h-20 w-auto object-contain opacity-90"
            />
          </motion.div>

          {/* Microtexto superior */}
          <motion.p 
            variants={headerVariants}
            className="text-muted-foreground/60 text-xs tracking-[0.3em] uppercase mb-6"
          >
            Ecossistema integrado · Experiências distintas
          </motion.p>

          {/* Título principal */}
          <motion.h1 
            variants={headerVariants}
            className="text-foreground text-3xl md:text-4xl font-light tracking-tight mb-4 text-center"
          >
            Onde deseja atuar agora?
          </motion.h1>

          {/* Subtítulo */}
          <motion.p 
            variants={headerVariants}
            className="text-muted-foreground text-sm md:text-base mb-16 text-center max-w-md"
          >
            Cada ambiente do REGHEN foi desenhado para um propósito específico.
          </motion.p>

          {/* Cards de escolha */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full max-w-5xl"
            variants={containerVariants}
          >
            <AnimatePresence>
              {environments.map((env) => {
                const isHovered = hoveredCard === env.id;
                const Icon = env.icon;

                const cardContent = (
                  <motion.div
                    key={env.id}
                    variants={cardVariants}
                    className={getCardStyles(env.variant, env.enabled, isHovered)}
                    onMouseEnter={() => env.enabled && setHoveredCard(env.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={() => handleEnvironmentSelect(env)}
                    whileHover={env.enabled && !prefersReducedMotion ? { scale: 1.01 } : {}}
                    whileTap={env.enabled && !prefersReducedMotion ? { scale: 0.985 } : {}}
                  >
                    {/* Gradient overlay on hover */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-t from-primary/[0.03] to-transparent opacity-0"
                      animate={{ opacity: isHovered ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    />

                    <div className="relative z-10 p-8 md:p-10 flex flex-col h-full min-h-[320px]">
                      {/* Icon */}
                      <div className="mb-8">
                        <motion.div
                          animate={{
                            scale: isHovered ? 1.05 : 1
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          <Icon 
                            className={`w-10 h-10 transition-all duration-300 ${
                              env.variant === "primary" 
                                ? "text-primary" 
                                : env.variant === "secondary"
                                  ? "text-accent-foreground"
                                  : "text-muted-foreground"
                            } ${getIconGlow(env.variant, isHovered)}`}
                          />
                        </motion.div>
                      </div>

                      {/* Title */}
                      <div className="mb-4">
                        <span className="text-muted-foreground text-xs tracking-[0.2em] uppercase block mb-1">
                          {env.title}
                        </span>
                        <h2 className="text-foreground text-2xl font-semibold tracking-tight">
                          {env.subtitle}
                        </h2>
                      </div>

                      {/* Description */}
                      <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-grow">
                        {env.description}
                      </p>

                      {/* Microcopy */}
                      {env.microcopy && (
                        <p className="text-muted-foreground/60 text-xs mb-6">
                          {env.microcopy}
                        </p>
                      )}

                      {/* CTA Button */}
                      <div className="mt-auto">
                        {env.enabled ? (
                          <motion.button
                            className={`w-full py-3 px-6 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-300 ${getButtonStyles(env.variant, env.enabled)}`}
                            whileHover={!prefersReducedMotion ? { gap: "12px" } : {}}
                          >
                            {env.variant === "primary" ? "Acessar ambiente clínico" : 
                             env.variant === "secondary" ? "Entrar no Academy" : 
                             "Entrar como paciente"}
                            <ArrowRight className="w-4 h-4" />
                          </motion.button>
                        ) : (
                          <button
                            className={`w-full py-3 px-6 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${getButtonStyles(env.variant, env.enabled)}`}
                            disabled
                          >
                            <Lock className="w-4 h-4" />
                            Bloqueado
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );

                // Wrap disabled cards with tooltip
                if (!env.enabled) {
                  return (
                    <Tooltip key={env.id}>
                      <TooltipTrigger asChild>
                        {cardContent}
                      </TooltipTrigger>
                      <TooltipContent 
                        side="top" 
                        className="bg-popover border-border text-popover-foreground"
                      >
                        <p>{env.disabledMessage}</p>
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
            className="mt-16 text-muted-foreground/40 text-xs tracking-wide"
          >
            Você pode alternar entre ambientes a qualquer momento
          </motion.p>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}
