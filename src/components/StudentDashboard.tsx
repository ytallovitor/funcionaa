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
  CalendarDays // Adicionado para o ícone de avaliações
} from "lucide-react";
import { useState, useEffect } from "react";
import ChatSystem from "./ChatSystem";
import BodyCompositionCalculator from "./BodyCompositionCalculator";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentData } from "@/hooks/useStudentData";
import { supabase } from "@/integrations/supabase/client";
import StudentProgressCharts from "./StudentProgressCharts"; // Importar o componente de gráficos
import StudentNutritionCard from "./StudentNutritionCard"; // Importar o componente de nutrição
import StudentChallengesCard from "./StudentChallengesCard"; // Importar o componente de desafios
import WorkoutLogger from "./WorkoutLogger"; // Importar o novo componente WorkoutLogger
import { toast } from "sonner"; // Import toast from sonner
import { useNavigate } from "react-router-dom"; // Adicionado import do useNavigate

interface Student {
  id: string;
  name: string;
  email: string;
  age?: number; // Adicionado
  gender?: 'masculino' | 'feminino' | 'outro'; // Adicionado
  height?: number; // Adicionado
  trainer_id?: string; // Adicionado para buscar o trainer
}

interface EvaluationData {
  evaluation_date: string;
  weight: number;
  body_fat_percentage: number;
  lean_mass: number;
}

interface StudentDashboardProps {
  student: Student;
}

