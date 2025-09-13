import { Home, Users, PlusCircle, BarChart3, Settings, LogOut, Dumbbell, MessageCircle, Trophy, Apple } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";

const items = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Alunos", url: "/students", icon: Users },
  { title: "Nova Avaliação", url: "/evaluation", icon: PlusCircle },
  { title: "Treinos", url: "/workouts", icon: Dumbbell },
  { title: "Nutrição", url: "/nutrition", icon: Apple },
  { title: "Chat", url: "/chat", icon: MessageCircle },
  { title: "Desafios", url: "/challenges", icon: Trophy },
  { title: "Relatórios", url: "/reports", icon: BarChart3 },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const collapsed = state === "collapsed";

  const getNavCls = ({ isActive }: { isActive: boolean }) => {
    const baseClasses = "flex items-center gap-3 w-full h-12 px-3 text-sm font-medium transition-all duration-300 ease-in-out transform";
    const activeClasses = isActive 
      ? "bg-primary text-primary-foreground font-semibold shadow-md ring-1 ring-primary/50"  // Ativo: fundo sólido + sombra + ring
      : "text-foreground hover:bg-gradient-to-r hover:from-accent/50 hover:to-primary/20 hover:text-accent-foreground hover:scale-105 hover:shadow-lg"; // Hover: gradiente sutil, escala e sombra
    
    // Garante visibilidade total sempre
    const visibilityClasses = collapsed ? "opacity-100" : "opacity-100";
    
    return `${baseClasses} ${activeClasses} ${visibilityClasses}`;
  };

  return (
    <Sidebar
      className="w-64" // Largura fixa para visibilidade
      collapsible="icon"
      style={{
        minWidth: '240px', // Largura mínima para labels
        maxWidth: '300px', // Largura máxima
      }}
    >
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="gradient-primary p-2 rounded-lg shadow-glow">
            <Activity className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gradient">
              FitPro V2
            </h2>
            <p className="text-xs text-muted-foreground">Plataforma Fitness</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup className="space-y-1">
          <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground px-2">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="justify-start w-full h-12 p-3 transition-all duration-300 ease-in-out hover:scale-105 group">
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => getNavCls({ isActive })} 
                      style={{
                        opacity: 1, // Visibilidade total sempre
                        color: location.pathname === item.url ? 'var(--primary-foreground)' : 'var(--foreground)',
                        backgroundColor: location.pathname === item.url ? 'var(--primary)' : 'transparent',
                      }}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                      <span className="ml-3 text-sm font-medium transition-colors duration-300">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-2">
          <div className="px-2 py-1">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Trainer</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start hover:bg-destructive/10 hover:text-destructive transition-all duration-300 hover:scale-105"
          >
            <LogOut className="h-4 w-4 mr-3 transition-transform duration-300 hover:scale-110" />
            Sair
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}