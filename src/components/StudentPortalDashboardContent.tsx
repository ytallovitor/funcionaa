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
import { useStudentData } from "@/hooks/useStudentData"; // Import useStudentData

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

// Nova interface para o retorno da RPC fn_student_workouts
interface RpcWorkoutOutput {
  id: string; // workout_template_id
  name: string; // workout_template_name
  description: string; // workout_template_description
  category: string;
  difficulty: string;
  estimated_duration: number;
  assigned_date: string; // from student_workouts
  exercises: { // This is the json_agg from workout_template_exercises
    id: string; // Added exercise ID
    name: string;
    sets: number;
    reps: number;
    rest_time: number;
    notes?: string;
    instructions: string[];
    video_url?: string; // Added video_url
    duration?: number; // Adicionado duration
    order_index: number; // Adicionado order_index
  }[];
}

// A interface TodaysWorkout agora usa a RpcWorkoutOutput
type TodaysWorkout = RpcWorkoutOutput;

interface StudentPortalDashboardContentProps {
  student: Student;
  loginCredentials: LoginCredentials;
}

const StudentPortalDashboardContent = ({ student, loginCredentials }: StudentPortalDashboardContentProps) => {
  const navigate = useNavigate();
  const studentData = useStudentData(); // Fixed: direct assignment, no destructuring of 'data'
  const [loadingEvaluations, setLoadingEvaluations] = useState(true); // Added missing state
  const [loading, setLoading] = useState(true); // Keep local loading for RPC calls
  const [quickStats, setQuickStats] = useState<any[]>([]);
  const [allEvaluations, setAllEvaluations] = useState<EvaluationData[]>([]);
  const [todaysWorkout, setTodaysWorkout] = useState<TodaysWorkout | null>(null);
  const [isWorkoutLoggerOpen, setIsWorkoutLoggerOpen] = useState(false);
  const [studentConversationId, setStudentConversationId] = useState<string | null>(null);
  const [trainerProfile, setTrainerProfile] = useState<{ id: string; full_name: string } | null>(null);
  const [allWorkouts, setAllWorkouts] = useState<any[]>([]); // Para o histórico de treinos

  useEffect(() => {
    fetchDashboardData();
  }, [student, loginCredentials, studentData.loading]); // Re-fetch when studentData.loading changes

  useEffect(() => {
    if (!studentData.loading && studentData) {
      // Update quick stats from studentData (direct access)
      const measurements = studentData.latestMeasurements;
      setQuickStats([
        {
          title: "Peso Atual",
          value: measurements.weight ? `${measurements.weight}kg` : 'N/A',
          change: measurements.weight ? "-2.1kg" : "Sem dados", // Mock change
          positive: true,
          icon: Weight
        },
        {
          title: "% Gordura",
          value: measurements.bodyFat ? `${measurements.bodyFat.toFixed(1)}%` : 'N/A', // Formatar para 1 casa decimal
          change: measurements.bodyFat ? "-3.2%" : "Sem dados", // Mock change
          positive: true,
          icon: Target
        },
        {
          title: "Massa Magra",
          value: measurements.leanMass ? `${measurements.leanMass.toFixed(1)}kg` : 'N/A', // Formatar para 1 casa decimal
          change: measurements.leanMass ? "+1.8kg" : "Sem dados", // Mock change
          positive: true,
          icon: TrendingUp
        },
        {
          title: "TMB",
          value: measurements.tmb ? `${measurements.tmb} kcal` : 'N/A',
          change: measurements.tmb ? "+85 kcal" : "Sem dados", // Mock change
          positive: true,
          icon: Zap
        }
      ]);
    }
  }, [studentData]); // Depend on studentData directly


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

      // Set today's workout
      const assignedWorkouts = workoutsResponse.data || [];
      const todaysAssignedWorkout = assignedWorkouts.find((w: RpcWorkoutOutput) => { // Usar RpcWorkoutOutput aqui
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

  // Fixed: Call fetchAllEvaluations in useEffect
  useEffect(() => {
    fetchAllEvaluations();
  }, [student.id]); // Depend on student.id to re-fetch when needed

  const fetchAllEvaluations = async () => {
    setLoadingEvaluations(true);
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select('evaluation_date, weight, body_fat_percentage, lean_mass')
        .eq('student_id', student.id)
        .order('evaluation_date', { ascending: true });

      if (error) throw error;
      setAllEvaluations(data || []);
    } catch (error) {
      console.error('Error fetching all evaluations:', error);
    } finally {
      setLoadingEvaluations(false);
    }
  };

  const handleWorkoutLogged = () => {
    fetchDashboardData(); // Re-fetch all data to update workout status and logs
  };

  const getProgressValue = (completed: number, target: number) => {
    return target > 0 ? Math.min((completed / target) * 100, 100) : 0;
  };

  if (loading || studentData.loading) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header with Premium Design */}
        <div className="relative">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-br from-emerald-400/20 to-teal-600/20 rounded-full blur-3xl" />
          <div className="absolute -top-10 -right-20 w-72 h-72 bg-gradient-to-br from-blue-400/10 to-cyan-600/10 rounded-full blur-3xl" />
          <div className="relative space-y-3 text-center animate-in fade-in slide-in-from-top-4 duration-500">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Olá, {student.name}! 👋
            </h1>
            <p className="text-slate-600 text-xl">
              Acompanhe seu progresso e continue sua jornada de transformação
            </p>
          </div>
        </div>

        {/* Quick Actions with Premium Design */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
          <Button className="group h-24 flex-col gap-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-2xl hover:shadow-emerald-200 transition-all duration-300 hover:scale-105 border-none">
            <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors duration-300">
              <Camera className="h-6 w-6" />
            </div>
            <span className="text-sm font-semibold">Nova Medida</span>
          </Button>
          <Button variant="outline" className="group h-24 flex-col gap-3 border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-300 hover:scale-105 hover:shadow-xl" onClick={() => studentConversationId && navigate(`/chat/${studentConversationId}`)}>
            <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors duration-300">
              <MessageCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <span className="text-sm font-semibold text-emerald-700">Chat Trainer</span>
          </Button>
          <Button variant="outline" className="group h-24 flex-col gap-3 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 hover:scale-105 hover:shadow-xl">
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-sm font-semibold text-blue-700">Treino Hoje</span>
          </Button>
          <Button variant="outline" className="group h-24 flex-col gap-3 border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50 transition-all duration-300 hover:scale-105 hover:shadow-xl">
            <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors duration-300">
              <Trophy className="h-6 w-6 text-amber-600" />
            </div>
            <span className="text-sm font-semibold text-amber-700">Desafios</span>
          </Button>
        </div>

        {/* Stats Grid with Premium Design */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => (
            <Card key={index} className="group relative overflow-hidden border-slate-200 hover:border-emerald-300 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-100 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${(index + 4) * 100}ms` }}>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-600 group-hover:text-emerald-700 transition-colors duration-300">
                  {stat.title}
                </CardTitle>
                <div className="relative group/icon">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-lg blur-sm opacity-75 group-hover/icon:opacity-100 transition-opacity duration-300" />
                  <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-lg shadow-lg transform group-hover/icon:scale-110 transition-transform duration-300">
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">{stat.value}</div>
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
          {/* Goals Progress - Real */}
          <Card className="shadow-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Metas da Semana
              </CardTitle>
              <CardDescription>
                Acompanhe seu progresso semanal (dados reais)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {studentData.weeklyGoals ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Treinos Realizados</span>
                      <span className="font-medium">
                        {studentData.weeklyGoalsProgress.workouts.completed}/{studentData.weeklyGoalsProgress.workouts.target}
                      </span>
                    </div>
                    <Progress 
                      value={getProgressValue(studentData.weeklyGoalsProgress.workouts.completed, studentData.weeklyGoalsProgress.workouts.target)} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Medidas Registradas</span>
                      <span className="font-medium">
                        {studentData.weeklyGoalsProgress.measurements.completed}/{studentData.weeklyGoalsProgress.measurements.target}
                      </span>
                    </div>
                    <Progress 
                      value={getProgressValue(studentData.weeklyGoalsProgress.measurements.completed, studentData.weeklyGoalsProgress.measurements.target)} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Fotos de Progresso</span>
                      <span className="font-medium">
                        {studentData.weeklyGoalsProgress.progressPhotos.completed}/{studentData.weeklyGoalsProgress.progressPhotos.target}
                      </span>
                    </div>
                    <Progress 
                      value={getProgressValue(studentData.weeklyGoalsProgress.progressPhotos.completed, studentData.weeklyGoalsProgress.progressPhotos.target)} 
                      className="h-2"
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">Nenhuma meta semanal definida.</p>
                  <p className="text-xs mt-1">Converse com seu personal para definir suas metas!</p>
                </div>
              )}

              <Button className="w-full gradient-primary text-white">
                <Trophy className="mr-2 h-4 w-4" />
                Ver Todas as Metas
              </Button>
            </CardContent>
          </Card>

          {/* Today's Workout - Real */}
          <Card className="shadow-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Treino de Hoje
              </CardTitle>
              <CardDescription>
                Seu treino programado para hoje (dados reais)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {todaysWorkout ? (
                <div className="p-4 bg-accent/50 rounded-lg">
                  <h4 className="font-semibold mb-2">{todaysWorkout.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {todaysWorkout.description} | Duração: {todaysWorkout.estimated_duration} min
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    {todaysWorkout.exercises?.slice(0, 3).map((ex: any) => (
                      <div key={ex.id} className="flex justify-between">
                        <span>{ex.name}</span>
                        <span className="text-muted-foreground">
                          {ex.sets}x{ex.reps}
                        </span>
                      </div>
                    ))}
                    {todaysWorkout.exercises?.length > 3 && (
                      <div className="text-center text-muted-foreground">+ {todaysWorkout.exercises.length - 3} exercícios</div>
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

        {/* New Row for Charts, Nutrition, Challenges */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Student Progress Charts */}
          <StudentProgressCharts evaluations={allEvaluations} loading={loadingEvaluations} />

          <div className="space-y-6">
            {/* Student Nutrition Overview */}
            <StudentNutritionCard studentId={student.id} />

            {/* Student Challenges Overview */}
            <StudentChallengesCard studentId={student.id} />
          </div>
        </div>

        {/* Body Composition - Real data from hook */}
        <Card className="shadow-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" /> {/* Changed icon to CalendarDays */}
              Composição Corporal
            </CardTitle>
            <CardDescription>
              Baseado nas últimas medidas reais
            </CardDescription>
          </CardHeader>
          <CardContent>
            {studentData.latestMeasurements.weight ? (
              <BodyCompositionCalculator
                data={{
                  weight: studentData.latestMeasurements.weight || 0,
                  height: student.height || 175, // Use student's height if available, fallback to 175
                  age: student.age || 28, // Use student's age if available, fallback to 28
                  gender: (student.gender as 'male' | 'female') || 'male', // Use student's gender, fallback to male
                  waist: studentData.latestMeasurements.waist || 0,
                  neck: studentData.latestMeasurements.neck || 0, // Usar neck real
                  hip: student.gender === 'feminino' ? studentData.latestMeasurements.hip || 0 : undefined, // Usar hip real
                }}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Sem medidas recentes</p>
                <p className="text-sm mt-1">Agende uma avaliação com seu trainer para ver sua composição corporal</p>
                <Button className="mt-4 gradient-primary" onClick={() => studentConversationId && navigate(`/chat/${studentConversationId}`)}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Agendar com Trainer
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
                {allWorkouts.map((workout: RpcWorkoutOutput, _index: number) => ( // Usar RpcWorkoutOutput aqui
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
              Chat com Trainer
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
    </div>
  );
};

export default StudentPortalDashboardContent;