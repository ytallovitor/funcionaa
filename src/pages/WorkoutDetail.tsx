import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Dumbbell, Clock, Target, List, Edit, Trash2, Video } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface ExerciseDetail {
  id: string;
  name: string;
  category: string;
  muscle_groups: string[];
  difficulty: string;
  equipment: string[];
  instructions: string[];
  tips: string[];
  video_url?: string;
  image_url?: string;
}

interface WorkoutTemplateExercise {
  id: string; // Add ID for deletion
  order_index: number;
  sets?: number;
  reps?: number;
  weight_kg?: number;
  duration?: number;
  rest_time?: number;
  notes?: string;
  exercises: ExerciseDetail; // Nested exercise details
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  estimated_duration: number;
  equipment_needed: string[];
  is_public: boolean;
  workout_template_exercises: WorkoutTemplateExercise[];
}

const WorkoutDetail = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [workout, setWorkout] = useState<WorkoutTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!workoutId) {
      setError("ID do treino não fornecido.");
      setLoading(false);
      return;
    }

    const fetchWorkoutDetails = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('workout_templates')
          .select(`
            *,
            workout_template_exercises (
              id, order_index,
              sets,
              reps,
              weight_kg,
              duration,
              rest_time,
              notes,
              exercises (
                id, name, category, muscle_groups, difficulty, equipment, instructions, tips, video_url, image_url
              )
            )
          `)
          .eq('id', workoutId)
          .single();

        if (error) throw error;

        if (data) {
          // Sort exercises by order_index
          data.workout_template_exercises.sort((a: WorkoutTemplateExercise, b: WorkoutTemplateExercise) => a.order_index - b.order_index);
          setWorkout(data as WorkoutTemplate);
        } else {
          setError("Treino não encontrado.");
        }
      } catch (err: any) {
        console.error("Error fetching workout details:", err);
        setError("Não foi possível carregar os detalhes do treino: " + err.message);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os detalhes do treino.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutDetails();
  }, [workoutId, toast]);

  const handleDeleteWorkout = async () => {
    if (!workoutId) return;
    setIsDeleting(true);
    try {
      // Delete associated workout_template_exercises first
      const { error: deleteExercisesError } = await supabase
        .from('workout_template_exercises')
        .delete()
        .eq('workout_template_id', workoutId);

      if (deleteExercisesError) throw deleteExercisesError;

      // Then delete the workout template
      const { error: deleteTemplateError } = await supabase
        .from('workout_templates')
        .delete()
        .eq('id', workoutId);

      if (deleteTemplateError) throw deleteTemplateError;

      toast({
        title: "Sucesso!",
        description: "Treino excluído com sucesso."
      });
      navigate('/workouts'); // Redirect to workouts list
    } catch (err: any) {
      console.error("Error deleting workout:", err);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o treino: " + err.message,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Iniciante': return 'bg-green-500';
      case 'Intermediário': return 'bg-yellow-500';
      case 'Avançado': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-destructive">{error}</p>
        <Button onClick={() => navigate('/workouts')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Treinos
        </Button>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">Treino não encontrado.</p>
        <Button onClick={() => navigate('/workouts')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Treinos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/workouts')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Modelos
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            {workout.name}
          </h1>
          <p className="text-muted-foreground mt-2">
            Detalhes do modelo de treino
          </p>
        </div>
      </div>

      <Card className="shadow-primary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{workout.name}</CardTitle>
              <CardDescription className="mt-2">{workout.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getDifficultyColor(workout.difficulty)} text-white text-sm`}>
                {workout.difficulty}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {workout.category}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-accent/50 rounded-lg">
              <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-sm text-muted-foreground">Duração Estimada</p>
              <p className="text-lg font-semibold text-primary">{workout.estimated_duration} min</p>
            </div>
            <div className="text-center p-3 bg-accent/50 rounded-lg">
              <Dumbbell className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-sm text-muted-foreground">Exercícios</p>
              <p className="text-lg font-semibold text-primary">{workout.workout_template_exercises.length}</p>
            </div>
            <div className="text-center p-3 bg-accent/50 rounded-lg">
              <List className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-sm text-muted-foreground">Equipamentos</p>
              <p className="text-lg font-semibold text-primary">{workout.equipment_needed?.length || 0}</p>
            </div>
            <div className="text-center p-3 bg-accent/50 rounded-lg">
              <Target className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-sm text-muted-foreground">Visibilidade</p>
              <p className="text-lg font-semibold text-primary">{workout.is_public ? 'Público' : 'Privado'}</p>
            </div>
          </div>

          {workout.equipment_needed && workout.equipment_needed.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Equipamentos Necessários</h3>
              <div className="flex flex-wrap gap-2">
                {workout.equipment_needed.map((equipment, index) => (
                  <Badge key={index} variant="secondary">{equipment}</Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-3">Exercícios do Treino</h3>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {workout.workout_template_exercises.map((wte, index) => (
                  <Card key={wte.id} className="border-primary/20">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <span className="text-muted-foreground">#{index + 1}</span>
                          {wte.exercises.name}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">{wte.exercises.category}</Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {wte.exercises.muscle_groups.join(" • ")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <p>
                        <strong>Séries:</strong> {wte.sets} • 
                        <strong> Repetições:</strong> {wte.reps} • 
                        <strong> Peso:</strong> {wte.weight_kg ? `${wte.weight_kg}kg` : 'N/A'} • 
                        <strong> Descanso:</strong> {wte.rest_time}s
                      </p>
                      {wte.notes && <p className="text-primary text-xs"><strong>Notas:</strong> {wte.notes}</p>}
                      {wte.exercises.instructions && wte.exercises.instructions.length > 0 && (
                        <div className="mt-2">
                          <h4 className="font-medium text-xs text-muted-foreground">Instruções:</h4>
                          <ul className="list-disc list-inside text-xs text-muted-foreground">
                            {wte.exercises.instructions.map((inst, i) => <li key={i}>{inst}</li>)}
                          </ul>
                        </div>
                      )}
                      {wte.exercises.tips && wte.exercises.tips.length > 0 && (
                        <div className="mt-2">
                          <h4 className="font-medium text-xs text-muted-foreground">Dicas:</h4>
                          <ul className="list-disc list-inside text-xs text-muted-foreground">
                            {wte.exercises.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                          </ul>
                        </div>
                      )}
                      {wte.exercises.video_url && (
                        <Button variant="outline" size="sm" className="mt-2">
                          <Video className="h-4 w-4 mr-2" />
                          Ver Vídeo
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex gap-2 mt-6">
            <Button className="gradient-primary text-white" onClick={() => navigate(`/workouts/edit/${workout.id}`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Treino
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Treino
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o modelo de treino "{workout.name}" e todos os seus exercícios associados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteWorkout} disabled={isDeleting}>
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkoutDetail;