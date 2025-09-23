import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner"; // Import toast from sonner
import { useAuth } from "@/hooks/useAuth"; // Adicionado import do useAuth

interface WeeklyGoals {
  id: string;
  target_workouts: number;
  target_measurements: number;
  target_progress_photos: number;
  start_date: string;
  end_date: string;
}

interface StudentData {
  latestMeasurements: {
    weight?: number;
    bodyFat?: number;
    leanMass?: number;
    tmb?: number;
    waist?: number;
    neck?: number;
    hip?: number;
    date?: string;
  };
  weeklyGoals: WeeklyGoals | null; // Now fetches dynamic weekly goals
  weeklyGoalsProgress: {
    workouts: { completed: number; target: number };
    measurements: { completed: number; target: number };
    progressPhotos: { completed: number; target: number };
  };
  loading: boolean;
  error: string | null;
}

export function useStudentData() {
  const [data, setData] = useState<StudentData>({
    latestMeasurements: {},
    weeklyGoals: null,
    weeklyGoalsProgress: { workouts: { completed: 0, target: 0 }, measurements: { completed: 0, target: 0 }, progressPhotos: { completed: 0, target: 0 } },
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
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, age, gender, height') // Fetch age, gender, height
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          throw profileError;
        }
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
          neck: latestEval.neck,
          hip: latestEval.hip,
          date: latestEval.evaluation_date
        } : {};

        // Fetch active weekly goals
        const { data: weeklyGoalsData, error: goalsError } = await supabase
          .from('weekly_goals')
          .select('*')
          .eq('student_id', profile.id)
          .gte('end_date', new Date().toISOString().split('T')[0]) // Only active or future goals
          .order('start_date', { ascending: false })
          .limit(1)
          .single();

        if (goalsError && goalsError.code !== 'PGRST116') throw goalsError;

        let currentWeeklyGoals: WeeklyGoals | null = null;
        let workoutsCompleted = 0;
        let measurementsCompleted = 0;
        let progressPhotosCompleted = 0; // Placeholder for now

        if (weeklyGoalsData) {
          currentWeeklyGoals = weeklyGoalsData;

          // Calculate completed workouts for the current goal period
          if (currentWeeklyGoals) {
            const { count: workoutsCount } = await supabase
              .from('workout_logs')
              .select('*', { count: 'exact', head: true })
              .eq('student_id', profile.id)
              .gte('workout_date', currentWeeklyGoals.start_date)
              .lte('workout_date', currentWeeklyGoals.end_date);
            workoutsCompleted = workoutsCount || 0;
          }

          // Calculate completed measurements for the current goal period
          if (currentWeeklyGoals) {
            const { count: measurementsCount } = await supabase
              .from('evaluations')
              .select('*', { count: 'exact', head: true })
              .eq('student_id', profile.id)
              .gte('evaluation_date', currentWeeklyGoals.start_date)
              .lte('evaluation_date', currentWeeklyGoals.end_date);
            measurementsCompleted = measurementsCount || 0;
          }

          // Placeholder for progress photos
          progressPhotosCompleted = 0; // Implement actual fetching if you add a table for this
        }

        setData({
          latestMeasurements,
          weeklyGoals: currentWeeklyGoals,
          weeklyGoalsProgress: {
            workouts: { completed: workoutsCompleted, target: currentWeeklyGoals?.target_workouts || 0 },
            measurements: { completed: measurementsCompleted, target: currentWeeklyGoals?.target_measurements || 0 },
            progressPhotos: { completed: progressPhotosCompleted, target: currentWeeklyGoals?.target_progress_photos || 0 }
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