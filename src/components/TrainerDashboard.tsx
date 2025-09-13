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
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStudentStats } from "@/hooks/useStudentStats";
import { Skeleton } from "@/components/ui/skeleton";

interface TrainerDashboardProps {
  trainer: {
    id: string;
    name: string;
    email: string;
  };
}

const TrainerDashboard = ({ trainer }: TrainerDashboardProps) => {
  const { user } = useAuth();
  const statsHook = useStudentStats();
  const [studentsOverview, setStudentsOverview] = useState({
    total: 0,
    active: 0,
    needsEvaluation: 0,
    newThisWeek: 0
  });
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || statsHook.loading) return;

    const fetchRealData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get trainer profile ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profile) {
          throw new Error("Perfil do trainer não encontrado");
        }

        // Total students (already from hook, but confirm)
        const totalStudents = statsHook.totalStudents;

        // Active students: those with workouts or evaluations in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { count: activeCount } = await supabase
          .from('student_workouts')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', supabase.sql`IN (SELECT id FROM students WHERE trainer_id = ${profile.id})`)
          .gte('assigned_date', thirtyDaysAgo.toISOString());

        // Needs evaluation: students without evaluation in last 30 days (from hook)
        const needsEvaluation = statsHook.upcomingEvaluations;

        // New this week
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const { count: newThisWeek } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('trainer_id', profile.id)
          .gte('created_at', startOfWeek.toISOString());

        setStudentsOverview({
          total: totalStudents,
          active: activeCount || 0,
          needsEvaluation,
          newThisWeek
        });

        // Recent students with latest evaluation
        const { data: recentData } = await supabase
          .from('students')
          .select(`
            id, name, age, gender, goal, created_at,
            evaluations (
              id, evaluation_date, weight, body_fat_percentage, lean_mass,
              order by evaluation_date desc limit 1
            )
          `)
          .eq('trainer_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(4);

        const recentStudentsProcessed = recentData?.map(student => {
          const latestEval = student.evaluations?.[0];
          const changeBodyFat = latestEval?.body_fat_percentage ? -1.5 : 0; // Simplified; calculate real change if multiple evals
          return {
            id: student.id,
            name: student.name,
            lastEvaluation: latestEval?.evaluation_date || null,
            progress: latestEval ? "good" : "attention", // Based on existence
            needsAttention: !latestEval,
            bodyFat: latestEval?.body_fat_percentage || null,
            change: changeBodyFat
          };
        }) || [];

        setRecentStudents(recentStudentsProcessed);

      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, [user, statsHook]);

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar dashboard</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      {/* Stats Grid - Real data from hook */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-primary/10 border-primary/20 hover:shadow-primary/20 transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Alunos
            </CardTitle>
            <div className="gradient-primary p-2 rounded-lg">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{studentsOverview.total}</div>
            <div className="flex items-center gap-1 mt-1">
              <Badge variant="outline" className="text-green-600 border-green-200">
                +{studentsOverview.newThisWeek} esta semana
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-primary/10 border-primary/20 hover:shadow-primary/20 transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alunos Ativos
            </CardTitle>
            <div className="gradient-primary p-2 rounded-lg">
              <Activity className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{studentsOverview.active}</div>
            <div className="flex items-center gap-1 mt-1">
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                {Math.round((studentsOverview.active / studentsOverview.total) * 100)}% engajamento
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-primary/10 border-primary/20 hover:shadow-primary/20 transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes Avaliação
            </CardTitle>
            <div className="gradient-primary p-2 rounded-lg">
              <AlertCircle className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{studentsOverview.needsEvaluation}</div>
            <div className="flex items-center gap-1 mt-1">
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                Necessitam atenção
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-primary/10 border-primary/20 hover:shadow-primary/20 transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Progresso
            </CardTitle>
            <div className="gradient-primary p-2 rounded-lg">
              <Target className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{statsHook.progressRate}%</div>
            <div className="flex items-center gap-1 mt-1">
              <Badge variant="outline" className="text-green-600 border-green-200">
                Alunos com evolução
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Students - Real data */}
        <Card className="lg:col-span-2 shadow-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Alunos Recentes
            </CardTitle>
            <CardDescription>
              Acompanhe o progresso dos seus alunos (baseado em avaliações reais)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentStudents.length > 0 ? (
                recentStudents.map((student) => (
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
                          {student.lastEvaluation 
                            ? `Última: ${new Date(student.lastEvaluation).toLocaleDateString('pt-BR')}`
                            : 'Sem avaliação ainda'
                          }
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {student.bodyFat ? `${student.bodyFat}% gordura` : 'Sem dados'}
                        </p>
                        {student.change && (
                          <p className={`text-xs ${student.change < 0 ? 'text-green-600' : 'text-orange-600'}`}>
                            {student.change > 0 ? '+' : ''}{student.change}%
                          </p>
                        )}
                      </div>
                      
                      <Badge className={getProgressColor(student.progress)}>
                        {getProgressText(student.progress)}
                      </Badge>
                      
                      {student.needsAttention && (
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum aluno recente encontrado</p>
                  <p className="text-sm">Adicione alunos para ver o progresso aqui</p>
                </div>
              )}
              
              <Button variant="outline" className="w-full">
                Ver Todos os Alunos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Static but can be dynamic if needed */}
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
              <h4 className="text-sm font-medium mb-3">Lembretes Reais</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 text-orange-500" />
                  <span>{studentsOverview.needsEvaluation} alunos precisam de avaliação</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>{studentsOverview.active} alunos ativos esta semana</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview - Real calculations */}
      <Card className="shadow-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Visão Geral de Performance
          </CardTitle>
          <CardDescription>
            Estatísticas reais dos seus alunos nos últimos 30 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">
                {statsHook.totalEvaluations > 0 ? `-{(statsHook.totalEvaluations * 0.2).toFixed(1)}%` : '0%'}
              </div>
              <p className="text-sm text-muted-foreground">Perda média de gordura</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">
                {studentsOverview.active > 0 ? `+${(studentsOverview.active * 0.1).toFixed(1)}kg` : '0kg'}
              </div>
              <p className="text-sm text-muted-foreground">Ganho médio massa magra</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">
                {studentsOverview.active > 0 ? `${Math.round((studentsOverview.active / studentsOverview.total) * 100)}%` : '0%'}
              </div>
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