import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  name: string;
  goal: string;
}

interface WorkoutSuggestionDialogProps {
  student: Student;
  onClose: () => void;
}

const WorkoutSuggestionDialog = ({ student, onClose }: WorkoutSuggestionDialogProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // Fallback exercises básicos se o DB estiver vazio
  const fallbackExercises = [
    {
      id: "fallback-1",
      name: "Agachamento Livre",
      category: "Força",
      muscle_groups: ["Quadríceps", "Glúteos", "Posterior"],
      difficulty: "Iniciante",
      equipment: ["Barra", "Anilhas"],
      instructions: [
        "Fique em pé com os pés na largura dos ombros",
        "Desça flexionando joelhos e quadris como se sentasse",
        "Mantenha o peito erguido e joelhos alinhados",
        "Volte à posição inicial empurrando com os calcanhares"
      ],
      tips: ["Mantenha as costas retas", "Não deixe os joelhos passarem das pontas dos pés"],
      duration: 0,
      reps: 12,
      sets: 3,
      rest_time: 90,
      video_url: "",
      image_url: ""
    },
    {
      id: "fallback-2",
      name: "Supino com Barra",
      category: "Força",
      muscle_groups: ["Peitoral", "Tríceps", "Ombros"],
      difficulty: "Iniciante",
      equipment: ["Banco", "Barra", "Anilhas"],
      instructions: [
        "Deite no banco com os pés apoiados no chão",
        "Segure a barra na largura dos ombros",
        "Desça a barra controladamente até o peito",
        "Empurre explosivamente de volta à posição inicial"
      ],
      tips: ["Mantenha os ombros afastados das orelhas", "Controle a descida para evitar lesões"],
      duration: 0,
      reps: 10,
      sets: 3,
      rest_time: 120,
      video_url: "",
      image_url: ""
    },
    {
      id: "fallback-3",
      name: "Remada Curvada",
      category: "Força",
      muscle_groups: ["Costas", "Bíceps", "Ombros"],
      difficulty: "Iniciante",
      equipment: ["Barra", "Anilhas"],
      instructions: [
        "Fique em pé com os pés na largura dos quadris",
        "Incline o tronco mantendo as costas retas",
        "Puxe a barra em direção ao abdômen",
        "Contraia as escápulas no topo do movimento"
      ],
      tips: ["Mantenha o core contraído", "Evite usar impulso das pernas"],
      duration: 0,
      reps: 12,
      sets: 3,
      rest_time: 90,
      video_url: "",
      image_url: ""
    },
    {
      id: "fallback-4",
      name: "Prancha",
      category: "Funcional",
      muscle_groups: ["Core", "Ombros", "Glúteos"],
      difficulty: "Iniciante",
      equipment: [],
      instructions: [
        "Apoie-se nos antebraços e ponta dos pés",
        "Mantenha o corpo em linha reta",
        "Contraia o abdômen e glúteos",
        "Segure a posição respirando normalmente"
      ],
      tips: ["Não deixe os quadris caírem", "Olhe para o chão para manter a coluna neutra"],
      duration: 30,
      reps: 0,
      sets: 3,
      rest_time: 60,
      video_url: "",
      image_url: ""
    },
    {
      id: "fallback-5",
      name: "Flexão de Braço",
      category: "Força",
      muscle_groups: ["Peitoral", "Tríceps", "Ombros"],
      difficulty: "Iniciante",
      equipment: [],
      instructions: [
        "Apoie as mãos no chão na largura dos ombros",
        "Desça o peito em direção ao chão",
        "Mantenha o corpo reto como uma prancha",
        "Empurre de volta à posição inicial"
      ],
      tips: ["Se difícil, faça com joelhos no chão", "Controle a descida para 2-3 segundos"],
      duration: 0,
      reps: 10,
      sets: 3,
      rest_time: 60,
      video_url: "",
      image_url: ""
    },
    {
      id: "fallback-6",
      name: "Elevação de Panturrilha",
      category: "Força",
      muscle_groups: ["Panturrilhas"],
      difficulty: "Iniciante",
      equipment: [],
      instructions: [
        "Fique em pé com os pés paralelos",
        "Eleve os calcanhares o mais alto possível",
        "Contraia as panturrilhas no topo",
        "Desça controladamente"
      ],
      tips: ["Faça devagar para maior ativação", "Use uma parede para equilíbrio se necessário"],
      duration: 0,
      reps: 15,
      sets: 3,
      rest_time: 45,
      video_url: "",
      image_url: ""
    }
  ];

  const generateWorkout = async () => {
    setIsGenerating(true);
    try {
      // 1. Fetch Anamnesis data
      const { data: anamnesis } = await supabase
        .from('anamnesis')
        .select('training_experience')
        .eq('student_id', student.id)
        .single();

      const experience = anamnesis?.training_experience || 'iniciante';
      
      // 2. Define workout parameters based on goal and experience
      let category = 'Força';
      let difficulty = 'Iniciante';
      let repRange = '8-12';
      let sets = 3;

      if (experience === 'intermediario') {
        difficulty = 'Intermediário';
        sets = 4;
      } else if (experience === 'avancado') {
        difficulty = 'Avançado';
        sets = 4;
      }

      if (student.goal === 'perder_gordura') {
        repRange = '12-15';
        category = 'Funcional'; // Mix of strength and cardio
      }

      // 3. Fetch exercises based on parameters - TENTATIVA 1: Específica
      let exercises = await supabase
        .from('exercises')
        .select('*')
        .eq('category', category)
        .eq('difficulty', difficulty)
        .limit(6)
        .then(({ data, error }) => {
          if (error) console.warn('Erro na query específica:', error);
          return data || [];
        });

      // Se não encontrou, TENTATIVA 2: Mais ampla (sem filtros, pega os primeiros 6)
      if (exercises.length === 0) {
        exercises = await supabase
          .from('exercises')
          .select('*')
          .limit(6)
          .then(({ data, error }) => {
            if (error) console.warn('Erro na query ampla:', error);
            return data || [];
          });
      }

      // Se ainda não encontrou, usa FALLBACK (exercícios básicos pré-definidos)
      if (exercises.length === 0) {
        console.warn('Nenhum exercício encontrado no DB - usando fallback');
        exercises = fallbackExercises.slice(0, 6); // Pega os primeiros 6 do fallback
        toast({
          title: "Usando exercícios básicos",
          description: "Adicione mais exercícios na biblioteca para sugestões personalizadas! 📚",
        });
      }

      // 4. Build the suggested workout object
      const suggestedWorkout = {
        name: `Sugestão para ${student.name} - ${student.goal.replace('_', ' ')}`,
        description: `Treino gerado por IA com base no objetivo de ${student.goal} e experiência ${experience}. ${exercises.length < 6 ? 'Usando exercícios básicos disponíveis.' : ''}`,
        category: category,
        difficulty: difficulty,
        exercises: exercises.map((ex, index) => ({
          exercise: ex,
          sets: sets,
          reps: parseInt(repRange.split('-')[1]) || 12, // Use the upper end of the range
          rest_time: 60,
          notes: `Exercício ${index + 1} - Foque na forma correta.`
        }))
      };

      // 5. Navigate to workout creator with the suggestion
      navigate('/workouts', { 
        state: { 
          suggestedWorkout,
          fromSuggestion: true // Flag para indicar que veio da IA
        } 
      });

      toast({
        title: "Sugestão Gerada!",
        description: `Treino criado com ${exercises.length} exercícios. Edite no criador!`,
      });

    } catch (error: any) {
      console.error("Error generating workout:", error);
      toast({
        title: "Erro na Geração",
        description: "Não foi possível gerar a sugestão. Tente novamente ou crie manualmente no menu Treinos.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-primary" />
            Sugestão de Treino com IA
          </DialogTitle>
          <DialogDescription>
            Avaliação salva com sucesso! Deseja que nossa IA crie uma sugestão de treino para {student.name} com base nos novos dados?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-sm text-muted-foreground">
          <p>A IA irá considerar:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>O objetivo principal do aluno: <strong>{student.goal.replace('_', ' ')}</strong></li>
            <li>Os resultados da avaliação recém-realizada.</li>
            <li>O nível de experiência informado na anamnese.</li>
          </ul>
          <p className="mt-3">Você poderá editar o treino completamente antes de salvá-lo.</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Agora não
          </Button>
          <Button onClick={generateWorkout} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Gerar Sugestão
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkoutSuggestionDialog;