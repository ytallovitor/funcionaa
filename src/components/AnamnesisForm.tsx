import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  name: string;
}

interface AnamnesisData {
  main_goal: string;
  training_experience: string;
  training_frequency: string;
  health_issues: string;
  medications: string;
  lifestyle_notes: string;
}

interface AnamnesisFormProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AnamnesisForm = ({ student, open, onOpenChange }: AnamnesisFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AnamnesisData>({
    main_goal: "",
    training_experience: "",
    training_frequency: "",
    health_issues: "",
    medications: "",
    lifestyle_notes: ""
  });

  useEffect(() => {
    if (open && student) {
      fetchAnamnesis();
    }
  }, [open, student]);

  const fetchAnamnesis = async () => {
    if (!student) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('anamnesis')
        .select('*')
        .eq('student_id', student.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setFormData(data);
      } else {
        // Reset form if no data exists
        setFormData({
          main_goal: "",
          training_experience: "",
          training_frequency: "",
          health_issues: "",
          medications: "",
          lifestyle_notes: ""
        });
      }
    } catch (error) {
      console.error("Error fetching anamnesis:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!student) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('anamnesis')
        .upsert({
          student_id: student.id,
          ...formData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id' });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Anamnese salva com sucesso."
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving anamnesis:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a anamnese.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Anamnese - {student.name}</DialogTitle>
          <DialogDescription>
            Preencha as informações detalhadas do aluno para um acompanhamento mais preciso.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
            <div className="space-y-2">
              <Label htmlFor="main_goal">Objetivo Principal (detalhado)</Label>
              <Textarea
                id="main_goal"
                value={formData.main_goal}
                onChange={(e) => setFormData({ ...formData, main_goal: e.target.value })}
                placeholder="Ex: Perder 10kg de gordura, focar em hipertrofia de membros inferiores, melhorar o condicionamento para corrida..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="training_experience">Experiência de Treino</Label>
                <Select
                  value={formData.training_experience}
                  onValueChange={(value) => setFormData({ ...formData, training_experience: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iniciante">Iniciante (nunca treinou ou treinou pouco)</SelectItem>
                    <SelectItem value="intermediario">Intermediário (treina consistentemente há 6-24 meses)</SelectItem>
                    <SelectItem value="avancado">Avançado (treina consistentemente há mais de 2 anos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="training_frequency">Frequência Semanal Desejada</Label>
                <Select
                  value={formData.training_frequency}
                  onValueChange={(value) => setFormData({ ...formData, training_frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-2">1 a 2 vezes</SelectItem>
                    <SelectItem value="3-4">3 a 4 vezes</SelectItem>
                    <SelectItem value="5+">5 ou mais vezes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="health_issues">Histórico de Saúde e Lesões</Label>
              <Textarea
                id="health_issues"
                value={formData.health_issues}
                onChange={(e) => setFormData({ ...formData, health_issues: e.target.value })}
                placeholder="Descreva qualquer condição médica, cirurgia, dor crônica, lesão prévia (ex: hérnia de disco, condromalácia patelar, cirurgia no ombro)..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medications">Uso de Medicamentos</Label>
              <Textarea
                id="medications"
                value={formData.medications}
                onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                placeholder="Liste medicamentos de uso contínuo que possam influenciar o treino (ex: beta-bloqueadores, anti-hipertensivos, etc.)."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lifestyle_notes">Estilo de Vida e Ocupação</Label>
              <Textarea
                id="lifestyle_notes"
                value={formData.lifestyle_notes}
                onChange={(e) => setFormData({ ...formData, lifestyle_notes: e.target.value })}
                placeholder="Descreva a rotina diária. Trabalha sentado? Carrega peso? Nível de estresse, qualidade do sono, hábitos (fuma, bebe?)..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Salvar Anamnese
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AnamnesisForm;