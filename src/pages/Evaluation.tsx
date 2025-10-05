import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import EvaluationMethodSelector from "@/components/EvaluationMethodSelector";
import CircumferencesEvaluation from "@/components/CircumferencesEvaluation";
import SkinfoldsEvaluation from "@/components/SkinfoldsEvaluation";
import FitnessTestsEvaluation from "@/components/FitnessTestsEvaluation";
import { Loader2 } from "lucide-react";
import WorkoutSuggestionDialog from "@/components/WorkoutSuggestionDialog";

interface Student {
  id: string;
  name: string;
  age: number;
  gender: 'masculino' | 'feminino';
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
  const [currentStep, setCurrentStep] = useState<'method' | 'evaluation' | 'suggestion'>('method');
  const [selectedMethod, setSelectedMethod] = useState<'circumferences' | 'skinfolds' | 'fitness_tests'>('circumferences');

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
      setStudent(studentData as Student);
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

  const handleMethodSelect = (method: 'circumferences' | 'skinfolds' | 'fitness_tests') => {
    setSelectedMethod(method);
    setCurrentStep('evaluation');
  };

  const handleBackToMethod = () => {
    setCurrentStep('method');
  };

  const handleEvaluationSuccess = () => {
    setCurrentStep('suggestion');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Nova Avaliação</h1>
        <p className="text-muted-foreground mb-6">
          Selecione um aluno para realizar a avaliação ou{" "}
          <button 
            onClick={() => navigate('/students')} 
            className="text-primary hover:underline font-medium"
          >
            cadastre um novo aluno
          </button>
        </p>
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">
            Nenhum aluno selecionado. Por favor, selecione um aluno na página de Alunos.
          </p>
          <button
            onClick={() => navigate('/students')}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Ir para Alunos
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === 'method') {
    return <EvaluationMethodSelector onMethodSelect={handleMethodSelect} />;
  }

  if (currentStep === 'suggestion') {
    return (
      <WorkoutSuggestionDialog
        student={student}
        onClose={() => navigate('/students')}
      />
    );
  }

  if (selectedMethod === 'circumferences') {
    return (
      <CircumferencesEvaluation
        student={student}
        onBack={handleBackToMethod}
        onSuccess={handleEvaluationSuccess}
      />
    );
  } else if (selectedMethod === 'skinfolds') {
    return (
      <SkinfoldsEvaluation
        student={student}
        onBack={handleBackToMethod}
        onSuccess={handleEvaluationSuccess}
      />
    );
  } else {
    return (
      <FitnessTestsEvaluation
        student={student}
        onBack={handleBackToMethod}
        onSuccess={handleEvaluationSuccess}
      />
    );
  }
};

export default Evaluation;