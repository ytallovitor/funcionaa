import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ExerciseLibrary from "./ExerciseLibrary";
import { 
  Plus, 
  Trash2, 
  Save, 
  Dumbbell, 
  Clock, 
  Target,
  Edit,
  GripVertical,
  X
} from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle_groups: string[];
  difficulty: string;
  equipment: string[];
  instructions: string[];
  tips: string[];
  duration: number;
  reps?: number;
  sets?: number;
  rest_time?: number;
  video_url?: string;
  image_url?: string;
}

interface WorkoutExercise {
  exercise: Exercise;
  sets: number;
  reps: number;
  weight_kg?: number;
  duration?: number;
  rest_time: number;
  notes?: string;
  order_index: number;
}

interface WorkoutCreatorProps {
  onSave?: (workout: any) => void;
  editingWorkout?: any;
}

const WorkoutCreator = ({ onSave, editingWorkout }: WorkoutCreatorProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [workoutName, setWorkoutName] = useState(editingWorkout?.name || "");
  const [workoutDescription, setWorkoutDescription] = useState(editingWorkout?.description || "");
  const [workoutCategory, setWorkoutCategory] = useState(editingWorkout?.category || "");
  const [workoutDifficulty, setWorkoutDifficulty] = useState(editingWorkout?.difficulty || "");
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const [isPublic, setIsPublic] = useState(editingWorkout?.is_public || false);
  const [equipmentNeeded, setEquipmentNeeded] = useState<string[]>(editingWorkout?.equipment_needed || []);

  useEffect(() => {
    // Calculate estimated duration when exercises change
    const totalDuration = workoutExercises.reduce((total, workoutExercise) => {
      const exerciseTime = workoutExercise.duration || (workoutExercise.sets * 60); // 60 seconds per set estimate
      const restTime = workoutExercise.sets * workoutExercise.rest_time;
      return total + exerciseTime + restTime;
    }, 0);
    setEstimatedDuration(Math.round(totalDuration / 60)); // Convert to minutes
  }, [workoutExercises]);

  const handleAddExercise = (exercise: Exercise) => {
    const newWorkoutExercise: WorkoutExercise = {
      exercise,
      sets: exercise.sets || 3,
      reps: exercise.reps || 12,
      weight_kg: 0,
      duration: exercise.duration || 0,
      rest_time: exercise.rest_time || 60,
      notes: "",
      order_index: workoutExercises.length
    };
    
    setWorkoutExercises([...workoutExercises, newWorkoutExercise]);
    
    // Update equipment needed
    const newEquipment = exercise.equipment.filter(eq => !equipmentNeeded.includes(eq));
    if (newEquipment.length > 0) {
      setEquipmentNeeded([...equipmentNeeded, ...newEquipment]);
    }

    toast({
      title: "Exercício Adicionado",
      description: `${exercise.name} foi adicionado ao treino`
    });
  };

  const handleRemoveExercise = (index: number) => {
    const newExercises = workoutExercises.filter((_, i) => i !== index);
    setWorkoutExercises(newExercises);
  };

  const handleUpdateExercise = (index: number, field: string, value: any) => {
    const newExercises = [...workoutExercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setWorkoutExercises(newExercises);
  };

  const handleSaveWorkout = async () => {
    if (!workoutName || workoutExercises.length === 0) {
      toast({
        title: "Erro",
        description: "Nome do treino e pelo menos um exercício são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!profile) {
        toast({
          title: "Erro",
          description: "Perfil não encontrado",
          variant: "destructive"
        });
        return;
      }

      // Create workout template
      const { data: workoutTemplate, error: workoutError } = await supabase
        .from('workout_templates')
        .insert({
          name: workoutName,
          description: workoutDescription,
          category: workoutCategory,
          difficulty: workoutDifficulty,
          estimated_duration: estimatedDuration,
          equipment_needed: equipmentNeeded,
          trainer_id: profile.id,
          is_public: isPublic
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Add exercises to workout template
      const exercisePromises = workoutExercises.map((workoutExercise, index) => {
        return supabase.from('workout_template_exercises').insert({
          workout_template_id: workoutTemplate.id,
          exercise_id: workoutExercise.exercise.id,
          sets: workoutExercise.sets,
          reps: workoutExercise.reps,
          weight_kg: workoutExercise.weight_kg,
          duration: workoutExercise.duration,
          rest_time: workoutExercise.rest_time,
          notes: workoutExercise.notes,
          order_index: index
        });
      });

      await Promise.all(exercisePromises);

      toast({
        title: "Sucesso!",
        description: "Treino criado com sucesso"
      });

      // Reset form
      setWorkoutName("");
      setWorkoutDescription("");
      setWorkoutCategory("");
      setWorkoutDifficulty("");
      setWorkoutExercises([]);
      setEquipmentNeeded([]);
      setIsPublic(false);

      if (onSave) {
        onSave(workoutTemplate);
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o treino",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Workout Configuration */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Configuração do Treino
            </CardTitle>
            <CardDescription>
              Configure as informações básicas do seu treino
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workoutName">Nome do Treino</Label>
                <Input
                  id="workoutName"
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  placeholder="Ex: Treino Peito e Tríceps"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={workoutCategory} onValueChange={setWorkoutCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Força">Força</SelectItem>
                    <SelectItem value="Cardio">Cardio</SelectItem>
                    <SelectItem value="Funcional">Funcional</SelectItem>
                    <SelectItem value="HIIT">HIIT</SelectItem>
                    <SelectItem value="Flexibilidade">Flexibilidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={workoutDescription}
                onChange={(e) => setWorkoutDescription(e.target.value)}
                placeholder="Descreva os objetivos e foco do treino"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Dificuldade</Label>
                <Select value={workoutDifficulty} onValueChange={setWorkoutDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a dificuldade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Iniciante">Iniciante</SelectItem>
                    <SelectItem value="Intermediário">Intermediário</SelectItem>
                    <SelectItem value="Avançado">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duração Estimada</Label>
                <div className="flex items-center gap-2 p-2 border rounded">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{estimatedDuration} minutos</span>
                </div>
              </div>
            </div>

            {equipmentNeeded.length > 0 && (
              <div className="space-y-2">
                <Label>Equipamentos Necessários</Label>
                <div className="flex flex-wrap gap-2">
                  {equipmentNeeded.map((equipment, index) => (
                    <Badge key={index} variant="outline">
                      {equipment}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exercise List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Exercícios do Treino ({workoutExercises.length})
            </CardTitle>
            <CardDescription>
              Lista de exercícios adicionados ao treino
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workoutExercises.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum exercício adicionado ainda</p>
                <p className="text-sm">Use a biblioteca de exercícios para adicionar</p>
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                <div className="space-y-4">
                  {workoutExercises.map((workoutExercise, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium text-muted-foreground">
                            #{index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium">{workoutExercise.exercise.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {workoutExercise.exercise.muscle_groups.join(", ")}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveExercise(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Séries</Label>
                          <Input
                            type="number"
                            value={workoutExercise.sets}
                            onChange={(e) => handleUpdateExercise(index, 'sets', parseInt(e.target.value) || 0)}
                            min="1"
                            max="10"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Repetições</Label>
                          <Input
                            type="number"
                            value={workoutExercise.reps}
                            onChange={(e) => handleUpdateExercise(index, 'reps', parseInt(e.target.value) || 0)}
                            min="1"
                            max="100"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Peso (kg)</Label>
                          <Input
                            type="number"
                            value={workoutExercise.weight_kg || ""}
                            onChange={(e) => handleUpdateExercise(index, 'weight_kg', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.5"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Descanso (s)</Label>
                          <Input
                            type="number"
                            value={workoutExercise.rest_time}
                            onChange={(e) => handleUpdateExercise(index, 'rest_time', parseInt(e.target.value) || 0)}
                            min="0"
                            max="300"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Observações</Label>
                        <Input
                          value={workoutExercise.notes || ""}
                          onChange={(e) => handleUpdateExercise(index, 'notes', e.target.value)}
                          placeholder="Observações especiais para este exercício"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={handleSaveWorkout}
            className="gradient-primary text-white"
            disabled={!workoutName || workoutExercises.length === 0}
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar Treino
          </Button>
          <Button variant="outline">
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
        </div>
      </div>

      {/* Exercise Library */}
      <div className="lg:col-span-1">
        <ExerciseLibrary onSelectExercise={handleAddExercise} compact />
      </div>
    </div>
  );
};

export default WorkoutCreator;