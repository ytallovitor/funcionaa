import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner"; // Import toast from sonner

interface StudentData {
  latestMeasurements: {
    weight?: number;
    bodyFat?: number;
    leanMass?: number;
    tmb?: number;
    waist?: number;
    date?: string;
  };
  weeklyGoals: {
    workouts: { completed: number; target: number };
    measurements: { completed: number; target: number };
    progress: { completed: number; target: number };
  };
  loading: boolean;
  error: string | null;
}

// Removed custom Toast interface as sonner's toast is used directly

export function useStudentData() {
  const [data, setData] = useState<StudentData>({
    latestMeasurements: {},
    weeklyGoals: { workouts: { completed: 0, target: 5 }, measurements: { completed: 0, target: 3 }, progress: { completed: 0, target: 1 } },
    loading: true,
    error: null
  });
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        // Get student profile (assuming student has a profile or direct relation)
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profile) {
          throw new Error("Perfil do aluno não encontrado");
        }

        // Latest measurements from evaluations
        const { data: latestEval } = await supabase
          .from('evaluations')
          .select('*')
          .eq('student_id', profile.id)
          .order('evaluation_date', { ascending: false })
          .limit(1)
          .single();

        const latestMeasurements = latestEval ? {
          weight: latestEval.weight,
          bodyFat: latestEval.body_fat_percentage,
          leanMass: latestEval.lean_mass,
          tmb: latestEval.bmr,
          waist: latestEval.waist,
          date: latestEval.evaluation_date
        } : {};

        // Weekly goals: workouts completed this week
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);

        const { count: workoutsCompleted } = await supabase
          .from('workout_logs')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', profile.id)
          .gte('workout_date', startOfWeek.toISOString().split('T')[0])
          .lte('workout_date', endOfWeek.toISOString().split('T')[0]);

        const { count: measurementsCompleted } = await supabase
          .from('evaluations')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', profile.id)
          .gte('evaluation_date', startOfWeek.toISOString().split('T')[0]);

        // Progress photos or similar - mock for now, replace with real table if exists
        const progressCompleted = 1; // Placeholder - fetch from progress_photos table if exists
        const progressTarget = 1;

        setData({
          latestMeasurements,
          weeklyGoals: {
            workouts: { completed: workoutsCompleted || 0, target: 5 },
            measurements: { completed: measurementsCompleted || 0, target: 3 },
            progress: { completed: progressCompleted, target: progressTarget }
          },
          loading: false,
          error: null
        });

      } catch (error: any) {
        console.error('Error fetching student data:', error);
        setData(prev => ({ ...prev, loading: false, error: error.message }));
        toast.error(`Erro ao carregar dados: ${error.message || "Tente novamente mais tarde"}`); // Using sonner toast
      }
    };

    fetchData();
  }, [user]);

  return data;
}