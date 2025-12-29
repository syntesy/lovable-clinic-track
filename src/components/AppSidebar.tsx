import { useState, useEffect } from "react";
import { Users, Bot, BookOpen, ShieldCheck, FileText, Settings, Handshake, CreditCard, UserCog } from "lucide-react";
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
import logoRegenapp from "@/assets/logo-regenapp.png";

const menuItems = [
  { title: "Pacientes", url: "/pacientes", icon: Users },
  { title: "Área do Paciente", url: "/patients/manage", icon: UserCog },
  { title: "Curadoria Clínica", url: "/curadoria", icon: BookOpen },
  { title: "Parceiros", url: "/partners", icon: Handshake },
  { title: "Plano & Assinatura", url: "/account/subscription", icon: CreditCard },
  { title: "AGENTE REGENAPP", url: "/agente-mac", icon: Bot, isAgent: true },
];

const adminMenuItems = [
  { title: "Dashboard", url: "/admin", icon: ShieldCheck },
  { title: "Gerenciar Artigos", url: "/admin/artigos", icon: FileText },
  { title: "Revisão de Curadorias", url: "/admin/curadoria", icon: Settings },
];

export function AppSidebar() {
  const { state, isMobile } = useSidebar();
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

  return (
    <Sidebar collapsible="icon" className="border-r border-[#253441] bg-[#1B2636] data-[state=open]:w-64 md:data-[state=open]:w-72">
      <SidebarContent className="px-3 md:px-4 py-6 md:py-8">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8 md:mb-10">
          {!isCollapsed ? (
            <>
              <div className="w-48 md:w-72 h-14 md:h-20 mb-2">
                <img
                  src={logoRegenapp}
                  alt="REGENAPP"
                  className="w-full h-full object-contain"
                />
              </div>
            </>
          ) : (
            <div className="w-9 h-9 rounded-full overflow-hidden bg-[#293E48]/50 p-0.5 flex items-center justify-center">
              <span className="text-[#79B997] font-bold text-xs">R</span>
            </div>
          )}
        </div>

        {/* Separator */}
        {!isCollapsed && <div className="mx-2 mb-8 h-px bg-[#253441]" />}

        {/* Navigation Menu */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-3">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10 md:h-12">
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg text-[#B7BBC0] hover:text-[#FEFEFE] hover:bg-[#293E48]/50 transition-colors"
                      activeClassName="bg-[#293E48] text-[#FEFEFE] font-medium"
                    >
                      <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="text-[12px] md:text-[13px] tracking-wide font-normal truncate">
                          {item.title}
                        </span>
                      )}
                      {!isCollapsed && item.isAgent && (
                        <span className="ml-auto px-1.5 py-0.5 text-[9px] font-medium bg-[#293E48] text-[#79B997] rounded tracking-wider border border-[#253441] flex-shrink-0">
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
            {!isCollapsed && <div className="mx-2 my-6 h-px bg-[#253441]" />}
            <SidebarGroup>
              {!isCollapsed && (
                <SidebarGroupLabel className="px-4 text-xs text-[#79B997] uppercase tracking-wider flex items-center gap-2 mb-2">
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
                          className="flex items-center gap-3 px-4 py-2 rounded-lg text-[#B7BBC0] hover:text-[#FEFEFE] hover:bg-[#293E48]/50 transition-colors"
                          activeClassName="bg-[#293E48] text-[#FEFEFE] font-medium"
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
      </SidebarContent>
    </Sidebar>
  );
}
