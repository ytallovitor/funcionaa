import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Users, Target, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  goal_value: number;
  goal_unit: string;
  end_date: string;
}

interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  challenges: Challenge;
  current_progress: number;
  status: string;
}

interface StudentChallengesCardProps {
  studentId: string;
}

const StudentChallengesCard = ({ studentId }: StudentChallengesCardProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeChallenges, setActiveChallenges] = useState<ChallengeParticipant[]>([]);

  useEffect(() => {
    if (studentId) {
      fetchActiveChallenges();
    }
  }, [studentId]);

  const fetchActiveChallenges = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select(`
          *,
          challenges (*)
        `)
        .eq('student_id', studentId)
        .eq('status', 'active'); // Assuming 'active' status for ongoing challenges

      if (error) throw error;

      // Filter out challenges that have already ended
      const today = new Date();
      const filteredChallenges = data?.filter(cp => new Date(cp.challenges.end_date) >= today) || [];
      setActiveChallenges(filteredChallenges as ChallengeParticipant[]);

    } catch (error) {
      console.error('Error fetching student challenges:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os desafios.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (current: number, goal: number) => {
    if (goal === 0) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  if (loading) {
    return (
      <Card className="shadow-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle>Carregando Desafios...</CardTitle>
        </CardHeader>
        <CardContent className="h-40 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-primary/10 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Meus Desafios Ativos
        </CardTitle>
        <CardDescription>
          Acompanhe seu progresso nos desafios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeChallenges.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">Nenhum desafio ativo no momento.</p>
            <p className="text-xs mt-1">Converse com seu personal para participar de um!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeChallenges.map(cp => (
              <div key={cp.id} className="p-3 border rounded-lg bg-accent/50">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-sm">{cp.challenges.title}</h4>
                  <Badge variant="outline">{cp.challenges.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{cp.challenges.description}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progresso: {cp.current_progress} {cp.challenges.goal_unit}</span>
                    <span>Meta: {cp.challenges.goal_value} {cp.challenges.goal_unit}</span>
                  </div>
                  <Progress 
                    value={getProgressPercentage(cp.current_progress, cp.challenges.goal_value)} 
                    className="h-2"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Termina em: {new Date(cp.challenges.end_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentChallengesCard;