import { Users, Bot } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import logoFisioregen from "@/assets/logo-fisioregen.png";

const menuItems = [
  { title: "Pacientes", url: "/pacientes", icon: Users },
  { title: "AGENTE FISIOREGEN", url: "/agente-mac", icon: Bot, isAgent: true },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarContent className="px-4 py-8">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          {!isCollapsed ? (
            <>
              <div className="w-16 h-16 mb-4 rounded-full overflow-hidden bg-white/10 p-1 shadow-sm">
                <img 
                  src={logoFisioregen} 
                  alt="Fisioterapia Regenerativa" 
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <h1 className="text-white font-semibold text-sm tracking-wide text-center leading-tight">
                FISIOTERAPIA<br />
                <span className="font-normal text-xs tracking-widest text-white/60">REGENERATIVA</span>
              </h1>
            </>
          ) : (
            <div className="w-9 h-9 rounded-full overflow-hidden bg-white/10 p-0.5">
              <img 
                src={logoFisioregen} 
                alt="Fisioterapia Regenerativa" 
                className="w-full h-full object-contain rounded-full"
              />
            </div>
          )}
        </div>

        {/* Separator */}
        {!isCollapsed && (
          <div className="mx-2 mb-8 h-px bg-white/10" />
        )}

        {/* Navigation Menu */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12">
                    <NavLink
                      to={item.url}
                      className="
                        flex items-center gap-3 px-4 py-3 rounded-lg
                        text-[#6B7280] hover:text-white
                        hover:bg-white/5 transition-all duration-200
                      "
                      activeClassName="bg-[#4A6378] text-white font-medium"
                    >
                      <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="text-[13px] tracking-wide font-normal">
                          {item.title}
                        </span>
                      )}
                      {!isCollapsed && item.isAgent && (
                        <span className="ml-auto px-1.5 py-0.5 text-[9px] font-medium bg-white/10 text-white/70 rounded tracking-wider">
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
      </SidebarContent>
    </Sidebar>
  );
}
