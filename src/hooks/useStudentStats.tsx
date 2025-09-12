import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface StudentStats {
  totalStudents: number;
  totalEvaluations: number;
  progressRate: number;
  upcomingEvaluations: number;
  loading: boolean;
}

export function useStudentStats() {
  const [stats, setStats] = useState<StudentStats>({
    totalStudents: 0,
    totalEvaluations: 0,
    progressRate: 0,
    upcomingEvaluations: 0,
    loading: true
  });
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        // Get trainer profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profile) return;

        // Get total students
        const { count: studentsCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('trainer_id', profile.id);

        // Get total evaluations
        const { count: evaluationsCount } = await supabase
          .from('evaluations')
          .select('*, students!inner(*)', { count: 'exact', head: true })
          .eq('students.trainer_id', profile.id);

        // Calculate progress rate (students with more than 1 evaluation)
        const { data: studentsWithEvaluations } = await supabase
          .from('students')
          .select(`
            id,
            evaluations (count)
          `)
          .eq('trainer_id', profile.id);

        const studentsWithProgress = studentsWithEvaluations?.filter(
          student => student.evaluations?.length > 1
        ).length || 0;

        const progressRate = studentsCount ? Math.round((studentsWithProgress / studentsCount) * 100) : 0;

        // Calculate upcoming evaluations (students who need evaluation - last evaluation > 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: recentEvaluations } = await supabase
          .from('evaluations')
          .select('student_id, evaluation_date, students!inner(*)')
          .eq('students.trainer_id', profile.id)
          .gte('evaluation_date', thirtyDaysAgo.toISOString().split('T')[0])
          .order('evaluation_date', { ascending: false });

        const studentsWithRecentEvals = new Set(recentEvaluations?.map(e => e.student_id));
        const upcomingEvaluations = (studentsCount || 0) - studentsWithRecentEvals.size;

        setStats({
          totalStudents: studentsCount || 0,
          totalEvaluations: evaluationsCount || 0,
          progressRate,
          upcomingEvaluations: Math.max(0, upcomingEvaluations),
          loading: false
        });

      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, [user]);

  return stats;
}