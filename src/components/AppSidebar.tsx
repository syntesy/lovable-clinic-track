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
      <SidebarContent className="px-3 py-6">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          {!isCollapsed ? (
            <>
              <div className="w-20 h-20 mb-3 rounded-full overflow-hidden bg-sidebar-accent p-1.5 shadow-lg">
                <img 
                  src={logoFisioregen} 
                  alt="Fisioterapia Regenerativa" 
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <h1 className="text-sidebar-foreground font-semibold text-sm tracking-wide text-center leading-tight">
                FISIOTERAPIA<br />
                <span className="font-normal text-xs tracking-widest opacity-80">REGENERATIVA</span>
              </h1>
            </>
          ) : (
            <div className="w-10 h-10 rounded-full overflow-hidden bg-sidebar-accent p-0.5 shadow-md">
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
          <div className="mx-4 mb-6 h-px bg-sidebar-border" />
        )}

        {/* Navigation Menu */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-11">
                    <NavLink
                      to={item.url}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg
                        text-sidebar-foreground/70 hover:text-sidebar-foreground
                        hover:bg-sidebar-accent transition-all duration-200
                        ${item.isAgent ? 'group' : ''}
                      `}
                      activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium border-l-2 border-sidebar-primary"
                    >
                      <item.icon className={`h-[18px] w-[18px] flex-shrink-0 ${item.isAgent ? 'text-primary' : 'opacity-80'}`} />
                      {!isCollapsed && (
                        <span className={`text-[13px] tracking-wide ${item.isAgent ? 'font-semibold text-primary' : 'font-medium'}`}>
                          {item.title}
                        </span>
                      )}
                      {!isCollapsed && item.isAgent && (
                        <span className="ml-auto px-1.5 py-0.5 text-[9px] font-semibold bg-primary/20 text-primary rounded tracking-wider">
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
