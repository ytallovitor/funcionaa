"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Student {
  id: string;
  name: string;
  trainer_id: string;
}

interface WeeklyGoalsData {
  id?: string; // Optional for new goals
  target_workouts: number;
  target_measurements: number;
  target_progress_photos: number;
  start_date: string;
  end_date: string;
}

interface SetWeeklyGoalsDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoalsUpdated: () => void;
}

const SetWeeklyGoalsDialog = ({ student, open, onOpenChange, onGoalsUpdated }: SetWeeklyGoalsDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [goalsData, setGoalsData] = useState<WeeklyGoalsData>({
    target_workouts: 0,
    target_measurements: 0,
    target_progress_photos: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
  });

  useEffect(() => {
    if (open && student) {
      fetchStudentGoals();
    } else if (!open) {
      // Reset form when dialog closes
      setGoalsData({
        target_workouts: 0,
        target_measurements: 0,
        target_progress_photos: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    }
  }, [open, student]);

  const fetchStudentGoals = async () => {
    if (!student) return;
    setLoadingGoals(true);
    try {
      const { data, error } = await supabase
        .from('weekly_goals')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows found

      if (data) {
        setGoalsData({
          id: data.id,
          target_workouts: data.target_workouts,
          target_measurements: data.target_measurements,
          target_progress_photos: data.target_progress_photos,
          start_date: data.start_date,
          end_date: data.end_date,
        });
      }
    } catch (error) {
      console.error("Error fetching weekly goals:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as metas semanais.",
        variant: "destructive"
      });
    } finally {
      setLoadingGoals(false);
    }
  };

  const handleSaveGoals = async () => {
    if (!student || !user) return;
    setIsSubmitting(true);

    try {
      const payload = {
        student_id: student.id,
        trainer_id: student.trainer_id, // Ensure trainer_id is passed
        target_workouts: goalsData.target_workouts,
        target_measurements: goalsData.target_measurements,
        target_progress_photos: goalsData.target_progress_photos,
        start_date: goalsData.start_date,
        end_date: goalsData.end_date,
      };

      if (goalsData.id) {
        // Update existing goals
        const { error } = await supabase
          .from('weekly_goals')
          .update(payload)
          .eq('id', goalsData.id);
        if (error) throw error;
      } else {
        // Insert new goals
        const { error } = await supabase
          .from('weekly_goals')
          .insert(payload);
        if (error) throw error;
      }

      toast({
        title: "Sucesso!",
        description: "Metas semanais salvas com sucesso."
      });
      onGoalsUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving weekly goals:", error);
      toast({
        title: "Erro",
        description: "Falha ao salvar as metas semanais.",
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
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas Semanais para {student.name}
          </DialogTitle>
          <DialogDescription>
            Defina as metas de treinos, medidas e fotos de progresso para a semana.
          </DialogDescription>
        </DialogHeader>
        {loadingGoals ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Data de Início</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={goalsData.start_date}
                  onChange={(e) => setGoalsData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Data de Fim</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={goalsData.end_date}
                  onChange={(e) => setGoalsData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_workouts">Treinos por Semana</Label>
              <Input
                id="target_workouts"
                type="number"
                min="0"
                value={goalsData.target_workouts}
                onChange={(e) => setGoalsData(prev => ({ ...prev, target_workouts: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_measurements">Medidas por Semana</Label>
              <Input
                id="target_measurements"
                type="number"
                min="0"
                value={goalsData.target_measurements}
                onChange={(e) => setGoalsData(prev => ({ ...prev, target_measurements: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_progress_photos">Fotos de Progresso por Semana</Label>
              <Input
                id="target_progress_photos"
                type="number"
                min="0"
                value={goalsData.target_progress_photos}
                onChange={(e) => setGoalsData(prev => ({ ...prev, target_progress_photos: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveGoals} disabled={isSubmitting || loadingGoals}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Salvar Metas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SetWeeklyGoalsDialog;