import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingHero from "@/components/landing/LandingHero";
import LandingAbout from "@/components/landing/LandingAbout";
import LandingTimeline from "@/components/landing/LandingTimeline";
import LandingModules from "@/components/landing/LandingModules";
import LandingOutcomes from "@/components/landing/LandingOutcomes";
import LandingSecurity from "@/components/landing/LandingSecurity";
import LandingClinics from "@/components/landing/LandingClinics";
import LandingFAQ from "@/components/landing/LandingFAQ";
import LandingFooter from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Skip link */}
      <a
        href="#hero-heading"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg"
      >
        Ir para conteúdo principal
      </a>

      {/* Subtle background textures */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.04),transparent)]" aria-hidden="true" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_100%,hsl(var(--accent)/0.05),transparent)]" aria-hidden="true" />
      <div
        className="fixed inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
        aria-hidden="true"
      />

      <LandingNavbar />

      <main className="relative z-10">
        <LandingHero />
        <LandingAbout />
        <LandingTimeline />
        <LandingModules />
        <LandingOutcomes />
        <LandingSecurity />
        <LandingClinics />
        <LandingFAQ />
      </main>

      <LandingFooter />
    </div>
  );
}
