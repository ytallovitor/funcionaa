import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  MessageCircle,
  Plus,
  Activity,
  Target,
  Clock,
  AlertCircle,
  CheckCircle,
  BarChart3
} from "lucide-react";
import { useState } from "react";

interface TrainerDashboardProps {
  trainer: {
    id: string;
    name: string;
    email: string;
  };
}

const TrainerDashboard = ({ trainer }: TrainerDashboardProps) => {
  const [studentsOverview] = useState({
    total: 32,
    active: 28,
    needsEvaluation: 8,
    newThisWeek: 3
  });

  const [recentStudents] = useState([
    {
      id: "1",
      name: "Ana Silva",
      lastEvaluation: "2024-01-10",
      progress: "excellent",
      needsAttention: false,
      bodyFat: 22.5,
      change: -2.1
    },
    {
      id: "2", 
      name: "Carlos Santos",
      lastEvaluation: "2024-01-08",
      progress: "good",
      needsAttention: false,
      bodyFat: 18.3,
      change: -1.8
    },
    {
      id: "3",
      name: "Maria Oliveira", 
      lastEvaluation: "2023-12-15",
      progress: "attention",
      needsAttention: true,
      bodyFat: 28.7,
      change: 0.5
    },
    {
      id: "4",
      name: "João Pedro",
      lastEvaluation: "2024-01-12",
      progress: "excellent",
      needsAttention: false,
      bodyFat: 15.2,
      change: -3.2
    }
  ]);

  const stats = [
    {
      title: "Total de Alunos",
      value: studentsOverview.total,
      change: `+${studentsOverview.newThisWeek} esta semana`,
      positive: true,
      icon: Users
    },
    {
      title: "Alunos Ativos",
      value: studentsOverview.active,
      change: `${Math.round((studentsOverview.active / studentsOverview.total) * 100)}% engajamento`,
      positive: true,
      icon: Activity
    },
    {
      title: "Pendentes Avaliação",
      value: studentsOverview.needsEvaluation,
      change: "Necessitam atenção",
      positive: false,
      icon: AlertCircle
    },
    {
      title: "Taxa de Sucesso",
      value: "87%",
      change: "+5% vs. mês anterior",
      positive: true,
      icon: Target
    }
  ];

  const getProgressColor = (progress: string) => {
    switch (progress) {
      case "excellent": return "bg-green-100 text-green-700";
      case "good": return "bg-blue-100 text-blue-700";
      case "attention": return "bg-orange-100 text-orange-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getProgressText = (progress: string) => {
    switch (progress) {
      case "excellent": return "Excelente";
      case "good": return "Bom";
      case "attention": return "Atenção";
      default: return "Normal";
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gradient">
            Bem-vindo, {trainer.name}! 💪
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus alunos e acompanhe o progresso de todos
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="gradient-primary text-white">
            <Plus className="mr-2 h-4 w-4" />
            Novo Aluno
          </Button>
          <Button variant="outline">
            <MessageCircle className="mr-2 h-4 w-4" />
            Mensagens
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Students - Takes 2 columns */}
        <Card className="lg:col-span-2 shadow-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Alunos Recentes
            </CardTitle>
            <CardDescription>
              Acompanhe o progresso dos seus alunos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="gradient-primary text-white">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Última avaliação: {new Date(student.lastEvaluation).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {student.bodyFat}% gordura
                      </p>
                      <p className={`text-xs ${student.change < 0 ? 'text-green-600' : 'text-orange-600'}`}>
                        {student.change > 0 ? '+' : ''}{student.change}%
                      </p>
                    </div>
                    
                    <Badge className={getProgressColor(student.progress)}>
                      {getProgressText(student.progress)}
                    </Badge>
                    
                    {student.needsAttention && (
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                    )}
                  </div>
                </div>
              ))}
              
              <Button variant="outline" className="w-full">
                Ver Todos os Alunos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>
              Tarefas importantes do dia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              Agendar Avaliações
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <MessageCircle className="mr-2 h-4 w-4" />
              Enviar Motivação
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="mr-2 h-4 w-4" />
              Relatório Semanal
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <TrendingUp className="mr-2 h-4 w-4" />
              Análise de Progresso
            </Button>
            
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Lembretes</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 text-orange-500" />
                  <span>8 alunos precisam de avaliação</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>3 novos treinos para criar</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card className="shadow-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Visão Geral de Performance
          </CardTitle>
          <CardDescription>
            Estatísticas dos seus alunos nos últimos 30 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">-2.8%</div>
              <p className="text-sm text-muted-foreground">Perda média de gordura</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">+1.5kg</div>
              <p className="text-sm text-muted-foreground">Ganho médio massa magra</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">94%</div>
              <p className="text-sm text-muted-foreground">Taxa de adesão treinos</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">4.8/5</div>
              <p className="text-sm text-muted-foreground">Satisfação média</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainerDashboard;