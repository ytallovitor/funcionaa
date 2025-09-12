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
  Play
} from "lucide-react";
import { useState, useEffect } from "react";
import ChatSystem from "./ChatSystem";
import BodyCompositionCalculator from "./BodyCompositionCalculator";

interface StudentDashboardProps {
  student: {
    id: string;
    name: string;
    email: string;
  };
}

const StudentDashboard = ({ student }: StudentDashboardProps) => {
  const [latestMeasurements, setLatestMeasurements] = useState({
    weight: 75.2,
    bodyFat: 18.5,
    leanMass: 61.3,
    tmb: 1650,
    waist: 85,
    date: new Date().toISOString()
  });

  const [weeklyGoals, setWeeklyGoals] = useState({
    workouts: { completed: 4, target: 5 },
    measurements: { completed: 2, target: 3 },
    progress: { completed: 1, target: 1 }
  });

  const quickStats = [
    {
      title: "Peso Atual",
      value: `${latestMeasurements.weight}kg`,
      change: "-2.1kg",
      positive: true,
      icon: Weight
    },
    {
      title: "% Gordura",
      value: `${latestMeasurements.bodyFat}%`,
      change: "-3.2%",
      positive: true,
      icon: Target
    },
    {
      title: "Massa Magra",
      value: `${latestMeasurements.leanMass}kg`,
      change: "+1.8kg",
      positive: true,
      icon: TrendingUp
    },
    {
      title: "TMB",
      value: `${latestMeasurements.tmb} kcal`,
      change: "+85 kcal",
      positive: true,
      icon: Zap
    }
  ];

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
              <div className="flex items-center gap-1 mt-1">
                <Badge 
                  variant={stat.positive ? "default" : "destructive"}
                  className={stat.positive ? "bg-green-100 text-green-700" : ""}
                >
                  {stat.change}
                </Badge>
                <span className="text-xs text-muted-foreground">vs. mês anterior</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Goals Progress */}
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
                <span className="font-medium">{weeklyGoals.workouts.completed}/{weeklyGoals.workouts.target}</span>
              </div>
              <Progress 
                value={(weeklyGoals.workouts.completed / weeklyGoals.workouts.target) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Medidas Registradas</span>
                <span className="font-medium">{weeklyGoals.measurements.completed}/{weeklyGoals.measurements.target}</span>
              </div>
              <Progress 
                value={(weeklyGoals.measurements.completed / weeklyGoals.measurements.target) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Fotos de Progresso</span>
                <span className="font-medium">{weeklyGoals.progress.completed}/{weeklyGoals.progress.target}</span>
              </div>
              <Progress 
                value={(weeklyGoals.progress.completed / weeklyGoals.progress.target) * 100} 
                className="h-2"
              />
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
            <div className="p-4 bg-accent/50 rounded-lg">
              <h4 className="font-semibold mb-2">Treino de Peito e Tríceps</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Foco em hipertrofia | Duração: 45-60 min
              </p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Supino Reto</span>
                  <span className="text-muted-foreground">4x8-12</span>
                </div>
                <div className="flex justify-between">
                  <span>Supino Inclinado</span>
                  <span className="text-muted-foreground">3x10-15</span>
                </div>
                <div className="flex justify-between">
                  <span>Crucifixo</span>
                  <span className="text-muted-foreground">3x12-15</span>
                </div>
                <div className="text-center text-muted-foreground">+ 4 exercícios</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button className="flex-1 gradient-primary text-white">
                <Play className="mr-2 h-4 w-4" />
                Iniciar Treino
              </Button>
              <Button variant="outline" size="icon">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
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
            <ChatSystem compact />
          </CardContent>
        </Card>

        {/* Body Composition */}
        <Card className="shadow-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Composição Corporal
            </CardTitle>
            <CardDescription>
              Baseado nas últimas medidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BodyCompositionCalculator
              data={{
                weight: latestMeasurements.weight,
                height: 175, // Would come from student profile
                age: 28, // Would come from student profile
                gender: 'male', // Would come from student profile
                waist: latestMeasurements.waist,
                neck: 38, // Would come from measurements
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;