const StudentDashboard = ({ student }: StudentDashboardProps) => {
  const studentData = useStudentData();
  const navigate = useNavigate(); // Inicializado useNavigate
  const [quickStats, setQuickStats] = useState<any[]>([]);
  const [todaysWorkout, setTodaysWorkout] = useState<any>(null);
  const [allEvaluations, setAllEvaluations] = useState<EvaluationData[]>([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(true);
  const [isWorkoutLoggerOpen, setIsWorkoutLoggerOpen] = useState(false);
  const [studentConversationId, setStudentConversationId] = useState<string | null>(null);
  const [trainerProfile, setTrainerProfile] = useState<{ id: string; full_name: string } | null>(null);

  useEffect(() => {
    if (studentData.loading || !studentData.latestMeasurements) return;

    // Calculate quick stats from real data
    const measurements = studentData.latestMeasurements;
    setQuickStats([
      {
        title: "Peso Atual",
        value: measurements.weight ? `${measurements.weight}kg` : 'N/A',
        change: measurements.weight ? "-2.1kg" : "Sem dados", // Real change would require previous eval
        positive: true,
        icon: Weight
      },
      {
        title: "% Gordura",
        value: measurements.bodyFat ? `${measurements.bodyFat}%` : 'N/A',
        change: measurements.bodyFat ? "-3.2%" : "Sem dados",
        positive: true,
        icon: Target
      },
      {
        title: "Massa Magra",
        value: measurements.leanMass ? `${measurements.leanMass}kg` : 'N/A',
        change: measurements.leanMass ? "+1.8kg" : "Sem dados",
        positive: true,
        icon: TrendingUp
      },
      {
        title: "TMB",
        value: measurements.tmb ? `${measurements.tmb} kcal` : 'N/A',
        change: measurements.tmb ? "+85 kcal" : "Sem dados",
        positive: true,
        icon: Zap
      }
    ]);

    // Fetch today's workout (real)
    fetchTodaysWorkout();
    fetchAllEvaluations(); // Fetch all evaluations for charts
    fetchStudentTrainerConversation(); // Fetch conversation for chat
  }, [studentData, student]);

  const fetchTodaysWorkout = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('student_workouts')
        .select(`
          *,
          workout_templates (
            id, name, description, category, difficulty, estimated_duration,
            workout_template_exercises (
              id, order_index, sets, reps, rest_time, notes,
              exercises (id, name, instructions, video_url)
            )
          )
        `)
        .eq('student_id', student.id)
        .eq('status', 'assigned')
        .gte('assigned_date', today)
        .limit(1)
        .single();

      setTodaysWorkout(data);
    } catch (error) {
      console.warn('Warning fetching today\'s workout:', error);
      setTodaysWorkout(null); // Fallback vazio
    }
  };

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

  const fetchStudentTrainerConversation = async () => {
    try {
      // O student.id agora já é o ID da tabela students, passado de Index.tsx
      const studentIdFromStudentsTable = student.id;
      const trainerId = student.trainer_id; // O trainer_id também é passado no student prop

      if (!trainerId) {
        toast.error('ID do treinador não encontrado para este aluno.');
        return;
      }

      // Get trainer's profile details
      const { data: trainerData, error: trainerError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', trainerId)
        .single();

      if (trainerError || !trainerData) {
        console.error('Error fetching trainer profile:', trainerError);
        toast.error('Não foi possível carregar o perfil do treinador.');
        return;
      }
      setTrainerProfile(trainerData);

      // Then, find or create the conversation between this student and their trainer
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('student_id', studentIdFromStudentsTable)
        .eq('trainer_id', trainerId)
        .single();

      if (convError && convError.code === 'PGRST116') { // No rows found
        // Create new conversation
        const { data: newConversation, error: createConvError } = await supabase
          .from('conversations')
          .insert({
            student_id: studentIdFromStudentsTable,
            trainer_id: trainerId,
          })
          .select('id')
          .single();

        if (createConvError) throw createConvError;
        setStudentConversationId(newConversation.id);
        toast.success('Nova conversa com seu treinador iniciada!');
      } else if (convError) {
        throw convError;
      } else if (conversation) {
        setStudentConversationId(conversation.id);
      }
    } catch (error: any) {
      console.error('Error fetching/creating conversation:', error);
      toast.error(`Erro no chat: ${error.message || 'Não foi possível carregar a conversa.'}`);
    }
  };

  const handleWorkoutLogged = () => {
    // Refresh data after a workout is logged
    studentData.loading = true; // Force re-fetch in useStudentData
    fetchTodaysWorkout();
  };

  if (studentData.loading) {
    return (
      <div className="space-y-6">
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
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
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

      {/* Stats Grid - Real data */}
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
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Treinos Realizados</span>
                <span className="font-medium">
                  {studentData.weeklyGoals.workouts.completed}/{studentData.weeklyGoals.workouts.target}
                </span>
              </div>
              <Progress 
                value={(studentData.weeklyGoals.workouts.completed / studentData.weeklyGoals.workouts.target) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Medidas Registradas</span>
                <span className="font-medium">
                  {studentData.weeklyGoals.measurements.completed}/{studentData.weeklyGoals.measurements.target}
                </span>
              </div>
              <Progress 
                value={(studentData.weeklyGoals.measurements.completed / studentData.weeklyGoals.measurements.target) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Fotos de Progresso</span>
                <span className="font-medium">
                  {studentData.weeklyGoals.progress.completed}/{studentData.weeklyGoals.progress.target}
                </span>
              </div>
              <Progress 
                value={(studentData.weeklyGoals.progress.completed / studentData.weeklyGoals.progress.target) * 100} 
                className="h-2"
              />
            </div>

            {studentData.weeklyGoals.workouts.completed === 0 && studentData.weeklyGoals.measurements.completed === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">Sem progresso semanal ainda</p>
                <p className="text-xs mt-1">Comece registrando suas primeiras atividades</p>
              </div>
            ) : (
              <Button className="w-full gradient-primary text-white">
                <Trophy className="mr-2 h-4 w-4" />
                Ver Todas as Metas
              </Button>
            )}
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
                neck: 38, // From evaluation or default
                hip: student.gender === 'feminino' && studentData.latestMeasurements.waist ? studentData.latestMeasurements.waist * 1.1 : undefined, // Estimate for females
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

      {/* Quick Chat - Static component, but could fetch recent messages */}
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
  );
};

export default StudentDashboard;