import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import EvaluationMethodSelector from "@/components/EvaluationMethodSelector";
import CircumferencesEvaluation from "@/components/CircumferencesEvaluation";
import SkinfoldsEvaluation from "@/components/SkinfoldsEvaluation";
import { Loader2 } from "lucide-react";

interface Student {
  id: string;
  name: string;
  age: number;
  gender: string;
  goal: string;
  height: number;
}

const Evaluation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<'method' | 'evaluation'>('method');
  const [selectedMethod, setSelectedMethod] = useState<'circumferences' | 'skinfolds'>('circumferences');

  const studentId = searchParams.get('student');

  useEffect(() => {
    if (studentId && user) {
      fetchStudent();
    } else if (!studentId) {
      setLoading(false);
    }
  }, [studentId, user]);

  const fetchStudent = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!profile) return;

      const { data: studentData, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .eq('trainer_id', profile.id)
        .single();

      if (error) throw error;
      setStudent(studentData);
    } catch (error) {
      console.error('Error fetching student:', error);
      toast({
        title: "Erro",
        description: "Aluno não encontrado",
        variant: "destructive"
      });
      navigate('/students');
    } finally {
      setLoading(false);
    }
  };

  const handleMethodSelect = (method: 'circumferences' | 'skinfolds') => {
    setSelectedMethod(method);
    setCurrentStep('evaluation');
  };

  const handleBackToMethod = () => {
    setCurrentStep('method');
  };

  const handleEvaluationSuccess = () => {
    navigate('/students');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return <EvaluationMethodSelector onMethodSelect={() => navigate('/students')} />;
  }

  if (currentStep === 'method') {
    return <EvaluationMethodSelector onMethodSelect={handleMethodSelect} />;
  }

  return selectedMethod === 'circumferences' ? (
    <CircumferencesEvaluation
      student={student}
      onBack={handleBackToMethod}
      onSuccess={handleEvaluationSuccess}
    />
  ) : (
    <SkinfoldsEvaluation
      student={student}
      onBack={handleBackToMethod}
      onSuccess={handleEvaluationSuccess}
    />
  );
};

export default Evaluation;