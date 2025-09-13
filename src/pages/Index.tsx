import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import StudentDashboard from "@/components/StudentDashboard";
import TrainerDashboard from "@/components/TrainerDashboard";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'trainer' | 'student' | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/home');
      return;
    }

    const determineUserType = async () => {
      try {
        setLoading(true);
        
        // First check if user has a profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!profile) {
          // Create profile if it doesn't exist
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              full_name: user.user_metadata?.full_name || '',
              email: user.email || ''
            })
            .select()
            .single();
          
          setUserProfile(newProfile);
        } else {
          setUserProfile(profile);
        }

        // Check if user is a trainer (has students)
        const { data: students, count } = await supabase
          .from('students')
          .select('id', { count: 'exact' })
          .eq('trainer_id', profile?.id || '');

        if (count && count > 0) {
          setUserType('trainer');
        } else {
          // Check if user is associated with any student portal
          const { data: studentPortal } = await supabase
            .from('student_portals')
            .select('student_id, students(*)')
            .eq('username', user.email)
            .single();

          if (studentPortal) {
            setUserType('student');
          } else {
            // Default to trainer for new users
            setUserType('trainer');
          }
        }
      } catch (error) {
        console.error('Error determining user type:', error);
        setUserType('trainer'); // Default fallback
      } finally {
        setLoading(false);
      }
    };

    determineUserType();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return null;
  }

  if (userType === 'student') {
    return (
      <StudentDashboard 
        student={{
          id: userProfile.id,
          name: userProfile.full_name || 'Usuário',
          email: userProfile.email
        }}
      />
    );
  }

  return (
    <TrainerDashboard 
      trainer={{
        id: userProfile.id,
        name: userProfile.full_name || 'Personal Trainer',
        email: userProfile.email
      }}
    />
  );
};

export default Index;