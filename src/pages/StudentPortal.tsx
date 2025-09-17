import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Activity, User, Target, Calendar, Dumbbell, Video } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import StudentProgressCharts from "@/components/StudentProgressCharts"; // Importar o novo componente de gráficos

const StudentPortal = () => {
  const { trainerId: _trainerId } = useParams(); // Renamed to _trainerId as it's not used
  const [studentData, setStudentData] = useState<any>(null);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
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

      if (loginError) throw loginError;

      if (!student) {
        toast({
          title: "Usuário não encontrado",
          description: "Verifique o nome de usuário e senha",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Fetch evaluations and workouts in parallel
      const [evalResponse, workoutResponse] = await Promise.all([
        supabase.rpc('fn_student_evaluations', {
          p_username: loginForm.username,
          p_password: loginForm.password,
        }),
        supabase.rpc('fn_student_workouts', {
          p_username: loginForm.username,
          p_password: loginForm.password,
        })
      ]);

      if (evalResponse.error) throw evalResponse.error;
      if (workoutResponse.error) throw workoutResponse.error;

      setStudentData(student);
      setEvaluations(evalResponse.data || []);
      setWorkouts(workoutResponse.data || []);
      setIsLoggedIn(true);

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
    } finally {
      setLoading(false);
    }
  };

  const latestEvaluation = evaluations[0];

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
                  className="min-h-[44px]" // Touch-friendly height
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
                  className="min-h-[44px]" // Touch-friendly
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Olá, {studentData?.name}!
          </h1>
          <p className="text-muted-foreground">
            Acompanhe sua evolução e progresso
          </p>
        </div>

        {/* Stats - Single column on mobile, 2 cols on sm+, 4 on lg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-primary/10 border-primary/20">
            <CardHeader className="flex flex-col items-center space-y-1 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Peso Atual
              </CardTitle>
              <div className="gradient-primary p-2 rounded-lg">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-lg font-bold text-primary">
                {latestEvaluation?.weight ? `${latestEvaluation.weight}kg` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Última avaliação
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-primary/10 border-primary/20">
            <CardHeader className="flex flex-col items-center space-y-1 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                % Gordura
              </CardTitle>
              <div className="gradient-primary p-2 rounded-lg">
                <Activity className="h-4 w-4 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-lg font-bold text-primary">
                {latestEvaluation?.body_fat_percentage ? `${latestEvaluation.body_fat_percentage.toFixed(1)}%` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Gordura corporal
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-primary/10 border-primary/20">
            <CardHeader className="flex flex-col items-center space-y-1 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Objetivo
              </CardTitle>
              <div className="gradient-primary p-2 rounded-lg">
                <Target className="h-4 w-4 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-sm font-bold text-primary">
                {studentData?.goal?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Meta definida
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-primary/10 border-primary/20">
            <CardHeader className="flex flex-col items-center space-y-1 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avaliações
              </CardTitle>
              <div className="gradient-primary p-2 rounded-lg">
                <Calendar className="h-4 w-4 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-lg font-bold text-primary">
                {evaluations.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total realizadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de Progresso */}
        <StudentProgressCharts evaluations={evaluations} loading={loading} />

        {/* Main Sections - Stack vertically on mobile */}
        <div className="space-y-6">
          {/* Meus Treinos */}
          <Card className="shadow-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                Meus Treinos
              </CardTitle>
              <CardDescription>
                Seus treinos atribuídos pelo seu personal trainer
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[400px] overflow-y-auto"> {/* Scrollable on mobile */}
              {workouts.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {workouts.map((workout) => (
                    <AccordionItem key={workout.id} value={workout.id} className="border-b">
                      <AccordionTrigger className="text-sm px-2 py-3 hover:no-underline"> {/* Touch-friendly padding */}
                        {workout.name}
                      </AccordionTrigger>
                      <AccordionContent className="px-2 py-3 space-y-2">
                        <p className="text-sm text-muted-foreground mb-2">{workout.description}</p>
                        {workout.exercises?.map((ex: any, index: number) => (
                          <div key={index} className="p-3 bg-accent/50 rounded text-xs border border-accent/70">
                            <p className="font-medium text-base">{ex.name}</p>
                            <p className="text-muted-foreground mt-1">
                              {ex.sets} séries x {ex.reps} reps • Descanso: {ex.rest_time}s
                            </p>
                            {ex.instructions && ex.instructions.length > 0 && (
                              <div className="mt-2">
                                <h5 className="font-semibold text-xs text-primary">Instruções:</h5>
                                <ul className="list-disc list-inside text-xs text-muted-foreground">
                                  {ex.instructions.map((inst: string, i: number) => <li key={i}>{inst}</li>)}
                                </ul>
                              </div>
                            )}
                            {ex.notes && <p className="text-primary mt-2">Nota do Trainer: {ex.notes}</p>}
                            {ex.video_url && (
                              <Button variant="outline" size="sm" className="mt-3">
                                <Video className="h-3 w-3 mr-1" />
                                Ver Vídeo
                              </Button>
                            )}
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Nenhum treino atribuído ainda</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico de Avaliações */}
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
            <CardContent className="max-h-[300px] overflow-y-auto"> {/* Scrollable on mobile */}
              <div className="space-y-3">
                {evaluations.length > 0 ? (
                  evaluations.map((evaluation, index) => (
                    <div key={evaluation.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-accent/50 rounded-lg">
                      <div className="mb-2 sm:mb-0">
                        <h4 className="font-medium text-sm">
                          Avaliação #{evaluations.length - index}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(evaluation.evaluation_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Peso:</span> {evaluation.weight}kg
                        </p>
                        {evaluation.body_fat_percentage && (
                          <p>
                            <span className="font-medium">Gordura:</span> {evaluation.body_fat_percentage.toFixed(1)}%
                          </p>
                        )}
                        {evaluation.lean_mass && (
                          <p>
                            <span className="font-medium">Massa Magra:</span> {evaluation.lean_mass.toFixed(1)}kg
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
    </div>
  );
};

export default StudentPortal;