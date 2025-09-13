import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  name: string;
  age: number;
  gender: string;
  goal: string;
  height: number;
  birth_date?: string;
}

interface EditStudentDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStudentUpdated: () => void;
}

const EditStudentDialog = ({ student, open, onOpenChange, onStudentUpdated }: EditStudentDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    birth_date: "",
    gender: "",
    goal: "",
    height: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || "",
        birth_date: student.birth_date || "",
        gender: student.gender || "",
        goal: student.goal || "",
        height: student.height?.toString() || ""
      });
    }
  }, [student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('students')
        .update({
          name: formData.name,
          birth_date: formData.birth_date || null,
          gender: formData.gender,
          goal: formData.goal,
          height: parseFloat(formData.height)
        })
        .eq('id', student.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Dados do aluno atualizados"
      });

      onOpenChange(false);
      onStudentUpdated();
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar dados do aluno",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Aluno</DialogTitle>
          <DialogDescription>
            Atualize as informações de {student.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birth_date">Data de Nascimento</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Altura (cm)</Label>
            <Input
              id="height"
              type="number"
              step="0.1"
              value={formData.height}
              onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gênero</Label>
            <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Selecione o gênero" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal">Objetivo</Label>
            <Select value={formData.goal} onValueChange={(value) => setFormData(prev => ({ ...prev, goal: value }))}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Selecione o objetivo" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="perder_gordura">Perder Gordura</SelectItem>
                <SelectItem value="ganhar_massa">Ganhar Massa</SelectItem>
                <SelectItem value="manter_peso">Manter Peso</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 gradient-primary"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Atualizar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditStudentDialog;