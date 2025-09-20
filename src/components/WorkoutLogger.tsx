import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Loader2, Dumbbell, Clock, X, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card"; // Importado Card, CardContent, CardHeader

// Nova interface para um exercício dentro da RPC Workout Output
interface ExerciseInRpcOutput {
  id: string;
  name: string;
  instructions: string[];
  video_url?: string;
  sets: number;
  reps: number;
  rest_time: number;
  notes?: string;
  duration?: number; // Adicionado duration
  order_index: number; // Adicionado order_index
}

// Nova interface para o TodaysWorkout, correspondendo à saída da RPC fn_student_workouts
interface TodaysWorkout {
  id: string; // workout_template_id
  name: string; // workout_template_name
  description: string; // workout_template_description
  estimated_duration: number;
  assigned_date: string; // from student_workouts
  exercises: ExerciseInRpcOutput[];
}

interface WorkoutLoggerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todaysWorkout: TodaysWorkout | null;
  studentId: string;
  onWorkoutLogged: () => void;
}

interface ExerciseLogState {
  sets: {
    reps_completed: number;
    weight_used: number;
    duration_seconds?: number;
  }[];
  notes?: string;
}

const WorkoutLogger = ({ open, onOpenChange, todaysWorkout, studentId, onWorkoutLogged }: WorkoutLoggerProps) => {
  const { user } = useAuth();
  const [exerciseLogs, setExerciseLogs] = useState<{ [key: string]: ExerciseLogState }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);

  useEffect(() => {
    if (open && todaysWorkout) {
      const initialLogs: { [key: string]: ExerciseLogState } = {};
      todaysWorkout.exercises.forEach(ex => { // Acessar diretamente 'exercises'
        initialLogs[ex.id] = { // Usar ex.id como chave
          sets: Array.from({ length: ex.sets || 0 }, () => ({
            reps_completed: ex.reps || 0,
            weight_used: 0, // Peso inicial 0, o aluno preenche
            duration_seconds: ex.duration || undefined,
          })),
          notes: "",
        };
      });
      setExerciseLogs(initialLogs);
      setStartTime(new Date().toISOString());
    } else {
      // Reset state when dialog closes
      setExerciseLogs({});
      setStartTime(null);
    }
  }, [open, todaysWorkout]);

  const handleSetChange = (exerciseId: string, setIndex: number, field: 'reps_completed' | 'weight_used' | 'duration_seconds', value: number) => {
    setExerciseLogs(prev => {
      const newLogs = { ...prev };
      if (newLogs[exerciseId]) {
        newLogs[exerciseId].sets[setIndex] = {
          ...newLogs[exerciseId].sets[setIndex],
          [field]: value,
        };
      }
      return newLogs;
    });
  };

  const handleNotesChange = (exerciseId: string, notes: string) => {
    setExerciseLogs(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        notes,
      },
    }));
  };

  const handleFinishWorkout = async () => {
    if (!todaysWorkout || !studentId || !user || !startTime) return;

    setIsSubmitting(true);
    try {
      // 1. Create main workout log entry
      const endTime = new Date().toISOString();
      const totalDuration = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000 / 60); // in minutes

      const { data: newWorkoutLog, error: logError } = await supabase
        .from('workout_logs')
        .insert({
          student_id: studentId,
          workout_template_id: todaysWorkout.id, // Usar id do treino
          workout_date: todaysWorkout.assigned_date,
          start_time: startTime,
          end_time: endTime,
          total_duration: totalDuration,
          notes: "Treino concluído via logger do portal."
        })
        .select()
        .single();

      if (logError) throw logError;

      // 2. Insert exercise logs for each exercise
      const exerciseLogEntries = todaysWorkout.exercises.map(ex => { // Acessar diretamente 'exercises'
        const logState = exerciseLogs[ex.id]; // Usar ex.id
        return {
          workout_log_id: newWorkoutLog.id,
          exercise_id: ex.id, // Usar ex.id
          sets_completed: logState.sets.length,
          reps_completed: logState.sets.map(s => s.reps_completed),
          weight_used: logState.sets.map(s => s.weight_used),
          duration_seconds: logState.sets.some(s => s.duration_seconds !== undefined) ? logState.sets.map(s => s.duration_seconds || 0) : null,
          rest_time: ex.rest_time, // Usar rest_time do exercício
          notes: logState.notes,
        };
      });

      const { error: exerciseLogsError } = await supabase
        .from('workout_exercise_logs')
        .insert(exerciseLogEntries);

      if (exerciseLogsError) throw exerciseLogsError;

      toast.success("Treino Registrado!", {
        description: `Seu treino "${todaysWorkout.name}" foi salvo com sucesso.`,
      });
      onWorkoutLogged();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error logging workout:", error);
      toast.error("Erro ao registrar treino", {
        description: error.message || "Não foi possível salvar seu progresso. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!todaysWorkout) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            Registrar Treino: {todaysWorkout.name}
          </DialogTitle>
          <DialogDescription>
            Preencha as séries, repetições e pesos realizados em cada exercício.
            <br />
            <span className="text-xs text-muted-foreground">Início: {startTime ? new Date(startTime).toLocaleTimeString('pt-BR') : '...'}</span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-1 pr-4 -mr-4">
          <div className="space-y-6">
            {todaysWorkout.exercises
              .sort((a, b) => a.order_index - b.order_index) // Assumindo que order_index está no objeto exercise
              .map((ex, index) => (
                <Card key={ex.id} className="border-primary/20">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">#{index + 1}</span>
                        {ex.name}
                      </h3>
                      {ex.video_url && (
                        <Button variant="outline" size="sm" onClick={() => window.open(ex.video_url!, '_blank')}>
                          <Video className="h-4 w-4 mr-2" />
                          Ver Vídeo
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Instruções: {ex.instructions?.[0] || 'N/A'}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Array.from({ length: ex.sets || 0 }).map((_, setIndex) => (
                      <div key={setIndex} className="grid grid-cols-4 gap-3 items-center">
                        <Label className="col-span-1 text-sm">Série {setIndex + 1}</Label>
                        <Input
                          type="number"
                          placeholder="Reps"
                          value={exerciseLogs[ex.id]?.sets[setIndex]?.reps_completed || ''}
                          onChange={(e) => handleSetChange(ex.id, setIndex, 'reps_completed', parseInt(e.target.value) || 0)}
                          min="0"
                          className="col-span-1"
                        />
                        <Input
                          type="number"
                          placeholder="Peso (kg)"
                          value={exerciseLogs[ex.id]?.sets[setIndex]?.weight_used || ''}
                          onChange={(e) => handleSetChange(ex.id, setIndex, 'weight_used', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.5"
                          className="col-span-1"
                        />
                        {ex.duration ? (
                          <Input
                            type="number"
                            placeholder="Duração (s)"
                            value={exerciseLogs[ex.id]?.sets[setIndex]?.duration_seconds || ''}
                            onChange={(e) => handleSetChange(ex.id, setIndex, 'duration_seconds', parseInt(e.target.value) || 0)}
                            min="0"
                            className="col-span-1"
                          />
                        ) : (
                          <div className="col-span-1 text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {ex.rest_time}s descanso
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="space-y-2 mt-4">
                      <Label htmlFor={`notes-${ex.id}`} className="text-sm">Notas do Exercício</Label>
                      <Input
                        id={`notes-${ex.id}`}
                        placeholder="Ex: Senti mais o tríceps, peso leve"
                        value={exerciseLogs[ex.id]?.notes || ''}
                        onChange={(e) => handleNotesChange(ex.id, e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </ScrollArea>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleFinishWorkout} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Finalizar Treino
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkoutLogger;