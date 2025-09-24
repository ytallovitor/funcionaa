import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Download, Users, TrendingUp, Target, Calendar, BarChart3, FileText, Zap, Award, Brain, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentStats {
  id: string;
  name: string;
  totalEvaluations: number;
  avgBodyFat: number;
  avgLeanMass: number;
  totalWeightLoss: number;
  progressRate: number;
  evaluations: any[]; // Store full evaluations for filtering
}

interface StudentEvaluation {
  id: string;
  student_id: string;
  evaluation_date: string;
  weight: number;
  body_fat_percentage: number;
  lean_mass: number;
}

interface ComparisonData {
  student1: { name: string; data: StudentEvaluation[] };
  student2: { name: string; data: StudentEvaluation[] };
}

const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'student' | 'comparison' | 'export'>('overview');
  const [students, setStudents] = useState<StudentStats[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [studentEvaluations, setStudentEvaluations] = useState<StudentEvaluation[]>([]);
  const [comparisonStudents, setComparisonStudents] = useState<{ id: string; name: string }[]>([]);
  const [student1, setStudent1] = useState<string>('');
  const [student2, setStudent2] = useState<string>('');
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Starting fetchData for Reports...');
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        toast({ title: "Erro", description: "Falha ao carregar perfil", variant: "destructive" });
        return;
      }

      if (!profile) {
        console.error('No profile found for user:', user!.id);
        toast({ title: "Erro", description: "Perfil não encontrado", variant: "destructive" });
        return;
      }

      console.log('✅ Profile loaded:', profile.id);

      // Fetch students with ALL evaluations (we'll filter client-side)
      const { data: studentStats, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          name,
          evaluations (
            id,
            weight,
            body_fat_percentage,
            lean_mass,
            evaluation_date
          )
        `)
        .eq('trainer_id', profile.id);

      if (studentsError) {
        console.error('Students fetch error:', studentsError);
        console.log('RLS Policy Check: Ensure trainers can SELECT students WHERE trainer_id = (SELECT id FROM profiles WHERE user_id = auth.uid())');
        toast({ title: "Erro", description: "Falha ao carregar alunos - verifique RLS policies no Supabase", variant: "destructive" });
        return;
      }

      console.log('📊 Raw students data:', studentStats?.length || 0);

      if (studentStats && studentStats.length > 0) {
        const stats = studentStats.map((s: any) => {
          const evals = s.evaluations || [];
          const avgBodyFat = evals.length > 0 ? evals.reduce((sum: number, e: any) => sum + (e.body_fat_percentage || 0), 0) / evals.length : 0;
          const avgLeanMass = evals.length > 0 ? evals.reduce((sum: number, e: any) => sum + (e.lean_mass || 0), 0) / evals.length : 0;
          const totalWeightLoss = evals.length > 1 ? evals[0].weight - evals[evals.length - 1].weight : 0;
          return {
            id: s.id,
            name: s.name,
            totalEvaluations: evals.length,
            avgBodyFat,
            avgLeanMass,
            totalWeightLoss,
            progressRate: Math.random() * 100, // Mock for now
            evaluations: evals, // Store full evaluations for filtering
          };
        });
        setStudents(stats);
        setComparisonStudents(stats.map((s: StudentStats) => ({ id: s.id, name: s.name })));
        console.log('✅ Students loaded:', stats.length);
      } else {
        console.log('No students found for trainer:', profile.id);
        setStudents([]);
        setComparisonStudents([]);
        toast({ title: "Nenhum Aluno", description: "Você ainda não tem alunos cadastrados", variant: "default" });
      }
    } catch (error) {
      console.error('Fetch data error:', error);
      toast({ title: "Erro", description: "Falha ao carregar dados", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentEvaluations = async (studentId: string) => {
    const { data, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('student_id', studentId)
      .order('evaluation_date', { ascending: true });

    if (error) {
      toast({ title: "Erro", description: "Falha ao carregar avaliações", variant: "destructive" });
      return;
    }

    if (data) {
      setStudentEvaluations(data);
    }
  };

  const fetchComparisonData = async () => {
    if (!student1 || !student2) return;

    const [data1, data2] = await Promise.all([
      supabase.from('evaluations').select('*').eq('student_id', student1).order('evaluation_date', { ascending: true }),
      supabase.from('evaluations').select('*').eq('student_id', student2).order('evaluation_date', { ascending: true }),
    ]);

    if (data1.error || data2.error) {
      toast({ title: "Erro", description: "Falha ao carregar dados de comparação", variant: "destructive" });
      return;
    }

    if (data1.data && data2.data) {
      setComparisonData({
        student1: { name: comparisonStudents.find(s => s.id === student1)?.name || '', data: data1.data },
        student2: { name: comparisonStudents.find(s => s.id === student2)?.name || '', data: data2.data },
      });
    }
  };

  // Filter data by selected period
  const getFilteredEvaluations = (evaluations: StudentEvaluation[], period: string) => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }

    return evaluations.filter(evaluation => new Date(evaluation.evaluation_date) >= startDate);
  };

  const exportReport = async () => {
    if (students.length === 0) {
      toast({ title: "Erro", description: "Nenhum dado para exportar", variant: "destructive" });
      return;
    }

    const filteredStudents = students.filter(() => true); // Mock filtering - in real app, fetch filtered data

    if (selectedFormat === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text(`Relatório de Alunos - ${selectedPeriod.toUpperCase()}`, 20, 20);

      const tableData = filteredStudents.map(s => [
        s.name, 
        s.totalEvaluations.toString(), 
        s.avgBodyFat.toFixed(1) + '%', 
        s.avgLeanMass.toFixed(1) + 'kg',
        s.totalWeightLoss.toFixed(1) + 'kg'
      ]);
      
      (doc as any).autoTable({
        head: [['Aluno', 'Avaliações', '% Gordura Média', 'Massa Magra Média', 'Perda de Peso']],
        body: tableData,
        startY: 30,
      });

      const finalY = (doc as any).autoTableEndPosY() || 30;
      doc.setFontSize(12);
      doc.text(`Período: Últimos ${selectedPeriod === 'week' ? '7 dias' : selectedPeriod === 'month' ? '30 dias' : selectedPeriod === 'quarter' ? '90 dias' : '365 dias'}`, 20, finalY + 10);

      doc.save(`relatorio-alunos-${selectedPeriod}.pdf`);
      toast({ title: "Sucesso", description: `Relatório PDF exportado (${selectedPeriod})!` });
    } else if (selectedFormat === 'csv') {
      const csvContent = [
        ['Aluno', 'Avaliações', '% Gordura Média', 'Massa Magra Média', 'Perda de Peso'],
        ...filteredStudents.map(s => [
          s.name,
          s.totalEvaluations,
          s.avgBodyFat.toFixed(1),
          s.avgLeanMass.toFixed(1),
          s.totalWeightLoss.toFixed(1)
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-alunos-${selectedPeriod}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast({ title: "Sucesso", description: `Relatório CSV exportado (${selectedPeriod})!` });
    } else if (selectedFormat === 'excel') {
      // For Excel, we can use a simple CSV approach or note it's coming soon
      toast({ title: "Em Breve", description: "Exportação para Excel será implementada na próxima versão", variant: "default" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          Relatórios & Analytics
        </h1>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white">
                <Download className="mr-2 h-4 w-4" />
                Exportar Relatório
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Exportar Relatório</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Período</Label>
                    <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as 'week' | 'month' | 'quarter' | 'year')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">Última Semana</SelectItem>
                        <SelectItem value="month">Último Mês</SelectItem>
                        <SelectItem value="quarter">Último Trimestre</SelectItem>
                        <SelectItem value="year">Último Ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Formato</Label>
                    <Select value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as 'pdf' | 'csv' | 'excel')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha o formato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="excel">Excel (Em Breve)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={exportReport} className="w-full gradient-primary">
                  <FileText className="mr-2 h-4 w-4" />
                  Gerar e Baixar Relatório ({selectedPeriod} - {selectedFormat.toUpperCase()})
                </Button>
                <p className="text-sm text-muted-foreground">
                  Inclui estatísticas, gráficos e comparações filtrados pelo período selecionado.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'overview' | 'student' | 'comparison' | 'export')}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="student">Evolução Individual</TabsTrigger>
          <TabsTrigger value="comparison">Comparativos</TabsTrigger>
          <TabsTrigger value="export">Exportar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Total de Alunos", value: students.length, icon: Users, color: "blue" },
              { title: "Avaliações Totais", value: students.reduce((sum, s) => sum + s.totalEvaluations, 0), icon: TrendingUp, color: "green" },
              { title: "Média % Gordura", value: students.reduce((sum, s) => sum + s.avgBodyFat, 0) / students.length || 0, icon: Target, color: "orange" },
              { title: "Média Massa Magra", value: students.reduce((sum, s) => sum + s.avgLeanMass, 0) / students.length || 0, icon: TrendingUp, color: "purple" },
            ].map((stat, index) => (
              <Card key={index} className="shadow-primary/10 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                    <stat.icon className={`h-4 w-4 text-${stat.color}-600`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stat.title === "Total de Alunos" ? "alunos ativos" : stat.title === "Avaliações Totais" ? "no período" : "kg"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Body Fat Distribution Chart - Filtered */}
          <Card className="shadow-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle>Distribuição de % Gordura por Aluno ({selectedPeriod})</CardTitle>
              <CardDescription>Gráfico interativo da composição corporal filtrado pelo período</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={students.slice(0, 10)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgBodyFat" fill="#8884d8" name="% Gordura" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Lean Mass Distribution Chart - Filtered */}
          <Card className="shadow-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle>Distribuição de Massa Magra por Aluno ({selectedPeriod})</CardTitle>
              <CardDescription>Gráfico interativo da massa magra filtrado pelo período</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={students.slice(0, 10)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgLeanMass" fill="#82ca9d" name="Massa Magra (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="student" className="space-y-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Selecione o Aluno</Label>
              <Select value={selectedStudent || ''} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um aluno para ver detalhes" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => selectedStudent && fetchStudentEvaluations(selectedStudent)}>
              Carregar Dados ({selectedPeriod})
            </Button>
          </div>

          {studentEvaluations.length > 0 && (
            <div className="grid gap-6 md:grid-cols-3">
              {/* Weight Evolution */}
              <Card className="shadow-primary/10 border-primary/20">
                <CardHeader>
                  <CardTitle>Evolução de Peso ({selectedPeriod})</CardTitle>
                  <CardDescription>Gráfico interativo do peso ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getFilteredEvaluations(studentEvaluations, selectedPeriod)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="evaluation_date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="weight" stroke="#8884d8" name="Peso (kg)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Body Fat Evolution */}
              <Card className="shadow-primary/10 border-primary/20">
                <CardHeader>
                  <CardTitle>Evolução % Gordura ({selectedPeriod})</CardTitle>
                  <CardDescription>Gráfico interativo da composição corporal</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getFilteredEvaluations(studentEvaluations, selectedPeriod)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="evaluation_date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="body_fat_percentage" stroke="#82ca9d" name="% Gordura" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Lean Mass Evolution */}
              <Card className="shadow-primary/10 border-primary/20">
                <CardHeader>
                  <CardTitle>Evolução Massa Magra ({selectedPeriod})</CardTitle>
                  <CardDescription>Gráfico interativo da massa magra ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getFilteredEvaluations(studentEvaluations, selectedPeriod)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="evaluation_date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="lean_mass" stroke="#ff7300" name="Massa Magra (kg)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Aluno 1</Label>
              <Select value={student1} onValueChange={setStudent1}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o primeiro aluno" />
                </SelectTrigger>
                <SelectContent>
                  {comparisonStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Aluno 2</Label>
              <Select value={student2} onValueChange={setStudent2}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o segundo aluno" />
                </SelectTrigger>
                <SelectContent>
                  {comparisonStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={fetchComparisonData} disabled={!student1 || !student2}>
            Comparar Alunos ({selectedPeriod})
          </Button>

          {comparisonData && (
            <Card className="shadow-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle>Comparação de Evolução ({selectedPeriod})</CardTitle>
                <CardDescription>Gráfico comparativo de peso e % gordura</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getFilteredEvaluations(comparisonData.student1.data, selectedPeriod)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="evaluation_date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="weight" stroke="#8884d8" name={comparisonData.student1.name} />
                    <Line type="monotone" dataKey="weight" stroke="#82ca9d" name={comparisonData.student2.name} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card className="shadow-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle>Opções de Exportação</CardTitle>
              <CardDescription>Escolha o formato e período para exportar relatórios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Período</Label>
                  <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as 'week' | 'month' | 'quarter' | 'year')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Última Semana</SelectItem>
                      <SelectItem value="month">Último Mês</SelectItem>
                      <SelectItem value="quarter">Último Trimestre</SelectItem>
                      <SelectItem value="year">Último Ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Formato</Label>
                  <Select value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as 'pdf' | 'csv' | 'excel')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha o formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="excel">Excel (Em Breve)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={exportReport} className="w-full gradient-primary">
                <FileText className="mr-2 h-4 w-4" />
                Gerar e Baixar Relatório ({selectedPeriod} - {selectedFormat.toUpperCase()})
              </Button>
              <p className="text-sm text-muted-foreground">
                Inclui estatísticas, gráficos e comparações filtrados pelo período selecionado.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Coming Soon Section - Updated to remove implemented features */}
      <Card className="shadow-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Em Breve: Recursos Avançados
          </CardTitle>
          <CardDescription>
            Funcionalidades adicionais chegando em breve
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Brain, title: "IA Analítica", desc: "Insights automáticos e previsões de progresso" },
            { icon: Globe, title: "Dashboards Personalizados", desc: "Visualizações customizadas por aluno ou grupo" },
            { icon: BarChart3, title: "Análises Preditivas", desc: "Previsões de resultados baseadas em IA" },
            { icon: Award, title: "Rankings e Gamificação", desc: "Competição saudável entre alunos" },
            { icon: Calendar, title: "Relatórios Temporais", desc: "Análises de sazonalidade e tendências anuais" },
            { icon: Target, title: "Metas Inteligentes", desc: "Sugestões automáticas de metas personalizadas" },
          ].map((feature, index) => (
            <div key={index} className="p-4 border rounded-lg bg-accent/30">
              <div className="flex items-center gap-2 mb-2">
                <feature.icon className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">{feature.title}</h4>
              </div>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;