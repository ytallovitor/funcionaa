import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"; // Import useSidebar
import { AppSidebar } from "@/components/AppSidebar";
import { Activity } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <Activity className="h-8 w-8 text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 px-4">
            <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground" />
            <div className="ml-4">
              <h1 className="text-lg font-semibold">YFit Pro Dashboard</h1>
            </div>
          </header>
          
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}