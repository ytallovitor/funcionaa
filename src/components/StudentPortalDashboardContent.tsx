import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Target, 
  MessageCircle,
  Camera,
  Activity,
  Weight,
  Zap,
  Trophy,
  Play,
  CalendarDays,
  Dumbbell // Adicionado import do Dumbbell
} from "lucide-react";
import { useState, useEffect } from "react";
import ChatSystem from "./ChatSystem";
import BodyCompositionCalculator from "./BodyCompositionCalculator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import StudentProgressCharts from "./StudentProgressCharts";
import StudentNutritionCard from "./StudentNutritionCard";
import StudentChallengesCard from "./StudentChallengesCard";
import WorkoutLogger from "./WorkoutLogger";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Video } from "lucide-react";

interface Student {
  id: string;
  name: string;
  age: number;
  gender: 'masculino' | 'feminino' | 'outro';
  goal: string;
  height: number;
  trainer_id: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface EvaluationData {
  evaluation_date: string;
  weight: number;
  body_fat_percentage: number;
  lean_mass: number;
  waist?: number;
  neck?: number;
  hip?: number;
  bmr?: number;
}

interface WorkoutTemplateExercise {
  id: string;
  order_index: number;
  sets: number;
  reps: number;
  weight_kg?: number;
  duration?: number;
  rest_time: number;
  notes?: string;
  exercises: {
    id: string;
    name: string;
    instructions: string[];
    video_url?: string;
  };
}

interface TodaysWorkout {
  id: string;
  assigned_date: string;
  workout_templates: {
    id: string;
    name: string;
    description: string;
    estimated_duration: number;
    workout_template_exercises: WorkoutTemplateExercise[];
  };
}

interface StudentPortalDashboardContentProps {
  student: Student;
  loginCredentials: LoginCredentials;
}

const StudentPortalDashboardContent = ({ student, loginCredentials }: StudentPortalDashboardContentProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quickStats, setQuickStats] = useState<any[]>([]);
  const [allEvaluations, setAllEvaluations] = useState<EvaluationData[]>([]);
  const [todaysWorkout, setTodaysWorkout] = useState<TodaysWorkout | null>(null);
  const [isWorkoutLoggerOpen, setIsWorkoutLoggerOpen] = useState(false);
  const [studentConversationId, setStudentConversationId] = useState<string | null>(null);
  const [trainerProfile, setTrainerProfile] = useState<{ id: string; full_name: string } | null>(null);
  const [allWorkouts, setAllWorkouts] = useState<any[]>([]); // Para o histórico de treinos

