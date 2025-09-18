import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import HomeV2 from "./pages/HomeV2";
import Auth from "./pages/Auth";
import Students from "./pages/Students";
import Evaluation from "./pages/Evaluation";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import StudentPortal from "./pages/StudentPortal";
import Workouts from "./pages/Workouts";
import Challenges from "./pages/Challenges";
import WorkoutDetail from "./pages/WorkoutDetail";
import Chat from "./pages/Chat"; // Importar o novo componente Chat

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/home" element={<HomeV2 />} />
            <Route path="/" element={<Layout><Index /></Layout>} />
            <Route path="/dashboard" element={<Layout><Index /></Layout>} />
            <Route path="/students" element={<Layout><Students /></Layout>} />
            <Route path="/evaluation" element={<Layout><Evaluation /></Layout>} />
            <Route path="/reports" element={<Layout><Reports /></Layout>} />
            <Route path="/settings" element={<Layout><Settings /></Layout>} />
            <Route path="/workouts" element={<Layout><Workouts /></Layout>} />
            <Route path="/workouts/:workoutId" element={<Layout><WorkoutDetail /></Layout>} />
            <Route path="/workouts/edit/:workoutId" element={<Layout><Workouts /></Layout>} />
            <Route path="/challenges" element={<Layout><Challenges /></Layout>} />
            <Route path="/chat" element={<Layout><Chat /></Layout>} /> {/* Nova rota para o chat */}
            <Route path="/portal/:trainerId" element={<StudentPortal />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;