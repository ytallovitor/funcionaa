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

      // 3. Fetch exercises based on parameters
      const { data: exercises, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('category', category)
        .eq('difficulty', difficulty)
        .limit(6); // Suggest 6 exercises

      if (error || !exercises || exercises.length === 0) {
        throw new Error("Não foi possível encontrar exercícios adequados.");
      }

      // 4. Build the suggested workout object
      const suggestedWorkout = {
        name: `Sugestão para ${student.name} - ${student.goal.replace('_', ' ')}`,
        description: `Treino gerado por IA com base no objetivo de ${student.goal} e experiência ${experience}.`,
        category: category,
        difficulty: difficulty,
        exercises: exercises.map(ex => ({
          exercise: ex,
          sets: sets,
          reps: repRange.split('-')[1], // Use the upper end of the range
          rest_time: 60,
          notes: ''
        }))
      };

      // 5. Navigate to workout creator with the suggestion
      navigate('/workouts', { state: { suggestedWorkout } });

    } catch (error: any) {
      console.error("Error generating workout:", error);
      toast({
        title: "Erro na Geração",
        description: error.message || "Não foi possível gerar a sugestão de treino.",
        variant: "destructive"
      });
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