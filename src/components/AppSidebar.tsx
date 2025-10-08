import { Home, Users, PlusCircle, BarChart3, Settings, LogOut, Dumbbell, MessageCircle, Trophy, Activity } from "lucide-react";
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
import { cn } from "@/lib/utils";

const items = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Alunos", url: "/students", icon: Users },
  { title: "Nova Avaliação", url: "/evaluation", icon: PlusCircle },
  { title: "Relatórios", url: "/reports", icon: BarChart3 },
  { title: "Configurações", url: "/settings", icon: Settings },
];

const v2Items = [
  { title: "Treinos", url: "/workouts", icon: Dumbbell },
  { title: "Chat", url: "/chat", icon: MessageCircle },
  { title: "Desafios", url: "/challenges", icon: Trophy },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar
      className={collapsed ? "w-16" : "w-96"}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-lg blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-lg shadow-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
          {!collapsed && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                GymPal Pro
              </h2>
              <p className="text-xs text-muted-foreground">Plataforma Fitness</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-0">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-3 text-xs font-semibold tracking-wider">
            {!collapsed && "Menu Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-3">
              {items.map((item, index) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title} style={{ animationDelay: `${index * 50}ms` }}>
                    <NavLink
                      to={item.url}
                      end
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300",
                        "hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50",
                        "hover:shadow-sm hover:translate-x-1",
                        active && "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200",
                        !active && "text-slate-700 hover:text-emerald-700"
                      )}
                    >
                      <div className={cn(
                        "relative transition-transform duration-300 group-hover:scale-110",
                        active && "animate-pulse"
                      )}>
                        {active && (
                          <div className="absolute inset-0 bg-white/30 rounded blur-sm" />
                        )}
                        <item.icon className={cn(
                          "h-5 w-5 relative z-10",
                          active ? "text-white" : "text-slate-600 group-hover:text-emerald-600"
                        )} />
                      </div>
                      {!collapsed && (
                        <span className="animate-in fade-in slide-in-from-left-1 duration-200">
                          {item.title}
                        </span>
                      )}
                      {active && !collapsed && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      )}
                    </NavLink>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="px-4 py-3 text-xs font-semibold tracking-wider">
            {!collapsed && (
              <span className="flex items-center gap-2">
                V2.0 Features
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full">NEW</span>
              </span>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-3">
              {v2Items.map((item, index) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title} style={{ animationDelay: `${(items.length + index) * 50}ms` }}>
                    <NavLink
                      to={item.url}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300",
                        "hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50",
                        "hover:shadow-sm hover:translate-x-1",
                        active && "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200",
                        !active && "text-slate-700 hover:text-emerald-700"
                      )}
                    >
                      <div className={cn(
                        "relative transition-transform duration-300 group-hover:scale-110",
                        active && "animate-pulse"
                      )}>
                        {active && (
                          <div className="absolute inset-0 bg-white/30 rounded blur-sm" />
                        )}
                        <item.icon className={cn(
                          "h-5 w-5 relative z-10",
                          active ? "text-white" : "text-slate-600 group-hover:text-emerald-600"
                        )} />
                      </div>
                      {!collapsed && (
                        <span className="animate-in fade-in slide-in-from-left-1 duration-200">
                          {item.title}
                        </span>
                      )}
                      {active && !collapsed && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      )}
                    </NavLink>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-3">
          {!collapsed && user && (
            <div className="px-3 py-2 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-sm font-semibold truncate text-slate-800">{user.email}</p>
              <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Fitness Pro
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            onClick={signOut}
            className={cn(
              "w-full justify-start transition-all duration-300",
              "hover:bg-red-50 hover:text-red-600 hover:shadow-sm hover:translate-x-1",
              "group relative overflow-hidden"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-red-500/0 group-hover:from-red-500/5 group-hover:to-red-500/10 transition-all duration-300" />
            <LogOut className="h-4 w-4 relative z-10 transition-transform duration-300 group-hover:scale-110" />
            {!collapsed && <span className="ml-2 relative z-10">Sair</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;