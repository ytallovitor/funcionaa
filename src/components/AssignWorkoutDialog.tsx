import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  name: string;
}

interface AssignWorkoutDialogProps {
  workoutTemplate: { id: string; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned: () => void;
}

const AssignWorkoutDialog = ({ workoutTemplate, open, onOpenChange, onAssigned }: AssignWorkoutDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchStudents();
    }
  }, [open, user]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('students')
        .select('id, name')
        .eq('trainer_id', profile.id);

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!workoutTemplate || selectedStudents.length === 0) return;

    setIsSubmitting(true);
    try {
      const assignments = selectedStudents.map(studentId => ({
        student_id: studentId,
        workout_template_id: workoutTemplate.id,
        status: 'assigned'
      }));

      const { error } = await supabase.from('student_workouts').insert(assignments);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Treino "${workoutTemplate.name}" atribuído a ${selectedStudents.length} aluno(s).`
      });
      onAssigned();
      onOpenChange(false);
      setSelectedStudents([]);
    } catch (error) {
      console.error("Error assigning workout:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atribuir o treino.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuir Treino: {workoutTemplate?.name}</DialogTitle>
          <DialogDescription>
            Selecione os alunos para quem deseja atribuir este modelo de treino.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <ScrollArea className="h-64 border rounded-md p-4">
              <div className="space-y-4">
                {students.map(student => (
                  <div key={student.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={() => handleSelectStudent(student.id)}
                    />
                    <Label htmlFor={`student-${student.id}`} className="font-normal">
                      {student.name}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button onClick={handleAssign} disabled={isSubmitting || selectedStudents.length === 0} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Atribuir a {selectedStudents.length} aluno(s)
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssignWorkoutDialog;