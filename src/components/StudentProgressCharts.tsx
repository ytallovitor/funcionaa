import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Scale, Target, Activity } from 'lucide-react';

interface EvaluationData {
  evaluation_date: string;
  weight: number;
  body_fat_percentage: number;
  lean_mass: number;
}

interface StudentProgressChartsProps {
  evaluations: EvaluationData[];
  loading: boolean;
}

const StudentProgressCharts = ({ evaluations, loading }: StudentProgressChartsProps) => {
  if (loading) {
    return (
      <Card className="shadow-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle>Carregando Gráficos...</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <Activity className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!evaluations || evaluations.length === 0) {
    return (
      <Card className="shadow-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Gráficos de Progresso
          </CardTitle>
          <CardDescription>
            Acompanhe sua evolução visualmente
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Sem dados de avaliação para exibir</p>
          <p className="text-sm mt-1">Agende uma avaliação com seu personal trainer para começar a ver seu progresso aqui!</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for Recharts
  const chartData = evaluations
    .sort((a, b) => new Date(a.evaluation_date).getTime() - new Date(b.evaluation_date).getTime())
    .map(evalItem => ({
      date: new Date(evalItem.evaluation_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      Peso: evalItem.weight,
      '% Gordura': evalItem.body_fat_percentage,
      'Massa Magra': evalItem.lean_mass,
    }));

  return (
    <div className="space-y-6">
      <Card className="shadow-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Evolução do Peso
          </CardTitle>
          <CardDescription>
            Histórico do seu peso ao longo das avaliações
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" unit="kg" />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Line type="monotone" dataKey="Peso" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Evolução da Composição Corporal
          </CardTitle>
          <CardDescription>
            Histórico de % de gordura e massa magra
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" unit="%" />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" unit="kg" />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="% Gordura" stroke="hsl(var(--secondary-gradient))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line yAxisId="right" type="monotone" dataKey="Massa Magra" stroke="hsl(var(--primary-glow))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentProgressCharts;