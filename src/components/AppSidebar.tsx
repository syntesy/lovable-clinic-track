import { Users, Bot, BookOpen } from "lucide-react";
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
import logoRegenapp from "@/assets/logo-regenapp.png";

const menuItems = [
  { title: "Pacientes", url: "/pacientes", icon: Users },
  { title: "Curadoria Clínica", url: "/curadoria", icon: BookOpen },
  { title: "AGENTE REGENAPP", url: "/agente-mac", icon: Bot, isAgent: true },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-[#253441] bg-[#1B2636]">
      <SidebarContent className="px-4 py-8">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          {!isCollapsed ? (
            <>
              <div className="w-72 h-20 mb-2">
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
                  <SidebarMenuButton asChild className="h-12">
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#B7BBC0] hover:text-[#FEFEFE] hover:bg-[#293E48]/50 transition-colors"
                      activeClassName="bg-[#293E48] text-[#FEFEFE] font-medium"
                    >
                      <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="text-[13px] tracking-wide font-normal">
                          {item.title}
                        </span>
                      )}
                      {!isCollapsed && item.isAgent && (
                        <span className="ml-auto px-1.5 py-0.5 text-[9px] font-medium bg-[#293E48] text-[#79B997] rounded tracking-wider border border-[#253441]">
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
