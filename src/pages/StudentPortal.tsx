import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Activity, User, Target, Calendar } from "lucide-react";

const StudentPortal = () => {
  const { trainerId } = useParams();
  const [studentData, setStudentData] = useState<any>(null);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { toast } = useToast();

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

      if (loginError) {
        throw loginError;
      }

      if (!student) {
        toast({
          title: "Usuário não encontrado",
          description: "Verifique o nome de usuário e senha",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Fetch evaluations via RPC (also bypasses RLS but only for this student)
      const { data: evalData, error: evalError } = await supabase
        .rpc('fn_student_evaluations', {
          p_username: loginForm.username,
          p_password: loginForm.password,
        });

      if (evalError) throw evalError;

      setStudentData(student);
      setEvaluations(evalData || []);
      setIsLoggedIn(true);
      setLoading(false);

      toast({
        title: "Acesso liberado!",
        description: "Bem-vindo ao seu portal de evolução",
      });

    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível acessar os dados. Verifique suas credenciais e tente novamente.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const latestEvaluation = evaluations[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="gradient-primary p-3 rounded-lg w-fit mx-auto mb-4">
              <Activity className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Portal do Aluno
            </CardTitle>
            <CardDescription>
              Acesse seus dados de evolução e treinos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input
                id="username"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                placeholder="Digite seu nome de usuário"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                placeholder="Digite sua senha"
              />
            </div>
            <Button onClick={handleLogin} className="w-full" disabled={!loginForm.username || !loginForm.password}>
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Olá, {studentData?.name}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe sua evolução e progresso
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-primary/10 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Peso Atual
              </CardTitle>
              <div className="gradient-primary p-2 rounded-lg">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {latestEvaluation?.weight ? `${latestEvaluation.weight}kg` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Última avaliação
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-primary/10 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                % Gordura
              </CardTitle>
              <div className="gradient-primary p-2 rounded-lg">
                <Activity className="h-4 w-4 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {latestEvaluation?.body_fat_percentage ? `${latestEvaluation.body_fat_percentage.toFixed(1)}%` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Gordura corporal
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-primary/10 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Objetivo
              </CardTitle>
              <div className="gradient-primary p-2 rounded-lg">
                <Target className="h-4 w-4 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-primary">
                {studentData?.goal?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Meta definida
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-primary/10 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avaliações
              </CardTitle>
              <div className="gradient-primary p-2 rounded-lg">
                <Calendar className="h-4 w-4 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {evaluations.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total realizadas
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Histórico de Avaliações
            </CardTitle>
            <CardDescription>
              Acompanhe sua evolução ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {evaluations.length > 0 ? (
                evaluations.map((evaluation, index) => (
                  <div key={evaluation.id} className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                    <div>
                      <p className="font-medium">
                        Avaliação #{evaluations.length - index}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(evaluation.evaluation_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Peso:</span> {evaluation.weight}kg
                      </p>
                      {evaluation.body_fat_percentage && (
                        <p className="text-sm">
                          <span className="font-medium">Gordura:</span> {evaluation.body_fat_percentage.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma avaliação encontrada</p>
                  <p className="text-xs mt-1">Aguarde sua primeira avaliação</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentPortal;