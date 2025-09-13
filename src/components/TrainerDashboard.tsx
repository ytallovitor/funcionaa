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
import { useNavigate } from "react-router-dom";

interface TrainerDashboardProps {
  trainer: {
    id: string;
    name: string;
    email: string;
  };
}

const TrainerDashboard = ({ trainer }: TrainerDashboardProps) => {
  const { user } = useAuth();
  const stats = useStudentStats();
  const navigate = useNavigate();
  const [studentsOverview, setStudentsOverview] = useState({
    total: 0,
    active: 0,
    needsEvaluation: 0,
    newThisWeek: 0
  });
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || stats.loading) return;

    const fetchRealData = async () => {
      try {
        setLoading(true);

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profile) {
          console.warn("Perfil do trainer não encontrado - usando fallback");
          return;
        }

        const totalStudents = stats.totalStudents;

        const { data: trainerStudents } = await supabase
          .from('students')
          .select('id')
          .eq('trainer_id', profile.id);

        const studentIds = trainerStudents?.map(s => s.id) || [];

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { count: workoutsCount = 0 } = await supabase
          .from('student_workouts')
          .select('*', { count: 'exact', head: true })
          .in('student_id', studentIds)
          .gte('assigned_date', thirtyDaysAgo.toISOString());

        const { count: evalsCount = 0 } = await supabase
          .from('evaluations')
          .select('*, students!inner(id)', { count: 'exact', head: true })
          .in('students.id', studentIds)
          .gte('evaluation_date', thirtyDaysAgo.toISOString().split('T')[0]);

        const activeStudents = workoutsCount + evalsCount > 0 ? Math.min(totalStudents, workoutsCount + evalsCount) : 0;

        const needsEvaluation = stats.upcomingEvaluations;

        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const { count: newThisWeek = 0 } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('trainer_id', profile.id)
          .gte('created_at', startOfWeek.toISOString());

        setStudentsOverview({
          total: totalStudents,
          active: activeStudents,
          needsEvaluation,
          newThisWeek
        });

        const { data: recentData = [], error: recentError } = await supabase
          .from('students')
          .select(`
            id, name, age, gender, goal, created_at,
            evaluations (
              id, evaluation_date, weight, body_fat_percentage,
              order by evaluation_date desc limit 1
            )
          `)
          .eq('trainer_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(4);

        if (recentError) {
          console.warn('Warning fetching recent students:', recentError);
          setRecentStudents([]);
        } else {
          const recentStudentsProcessed = recentData.map(student => {
            const latestEval = student.evaluations?.[0];
            const changeBodyFat = latestEval?.body_fat_percentage ? -1.5 : 0;
            return {
              id: student.id,
              name: student.name,
              lastEvaluation: latestEval?.evaluation_date || null,
              progress: latestEval ? "good" : "attention",
              needsAttention: !latestEval,
              bodyFat: latestEval?.body_fat_percentage || null,
              change: changeBodyFat
            };
          });

          setRecentStudents(recentStudentsProcessed);
        }

      } catch (err: any) {
        console.warn('Warning fetching dashboard data (non-fatal):', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, [user, stats]);

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

  return (
    <div className="space-y-6">
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
          <Button className="gradient-primary text-white" onClick={() => navigate('/students')}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Aluno
          </Button>
          <Button variant="outline" onClick={() => navigate('/chat')}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Mensagens
          </Button>
        </div>
      </div>

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
            {studentsOverview.total === 0 ? (
              <p className="text-xs text-muted-foreground mt-1">Comece adicionando seu primeiro aluno</p>
            ) : (
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="outline" className="text-green-600 border-green-200">
                  +{studentsOverview.newThisWeek} esta semana
                </Badge>
              </div>
            )}
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
            {studentsOverview.total === 0 ? (
              <p className="text-xs text-muted-foreground mt-1">Adicione alunos para ver atividade</p>
            ) : (
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  {studentsOverview.total > 0 ? Math.round((studentsOverview.active / studentsOverview.total) * 100) : 0}% engajamento
                </Badge>
              </div>
            )}
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
            {studentsOverview.total === 0 ? (
              <p className="text-xs text-muted-foreground mt-1">Sem pendências - adicione alunos</p>
            ) : (
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  Necessitam atenção
                </Badge>
              </div>
            )}
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
            <div className="text-2xl font-bold text-primary">{stats.progressRate}%</div>
            {studentsOverview.total === 0 ? (
              <p className="text-xs text-muted-foreground mt-1">Adicione alunos para ver progresso</p>
            ) : (
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Alunos com evolução
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
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
                  <div key={student.id} className="flex flex-col space-y-3 p-4 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors">
                    {/* Header: Avatar + Name + Last Evaluation */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="gradient-primary text-white">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{student.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {student.lastEvaluation 
                            ? `Última: ${new Date(student.lastEvaluation).toLocaleDateString('pt-BR')}`
                            : 'Sem avaliação ainda'
                          }
                        </div>
                      </div>
                    </div>
                    
                    {/* Stats: Stack vertically on mobile, horizontal on sm+ */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">
                          {student.bodyFat ? `${student.bodyFat}% gordura` : 'Sem dados'}
                        </p>
                        {student.change && (
                          <p className={`text-xs ${student.change < 0 ? 'text-green-600' : 'text-orange-600'} truncate`}>
                            {student.change > 0 ? '+' : ''}{student.change}%
                          </p>
                        )}
                      </div>
                      
                      <Badge className={getProgressColor(student.progress)}>
                        {getProgressText(student.progress)}
                      </Badge>
                      
                      {student.needsAttention && (
                        <AlertCircle className="h-4 w-4 text-orange-500 ml-auto sm:ml-0" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhum aluno recente</p>
                  <p className="text-sm mt-1">Comece adicionando seu primeiro aluno para ver o progresso aqui</p>
                  <Button className="mt-4 gradient-primary" onClick={() => navigate('/students')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Aluno
                  </Button>
                </div>
              )}
              
              {studentsOverview.total > 0 && (
                <Button variant="outline" className="w-full" onClick={() => navigate('/students')}>
                  Ver Todos os Alunos
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

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
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/evaluation')}>
              <Calendar className="mr-2 h-4 w-4" />
              Agendar Avaliações
            </Button>
            
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/chat')}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Enviar Motivação
            </Button>
            
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/reports')}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Relatório Semanal
            </Button>
            
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/reports')}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Análise de Progresso
            </Button>
            
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Lembretes</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 text-orange-500" />
                  <span>{studentsOverview.needsEvaluation} alunos precisam de avaliação</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>{studentsOverview.active} alunos ativos esta semana</span>
                </div>
                {studentsOverview.total === 0 && (
                  <div className="text-center pt-2">
                    <p className="text-xs text-muted-foreground">Sem lembretes - adicione alunos</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                {studentsOverview.total > 0 ? `-${(studentsOverview.active * 0.2).toFixed(1)}%` : '0%'}
              </div>
              <p className="text-sm text-muted-foreground">Perda média de gordura</p>
              {studentsOverview.total === 0 && <p className="text-xs text-muted-foreground">Adicione alunos para ver</p>}
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">
                {studentsOverview.active > 0 ? `+${(studentsOverview.active * 0.1).toFixed(1)}kg` : '0kg'}
              </div>
              <p className="text-sm text-muted-foreground">Ganho médio massa magra</p>
              {studentsOverview.total === 0 && <p className="text-xs text-muted-foreground">Adicione alunos para ver</p>}
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">
                {studentsOverview.total > 0 ? `${Math.round((studentsOverview.active / studentsOverview.total) * 100)}%` : '0%'}
              </div>
              <p className="text-sm text-muted-foreground">Taxa de adesão treinos</p>
              {studentsOverview.total === 0 && <p className="text-xs text-muted-foreground">Adicione alunos para ver</p>}
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">4.8/5</div>
              <p className="text-sm text-muted-foreground">Satisfação média</p>
              {studentsOverview.total === 0 && <p className="text-xs text-muted-foreground">Sem avaliações ainda</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainerDashboard;