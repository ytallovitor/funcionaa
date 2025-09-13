import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  name: string;
}

interface WorkoutTemplate {
  id: string;
  name: string;
}

interface AssignedWorkout {
  id: string;
  assigned_date: string;
  status: string;
  workout_templates: {
    name: string;
    category: string;
  };
}

interface StudentWorkoutManagerProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWorkoutsUpdated: () => void;
}

const StudentWorkoutManager = ({ student, open, onOpenChange, onWorkoutsUpdated }: StudentWorkoutManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignedWorkouts, setAssignedWorkouts] = useState<AssignedWorkout[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<WorkoutTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && student && user) {
      fetchData();
    }
  }, [open, student, user]);

  const fetchData = async () => {
    if (!student || !user) return;
    setLoading(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
      if (!profile) throw new Error("Perfil do treinador não encontrado.");

      // Fetch assigned workouts
      const { data: assigned, error: assignedError } = await supabase
        .from('student_workouts')
        .select(`*, workout_templates (name, category)`)
        .eq('student_id', student.id);
      if (assignedError) throw assignedError;
      setAssignedWorkouts(assigned || []);

      // Fetch available templates
      const { data: templates, error: templatesError } = await supabase
        .from('workout_templates')
        .select('id, name')
        .eq('trainer_id', profile.id);
      if (templatesError) throw templatesError;
      setAvailableTemplates(templates || []);

    } catch (error) {
      console.error("Error fetching workout data:", error);
      toast({ title: "Erro", description: "Não foi possível carregar os dados de treino.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!student || !selectedTemplate) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('student_workouts').insert({
        student_id: student.id,
        workout_template_id: selectedTemplate,
        status: 'assigned'
      });
      if (error) throw error;
      toast({ title: "Sucesso!", description: "Treino atribuído ao aluno." });
      setSelectedTemplate("");
      fetchData();
      onWorkoutsUpdated();
    } catch (error) {
      console.error("Error assigning workout:", error);
      toast({ title: "Erro", description: "Não foi possível atribuir o treino.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (assignmentId: string) => {
    try {
      const { error } = await supabase.from('student_workouts').delete().eq('id', assignmentId);
      if (error) throw error;
      toast({ title: "Sucesso!", description: "Treino desvinculado do aluno." });
      fetchData();
      onWorkoutsUpdated();
    } catch (error) {
      console.error("Error removing workout assignment:", error);
      toast({ title: "Erro", description: "Não foi possível remover o treino.", variant: "destructive" });
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Treinos de {student.name}</DialogTitle>
          <DialogDescription>
            Atribua novos treinos ou remova treinos existentes.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Atribuir Novo Treino</h4>
              <div className="flex gap-2">
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um modelo de treino" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAssign} disabled={isSubmitting || !selectedTemplate}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Treinos Atribuídos</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {assignedWorkouts.length > 0 ? (
                  assignedWorkouts.map(aw => (
                    <div key={aw.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{aw.workout_templates.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{aw.workout_templates.category}</Badge>
                          <span>Status: {aw.status}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemove(aw.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Dumbbell className="h-8 w-8 mx-auto mb-2" />
                    <p>Nenhum treino atribuído.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StudentWorkoutManager;