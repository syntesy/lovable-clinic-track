import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Bot, BookOpen, ShieldCheck, FileText, Settings, Handshake, CreditCard, UserCog, FlaskConical, Scale, Database, TrendingUp, Shield, CalendarDays, ClipboardList, ArrowLeftRight, BarChart3, Target, Beaker } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import logoReghen from "@/assets/logo-reghen.png";

// Menu items visible to all authenticated users (professional role)
const menuItems = [
  { title: "Agenda Clínica", url: "/agenda", icon: CalendarDays },
  { title: "Pacientes", url: "/pacientes", icon: Users },
  { title: "Atendimentos", url: "/atendimentos", icon: ClipboardList },
  { title: "Padrões Clínicos", url: "/insights", icon: BarChart3 },
  { title: "Minha Performance", url: "/insights/performance", icon: Target },
  { title: "Área do Paciente", url: "/patients/manage", icon: UserCog },
  { title: "Career Engine", url: "/career", icon: TrendingUp },
  { title: "Diligência & Compliance", url: "/diligence", icon: Shield },
  { title: "Curadoria Clínica", url: "/curadoria", icon: BookOpen },
  { title: "Parceiros", url: "/partners", icon: Handshake },
  { title: "Plano & Assinatura", url: "/account/subscription", icon: CreditCard },
  { title: "AGENTE rhegen", url: "/agente-mac", icon: Bot, isAgent: true },
];

// Admin-only menu items (includes Evidence Engine access)
const adminMenuItems = [
  { title: "Dashboard", url: "/admin", icon: ShieldCheck },
  { title: "Evidence Engine", url: "/evidence", icon: Database },
  { title: "Gerenciar Artigos", url: "/admin/artigos", icon: FileText },
  { title: "Revisão de Curadorias", url: "/admin/curadoria", icon: Settings },
  { title: "Clinical Registry", url: "/admin/registry", icon: FlaskConical },
  { title: "Governança", url: "/admin/registry/governance", icon: Scale },
  { title: "QA Seed Data", url: "/admin/qa/seed", icon: Beaker },
];

export function AppSidebar() {
  const { state, isMobile } = useSidebar();
  const navigate = useNavigate();
  const isCollapsed = state === "collapsed" && !isMobile;
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminRole();
  }, []);

  const checkAdminRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    setIsAdmin(Boolean(data));
  };

  // Logo única
  const currentLogo = logoReghen;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar data-[state=open]:w-64 md:data-[state=open]:w-72">
      <SidebarContent className="px-3 md:px-4 py-6 md:py-8">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8 md:mb-10">
          {!isCollapsed ? (
            <>
              <div className="w-48 md:w-72 h-14 md:h-20 mb-2">
                <img
                  src={currentLogo}
                  alt="rhegen"
                  className="w-full h-full object-contain"
                />
              </div>
            </>
          ) : (
            <div className="w-9 h-9 rounded-full overflow-hidden bg-sidebar-accent/50 p-0.5 flex items-center justify-center">
              <span className="text-sidebar-primary font-bold text-xs">r</span>
            </div>
          )}
        </div>

        {/* Separator */}
        {!isCollapsed && <div className="mx-2 mb-8 h-px bg-sidebar-border" />}

        {/* Navigation Menu */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-3">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10 md:h-12">
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="text-[12px] md:text-[13px] tracking-wide font-normal truncate">
                          {item.title}
                        </span>
                      )}
                      {!isCollapsed && item.isAgent && (
                        <span className="ml-auto px-1.5 py-0.5 text-[9px] font-medium bg-sidebar-accent text-sidebar-primary rounded tracking-wider border border-sidebar-border flex-shrink-0">
                          IA
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Menu - Only visible to admins */}
        {isAdmin && (
          <>
            {!isCollapsed && <div className="mx-2 my-6 h-px bg-sidebar-border" />}
            <SidebarGroup>
              {!isCollapsed && (
                <SidebarGroupLabel className="px-4 text-xs text-sidebar-primary uppercase tracking-wider flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {adminMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className="h-10">
                        <NavLink
                          to={item.url}
                          className="flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors"
                          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        >
                          <item.icon className="h-[16px] w-[16px] flex-shrink-0" />
                          {!isCollapsed && (
                            <span className="text-[12px] tracking-wide font-normal">
                              {item.title}
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Environment Switcher - Elegant and discrete */}
        <div className="mt-auto pt-6">
          {!isCollapsed && <div className="mx-2 mb-4 h-px bg-sidebar-border/50" />}
          <button
            onClick={() => navigate('/select-environment')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <ArrowLeftRight className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-[11px] tracking-wide font-normal">
                Trocar ambiente
              </span>
            )}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