  useEffect(() => {
    fetchDashboardData();
  }, [student, loginCredentials]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      const [
        evaluationsResponse,
        workoutsResponse,
        trainerProfileResponse,
        conversationResponse,
      ] = await Promise.all([
        supabase.rpc('fn_student_evaluations', {
          p_username: loginCredentials.username,
          p_password: loginCredentials.password,
        }),
        supabase.rpc('fn_student_workouts', {
          p_username: loginCredentials.username,
          p_password: loginCredentials.password,
        }),
        supabase.from('profiles').select('id, full_name').eq('id', student.trainer_id).maybeSingle(), // Alterado para maybeSingle()
        supabase.from('conversations').select('id').eq('student_id', student.id).eq('trainer_id', student.trainer_id).maybeSingle(), // Alterado para maybeSingle()
      ]);

      if (evaluationsResponse.error) throw evaluationsResponse.error;
      if (workoutsResponse.error) throw workoutsResponse.error;
      
      // Tratamento para trainerProfileResponse
      if (trainerProfileResponse.error) throw trainerProfileResponse.error; // Erros reais ainda devem ser lançados
      if (!trainerProfileResponse.data) {
        throw new Error("Perfil do treinador não encontrado para este aluno. Verifique se o trainer_id está correto.");
      }
      setTrainerProfile(trainerProfileResponse.data);

      setAllEvaluations(evaluationsResponse.data || []);
      setAllWorkouts(workoutsResponse.data || []);

      // Set quick stats
      const latestEval = evaluationsResponse.data?.[0];
      setQuickStats([
        {
          title: "Peso Atual",
          value: latestEval?.weight ? `${latestEval.weight}kg` : 'N/A',
          change: latestEval?.weight ? "-2.1kg" : "Sem dados", // Mock change
          positive: true,
          icon: Weight
        },
        {
          title: "% Gordura",
          value: latestEval?.body_fat_percentage ? `${latestEval.body_fat_percentage.toFixed(1)}%` : 'N/A',
          change: latestEval?.body_fat_percentage ? "-3.2%" : "Sem dados", // Mock change
          positive: true,
          icon: Target
        },
        {
          title: "Massa Magra",
          value: latestEval?.lean_mass ? `${latestEval.lean_mass.toFixed(1)}kg` : 'N/A',
          change: latestEval?.lean_mass ? "+1.8kg" : "Sem dados", // Mock change
          positive: true,
          icon: TrendingUp
        },
        {
          title: "TMB",
          value: latestEval?.bmr ? `${latestEval.bmr} kcal` : 'N/A',
          change: latestEval?.bmr ? "+85 kcal" : "Sem dados", // Mock change
          positive: true,
          icon: Zap
        }
      ]);

      // Set today's workout
      const assignedWorkouts = workoutsResponse.data || [];
      const todaysAssignedWorkout = assignedWorkouts.find((w: any) => {
        const assignedDate = new Date(w.assigned_date).toISOString().split('T')[0];
        return assignedDate === today;
      });
      setTodaysWorkout(todaysAssignedWorkout || null);

      // Set conversation ID
      if (conversationResponse.error) throw conversationResponse.error; // Erros reais ainda devem ser lançados
      if (!conversationResponse.data) { // Se nenhuma conversa for encontrada
        // Criar nova conversa
        const { data: newConversation, error: createConvError } = await supabase
          .from('conversations')
          .insert({
            student_id: student.id,
            trainer_id: student.trainer_id,
            last_message_at: new Date().toISOString()
          })
          .select('id')
          .single(); // Este .single() é seguro, pois esperamos uma nova linha

        if (createConvError) throw createConvError;
        setStudentConversationId(newConversation.id);
      } else {
        setStudentConversationId(conversationResponse.data.id);
      }

    } catch (error: any) {
      console.error('Error fetching student dashboard data:', error);
      toast.error(`Erro ao carregar dados: ${error.message || "Tente novamente mais tarde"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkoutLogged = () => {
    fetchDashboardData(); // Re-fetch all data to update workout status and logs
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-gradient">
            Olá, {student.name}! 👋
          </h1>
          <p className="text-muted-foreground">
            Acompanhe seu progresso e continue sua jornada de transformação
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button className="h-20 flex-col gap-2 gradient-primary text-white">
            <Camera className="h-6 w-6" />
            <span className="text-sm">Nova Medida</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => studentConversationId && navigate(`/chat/${studentConversationId}`)}>
            <MessageCircle className="h-6 w-6" />
            <span className="text-sm">Chat Trainer</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2">
            <Activity className="h-6 w-6" />
            <span className="text-sm">Treino Hoje</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2">
            <Trophy className="h-6 w-6" />
            <span className="text-sm">Desafios</span>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => (
            <Card key={index} className="shadow-primary/10 border-primary/20 hover:shadow-primary/20 transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="gradient-primary p-2 rounded-lg">
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                {stat.value === 'N/A' ? (
                  <p className="text-xs text-muted-foreground mt-1">Sem dados ainda? Agende uma avaliação</p>
                ) : (
                  <div className="flex items-center gap-1 mt-1">
                    <Badge 
                      variant={stat.positive ? "default" : "destructive"}
                      className={stat.positive ? "bg-green-100 text-green-700" : ""}
                    >
                      {stat.change}
                    </Badge>
                    <span className="text-xs text-muted-foreground">vs. mês anterior</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Goals Progress - Mock for now, could be fetched via RPC */}
          <Card className="shadow-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Metas da Semana
              </CardTitle>
              <CardDescription>
                Acompanhe seu progresso semanal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Treinos Realizados</span>
                  <span className="font-medium">3/5</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Medidas Registradas</span>
                  <span className="font-medium">1/3</span>
                </div>
                <Progress value={33} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Fotos de Progresso</span>
                  <span className="font-medium">0/1</span>
                </div>
                <Progress value={0} className="h-2" />
              </div>

              <Button className="w-full gradient-primary text-white">
                <Trophy className="mr-2 h-4 w-4" />
                Ver Todas as Metas
              </Button>
            </CardContent>
          </Card>

          {/* Today's Workout */}
          <Card className="shadow-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Treino de Hoje
              </CardTitle>
              <CardDescription>
                Seu treino programado para hoje
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {todaysWorkout ? (
                <div className="p-4 bg-accent/50 rounded-lg">
                  <h4 className="font-semibold mb-2">{todaysWorkout.workout_templates?.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {todaysWorkout.workout_templates?.description} | Duração: {todaysWorkout.workout_templates?.estimated_duration} min
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    {todaysWorkout.workout_templates?.workout_template_exercises?.slice(0, 3).map((ex: any) => (
                      <div key={ex.exercises.id} className="flex justify-between">
                        <span>{ex.exercises.name}</span>
                        <span className="text-muted-foreground">
                          {ex.sets}x{ex.reps}
                        </span>
                      </div>
                    ))}
                    {todaysWorkout.workout_templates?.workout_template_exercises?.length > 3 && (
                      <div className="text-center text-muted-foreground">+ {todaysWorkout.workout_templates.workout_template_exercises.length - 3} exercícios</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhum treino para hoje</p>
                  <p className="text-sm mt-1">Verifique com seu trainer ou aguarde atribuição</p>
                </div>
              )}
              
              <div className="flex gap-2">
                {todaysWorkout && (
                  <Button 
                    className="flex-1 gradient-primary text-white"
                    onClick={() => setIsWorkoutLoggerOpen(true)}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Iniciar Treino
                  </Button>
                )}
                <Button variant="outline" size="icon" onClick={() => studentConversationId && navigate(`/chat/${studentConversationId}`)}>
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts, Nutrition, Challenges */}
        <div className="grid lg:grid-cols-2 gap-6">
          <StudentProgressCharts evaluations={allEvaluations} loading={loading} />

          <div className="space-y-6">
            <StudentNutritionCard studentId={student.id} />
            <StudentChallengesCard studentId={student.id} />
          </div>
        </div>

        {/* Body Composition */}
        <Card className="shadow-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Composição Corporal
            </CardTitle>
            <CardDescription>
              Baseado nas últimas medidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allEvaluations.length > 0 ? (
              <BodyCompositionCalculator
                data={{
                  weight: allEvaluations[0].weight || 0,
                  height: student.height || 175,
                  age: student.age || 28,
                  gender: student.gender === 'masculino' ? 'male' : 'female',
                  waist: allEvaluations[0].waist || 0,
                  neck: allEvaluations[0].neck || 0,
                  hip: student.gender === 'feminino' ? allEvaluations[0].hip || 0 : undefined,
                }}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Sem medidas recentes</p>
                <p className="text-sm mt-1">Agende uma avaliação com seu personal para ver sua composição corporal</p>
                <Button className="mt-4 gradient-primary" onClick={() => studentConversationId && navigate(`/chat/${studentConversationId}`)}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Agendar com Personal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico de Treinos */}
        <Card className="shadow-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              Histórico de Treinos
            </CardTitle>
            <CardDescription>
              Todos os treinos atribuídos pelo seu personal trainer
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            {allWorkouts.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {allWorkouts.map((workout: any, _index: number) => (
                  <AccordionItem key={workout.id} value={workout.id} className="border-b">
                    <AccordionTrigger className="text-sm px-2 py-3 hover:no-underline">
                      {workout.name}
                    </AccordionTrigger>
                    <AccordionContent className="px-2 py-3 space-y-2">
                      <p className="text-sm text-muted-foreground mb-2">{workout.description}</p>
                      {workout.exercises?.map((ex: any, exIndex: number) => (
                        <div key={exIndex} className="p-3 bg-accent/50 rounded text-xs border border-accent/70">
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
                            <Button variant="outline" size="sm" className="mt-3" onClick={() => window.open(ex.video_url, '_blank')}>
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
                <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
          <CardContent className="max-h-[300px] overflow-y-auto">
            <div className="space-y-3">
              {allEvaluations.length > 0 ? (
                allEvaluations.map((evaluation, index) => (
                  <div key={evaluation.evaluation_date + index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-accent/50 rounded-lg">
                    <div className="mb-2 sm:mb-0">
                      <h4 className="font-medium text-sm">
                        Avaliação #{allEvaluations.length - index}
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

        {/* Quick Chat */}
        <Card className="shadow-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Chat com Personal
            </CardTitle>
            <CardDescription>
              Converse com seu personal trainer
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {studentConversationId && trainerProfile ? (
              <ChatSystem 
                compact 
                conversationId={studentConversationId} 
                recipientName={trainerProfile.full_name} 
                recipientType="trainer" 
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Carregando chat...</p>
                <p className="text-sm mt-1">Se o chat não aparecer, tente recarregar a página.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {todaysWorkout && (
        <WorkoutLogger
          open={isWorkoutLoggerOpen}
          onOpenChange={setIsWorkoutLoggerOpen}
          todaysWorkout={todaysWorkout}
          studentId={student.id}
          onWorkoutLogged={handleWorkoutLogged}
        />
      )}
    </div>
  );
};

export default StudentPortalDashboardContent;