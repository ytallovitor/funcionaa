import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner"; // Usando sonner para consistência
import { Activity } from "lucide-react";
import StudentPortalDashboardContent from "@/components/StudentPortalDashboardContent"; // Importar o novo componente

const StudentPortal = () => {
  const { trainerId: _trainerId } = useParams();
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Authenticate via RPC to bypass RLS safely
      const { data: student, error: loginError } = await supabase
        .rpc('fn_student_portal_login', {
          p_username: loginForm.username,
          p_password: loginForm.password,
        })
        .maybeSingle();

      if (loginError) throw loginError;

      if (!student) {
        toast.error("Usuário não encontrado", {
          description: "Verifique o nome de usuário e senha",
        });
        setLoading(false);
        return;
      }

      setStudentData(student);
      setIsLoggedIn(true);

      toast.success("Acesso liberado!", {
        description: "Bem-vindo ao seu portal de evolução",
      });

    } catch (error: any) {
      console.error('Login error:', error);
      toast.error("Erro", {
        description: error.message || "Não foi possível acessar os dados. Verifique suas credenciais e tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="gradient-primary p-3 rounded-xl shadow-glow mx-auto mb-4">
              <Activity className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Portal do Aluno
            </h1>
            <p className="text-muted-foreground mt-2">
              Acesse seus dados de evolução e treinos
            </p>
          </div>

          <Card className="shadow-primary border-primary/20">
            <CardHeader className="text-center space-y-1">
              <CardTitle className="text-lg">Entrar</CardTitle>
              <CardDescription>
                Insira suas credenciais para acessar sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <Label htmlFor="username">Nome de Usuário</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="seu_usuario"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="min-h-[44px]"
                />
              </div>
              <Button 
                onClick={handleLogin} 
                className="w-full min-h-[44px] gradient-primary shadow-primary hover:shadow-glow transition-all"
                disabled={!loginForm.username || !loginForm.password}
              >
                Entrar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <StudentPortalDashboardContent student={studentData} loginCredentials={loginForm} />
  );
};

export default StudentPortal;