import { GraduationCap, BookOpen, Users, Settings, LayoutDashboard, FlaskConical, FileText, BarChart3, UserCog, ClipboardList, Microscope, ShieldCheck, Activity, Library } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useCurrentInstitution } from '@/hooks/useEduMembership';
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
} from '@/components/ui/sidebar';

const studentMenuItems = [
  { title: "Dashboard", url: "/edu", icon: LayoutDashboard },
  { title: "Minhas Turmas", url: "/edu/cohorts", icon: BookOpen },
  { title: "Meu Progresso", url: "/edu/progress", icon: BarChart3 },
  { title: "Biblioteca Científica", url: "/academy/biblioteca", icon: FlaskConical },
  { title: "Reghen Evidence Method™", url: "/academy/about/reghen-evidence-method", icon: ShieldCheck },
];

const teacherMenuItems = [
  { title: "Dashboard", url: "/edu/teacher/dashboard", icon: LayoutDashboard },
  { title: "Turmas", url: "/edu/teacher/cohorts", icon: Users },
  { title: "Módulos", url: "/edu/teacher/modules", icon: BookOpen },
  { title: "Conteúdos", url: "/edu/teacher/learning-objects", icon: FileText },
  { title: "Curadoria Científica", url: "/academy/admin/curador", icon: Microscope },
  { title: "Casos Clínicos", url: "/edu/teacher/cases", icon: FlaskConical },
  { title: "Checkpoints", url: "/edu/teacher/checkpoints", icon: ClipboardList },
  { title: "Decision Lab", url: "/edu/teacher/decision-lab", icon: FlaskConical },
  { title: "Analytics", url: "/edu/teacher/analytics", icon: BarChart3 },
];

const directorMenuItems = [
  { title: "Console", url: "/edu/director/console", icon: LayoutDashboard },
  { title: "Fila de Curadoria", url: "/academy/admin/curador", icon: ClipboardList },
];

const adminMenuItems = [
  { title: "Membros", url: "/edu/admin/members", icon: Users },
  { title: "Matrículas", url: "/edu/admin/enrollments", icon: UserCog },
  { title: "Biblioteca Científica", url: "/academy/admin/biblioteca", icon: BookOpen },
  { title: "Papers & Curadoria REM™", url: "/academy/admin/papers", icon: Microscope },
  { title: "Painel do Curador", url: "/academy/admin/curador", icon: FlaskConical },
  { title: "Pipeline Health", url: "/academy/admin/pipeline-health", icon: Activity },
  { title: "Configurações", url: "/edu/admin/settings", icon: Settings },
];

export function EduSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { role } = useCurrentInstitution();

  const isTeacher = role === 'teacher' || role === 'director' || role === 'institution_admin';
  const isDirector = role === 'director' || role === 'institution_admin';
  const isAdmin = role === 'institution_admin';

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarContent className="px-3 md:px-4 py-6 md:py-8">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          {!isCollapsed ? (
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="text-lg font-bold text-foreground">Academy</span>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full overflow-hidden bg-sidebar-accent/50 p-0.5 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>

        {/* Separator */}
        {!isCollapsed && <div className="mx-2 mb-6 h-px bg-sidebar-border" />}

        {/* Student Menu */}
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel className="text-xs text-muted-foreground mb-2">Estudante</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {studentMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink
                      to={item.url}
                      end={item.url === '/edu'}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="text-sm truncate">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Teacher Menu */}
        {isTeacher && (
          <SidebarGroup className="mt-6">
            {!isCollapsed && <SidebarGroupLabel className="text-xs text-muted-foreground mb-2">Professor</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {teacherMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-10">
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && (
                          <span className="text-sm truncate">{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Director Menu */}
        {isDirector && (
          <SidebarGroup className="mt-6">
            {!isCollapsed && <SidebarGroupLabel className="text-xs text-muted-foreground mb-2">Diretor</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {directorMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-10">
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && (
                          <span className="text-sm truncate">{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Menu */}
        {isAdmin && (
          <SidebarGroup className="mt-6">
            {!isCollapsed && <SidebarGroupLabel className="text-xs text-muted-foreground mb-2">Administração</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-10">
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && (
                          <span className="text-sm truncate">{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
