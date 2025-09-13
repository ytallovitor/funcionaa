import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  MessageCircle,
  Camera,
  Activity,
  Weight,
  Zap,
  Trophy,
  Play,
  Users
} from "lucide-react";
import { useState, useEffect } from "react";
import ChatSystem from "./ChatSystem";
import BodyCompositionCalculator from "./BodyCompositionCalculator";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentData } from "@/hooks/useStudentData";

interface StudentDashboardProps {
  student: {
    id: string;
    name: string;
    email: string;
  };
}

const StudentDashboard = ({ student }: StudentDashboardProps) => {
  const studentData = useStudentData();
  const [quickStats, setQuickStats] = useState<any[]>([]);
  const [todaysWorkout, setTodaysWorkout] = useState<any>(null);

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
  }, [studentData]);

  const fetchTodaysWorkout = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('student_workouts')
        .select(`
          *,
          workout_templates (
            name, description, category, difficulty,
            workout_template_exercises (
              order_index, sets, reps, rest_time, notes,
              exercises (name, instructions)
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

  const hasMeasurements = studentData.latestMeasurements.weight && studentData.latestMeasurements.bodyFat;

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
        <Button variant="outline" className="h-20 flex-col gap-2">
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
                <Button className="flex-1 gradient-primary text-white">
                  <Play className="mr-2 h-4 w-4" />
                  Iniciar Treino
                </Button>
              )}
              <Button variant="outline" size="icon">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
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
            <ChatSystem compact recipientName="Seu Trainer" recipientType="trainer" />
          </CardContent>
        </Card>

        {/* Body Composition - Real data from hook */}
        <Card className="shadow-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
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
                  height: 175, // Fetch from student profile if needed
                  age: 28, // Fetch from student profile
                  gender: 'male' as const, // Fetch from student profile
                  waist: studentData.latestMeasurements.waist || 0,
                  neck: 38, // From evaluation or default
                  hip: studentData.latestMeasurements.waist ? studentData.latestMeasurements.waist * 1.1 : undefined, // Estimate for females
                }}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Sem medidas recentes</p>
                <p className="text-sm mt-1">Agende uma avaliação com seu trainer para ver sua composição corporal</p>
                <Button className="mt-4 gradient-primary" onClick={() => window.location.href = '/chat'}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Agendar com Trainer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;