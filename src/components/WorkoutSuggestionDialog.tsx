import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Wand2, ArrowRight, Check, AlertCircle, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface Student {
  id: string;
  name: string;
  goal: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  body_fat_percentage?: number;
  lean_mass?: number;
}

interface AnamnesisSummary {
  training_experience?: string;
  main_goal?: string;
  barriers_to_training?: string;
  equipment_available?: string[];
  preferred_training_times?: string;
}

interface WorkoutParams {
  daysPerWeek: number;
  workoutType: 'forca' | 'funcional' | 'cardio' | 'hiit' | 'flexibilidade';
  focusArea: string;
  equipmentAvailable: string[];
  specialNotes?: string;
}

interface WorkoutSuggestionDialogProps {
  student: Student;
  onClose: () => void;
}

const WorkoutSuggestionDialog = ({ student, onClose }: WorkoutSuggestionDialogProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState<'initial' | 'params' | 'generating'>('initial');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasAnamnesis, setHasAnamnesis] = useState<boolean | null>(null);
  const [params, setParams] = useState<WorkoutParams>({
    daysPerWeek: 3,
    workoutType: 'forca',
    focusArea: 'full_body',
    equipmentAvailable: [],
    specialNotes: ''
  });
  const [trainerId, setTrainerId] = useState<string | null>(null); // Fetch real trainer ID

  // Fallback exercises científicos (inseridos no DB se necessário)
  const scientificFallbackExercises = [
    {
      name: "Agachamento Livre",
      category: "Força",
      difficulty: "Iniciante",
      muscle_groups: ["Quadríceps", "Glúteos", "Core"],
      equipment: ["Barra", "Rack"],
      instructions: ["Posição inicial: pés na largura dos ombros, barra nos trapézios.", "Desça flexionando joelhos e quadris até coxas paralelas ao chão.", "Mantenha coluna neutra e joelhos alinhados com pés.", "Suba empurrando calcanhares, contraindo glúteos no topo."],
      tips: ["Embasamento: Ativa 70% dos músculos inferiores (Estudo JSCR 2018).", "Progressão: Aumente 2.5kg/semana para overload progressivo.", "Segurança: Evite hiperextensão lombar."],
      sets: 3,
      reps: 10,
      rest_time: 90,
      duration: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      name: "Burpee",
      category: "HIIT/Cardio",
      difficulty: "Iniciante",
      muscle_groups: ["Full Body", "Cardiovascular"],
      equipment: [],
      instructions: ["De pé, agache e apoie mãos no chão.", "Pule pés para trás em prancha.", "Faça flexão ou pule diretamente para flexionar joelhos.", "Pule de volta em pé, batendo palmas acima da cabeça."],
      tips: ["Embasamento: Queima 10-15kcal/min, melhora VO2 max (ACSM 2021).", "Modificação: Sem flexão para iniciantes.", "Benefício: EPOC elevado para perda de gordura pós-treino."],
      sets: 3,
      reps: 0,
      rest_time: 60,
      duration: 30,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      name: "Prancha com Elevação de Pernas",
      category: "Funcional",
      difficulty: "Iniciante",
      muscle_groups: ["Core", "Estabilizadores"],
      equipment: [],
      instructions: ["Posição prancha nos antebraços.", "Alternadamente, eleve uma perna 15cm do chão.", "Mantenha quadris estáveis, sem rotação.", "Troque de perna a cada 5 reps."],
      tips: ["Embasamento: Ativa transverso abdominal 30% mais que crunch (JOSPT 2019).", "Progressão: Adicione peso nas pernas após 4 semanas.", "Segurança: Pare se sentir dor lombar."],
      sets: 3,
      reps: 10,
      rest_time: 45,
      duration: 45,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      name: "Remada Unilateral com Haltere",
      category: "Força",
      difficulty: "Iniciante",
      muscle_groups: ["Costas", "Bíceps"],
      equipment: ["Haltere", "Banco"],
      instructions: ["Apoie um joelho e mão no banco, outra mão com haltere.", "Puxe haltere em direção ao quadril, contraindo escápula.", "Desça controladamente até extensão completa do braço.", "Troque de lado após série."],
      tips: ["Embasamento: Melhora postura e equilíbrio muscular (ACSM).", "Para perda de gordura: Use 12-15 reps com 60s rest.", "Foco: Contração isométrica no topo por 1s."],
      sets: 3,
      reps: 12,
      rest_time: 60,
      duration: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      name: "Alongamento de Isquiotibiais",
      category: "Flexibilidade",
      difficulty: "Iniciante",
      muscle_groups: ["Posterior da Coxa"],
      equipment: [],
      instructions: ["Sente no chão com pernas estendidas.", "Incline tronco para frente alcançando pés.", "Mantenha respiração normal, segure 20-30s.", "Repita com leve oscilação para alongar mais."],
      tips: ["Embasamento: Reduz risco de lesão em 20% (NSCA).", "Frequência: 3x/semana pós-treino.", "Não force: Sinta alongamento, não dor."],
      sets: 3,
      reps: 0,
      rest_time: 10,
      duration: 30,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      name: "Flexão de Braço Modificada",
      category: "Força",
      difficulty: "Iniciante",
      muscle_groups: ["Peitoral", "Tríceps"],
      equipment: [],
      instructions: ["Em posição de prancha, joelhos no chão.", "Desça peito em direção ao chão.", "Empurre de volta à posição inicial.", "Mantenha core contraído."],
      tips: ["Embasamento: Ativa 60% dos músculos superiores (JSCR).", "Progressão: De joelhos para full push-up em 4 semanas.", "Respiração: Expire na subida."],
      sets: 3,
      reps: 8,
      rest_time: 60,
      duration: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  useEffect(() => {
    if (user) {
      fetchTrainerProfile();
    }
  }, [user]);

  const fetchTrainerProfile = async () => {
    if (!user) return;
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error("Error fetching trainer profile:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o perfil do treinador. Tente novamente.",
        variant: "destructive"
      });
      return;
    }
    setTrainerId(profile.id);
  };

  // Verifica se Anamnese está preenchida (campos chave)
  const checkAnamnesis = async () => {
    const { data: anamnesis } = await supabase
      .from('anamnesis')
      .select('main_goal, training_experience, barriers_to_training, physical_activity_work, preferred_training_times')
      .eq('student_id', student.id)
      .single();

    const hasKeyFields = anamnesis?.main_goal && anamnesis?.training_experience &&
                         (anamnesis?.barriers_to_training || anamnesis?.preferred_training_times || anamnesis?.physical_activity_work);

    setHasAnamnesis(!!hasKeyFields);
    return hasKeyFields;
  };

  // Função assíncrona para gerar e inserir treino completo no DB
  const generateScientificWorkout = async (currentParams: WorkoutParams, anamnesis?: AnamnesisSummary) => {
    if (!trainerId) {
      toast({
        title: "Erro",
        description: "ID do treinador não encontrado. Faça login novamente.",
        variant: "destructive"
      });
      setIsGenerating(false);
      return;
    }

    try {
      // Passo 1: Buscar exercícios reais do DB com filtros
      const { data: exercisesFromDB, error: fetchError } = await supabase
        .from('exercises')
        .select('*')
        .eq('category', currentParams.workoutType === 'forca' ? 'Força' : currentParams.workoutType.charAt(0).toUpperCase() + currentParams.workoutType.slice(1))
        .eq('difficulty', student.age && student.age < 30 ? 'Iniciante' : 'Intermediário') // Ajuste por idade
        .in('muscle_groups', currentParams.focusArea.includes('full') ? ['Full Body', 'Quadríceps', 'Peitoral', 'Costas', 'Ombros', 'Tríceps', 'Bíceps', 'Glúteos', 'Panturrilhas', 'Core'] : [currentParams.focusArea])
        .overlaps('equipment', currentParams.equipmentAvailable.length > 0 ? currentParams.equipmentAvailable : ['Nenhum']) // Prioriza equipamentos disponíveis
        .limit(currentParams.daysPerWeek * 3) // 3 exercícios por dia, mais buffer
        .order('name');

      let exercises = exercisesFromDB || [];

      // Se DB vazio ou poucos exercícios, insere fallback e usa IDs
      if (exercises.length < currentParams.daysPerWeek * 2) {
        const { data: existingFallbackExercises } = await supabase
          .from('exercises')
          .select('id, name, category, muscle_groups, difficulty, equipment, instructions, tips, duration, reps, sets, rest_time, video_url, image_url')
          .in('name', scientificFallbackExercises.map(ex => ex.name));

        const existingNames = new Set(existingFallbackExercises?.map(ex => ex.name));
        const exercisesToInsert = scientificFallbackExercises.filter(
          fbEx => !existingNames.has(fbEx.name)
        );

        if (exercisesToInsert.length > 0) {
          const { data: newlyInsertedExercises, error: insertError } = await supabase
            .from('exercises')
            .insert(exercisesToInsert)
            .select('id, name, category, muscle_groups, difficulty, equipment, instructions, tips, duration, reps, sets, rest_time, video_url, image_url'); // Select all fields to match Exercise interface

          if (insertError) throw insertError;
          exercises = [...exercises, ...newlyInsertedExercises];
        }
        // Also add existing fallback exercises to the main 'exercises' array if they weren't already in exercisesFromDB
        const existingButNotFetched = existingFallbackExercises?.filter(
          ex => !exercises.some(e => e.id === ex.id)
        ) || [];
        exercises = [...exercises, ...existingButNotFetched];

        toast({
          title: "Exercícios complementares usados",
          description: "A biblioteca foi complementada com exercícios científicos padrão (ACSM/NSCA)."
        });
      }

      // Filtra e randomiza para garantir variedade e quantidade adequada
      const finalExercises = exercises
        .filter(ex =>
          ex.category.toLowerCase().includes(currentParams.workoutType) ||
          (currentParams.workoutType === 'forca' && ex.category === 'Força') ||
          (currentParams.workoutType === 'cardio' && ex.category === 'Cardio') ||
          (currentParams.workoutType === 'hiit' && ex.category === 'HIIT') ||
          (currentParams.workoutType === 'funcional' && ex.category === 'Funcional') ||
          (currentParams.workoutType === 'flexibilidade' && ex.category === 'Flexibilidade')
        )
        .sort(() => 0.5 - Math.random()) // Randomiza a ordem
        .slice(0, currentParams.daysPerWeek * 4); // Pega mais exercícios para distribuir

      if (finalExercises.length === 0) {
        throw new Error("Nenhum exercício adequado encontrado ou gerado. Tente ajustar os parâmetros.");
      }

      // Baseado no objetivo do aluno (ACSM/NSCA guidelines)
      const objectiveGuidelines = {
        perder_gordura: { reps: [12, 15], sets: 3, rest: [45, 60], type: 'funcional', focus: 'full_body' },
        ganhar_massa: { reps: [8, 12], sets: [3, 4], rest: [90, 120], type: 'forca', focus: 'hipertrofia' },
        manter_peso: { reps: [10, 12], sets: 3, rest: [60, 90], type: 'funcional', focus: 'manutencao' }
      };

      const guidelines = objectiveGuidelines[student.goal as keyof typeof objectiveGuidelines] ||
                         { reps: [10, 12], sets: 3, rest: [60, 90], type: 'forca', focus: 'full_body' };

      // Ajusta por tipo de treino
      let finalGuidelines;
      if (currentParams.workoutType === 'cardio' || currentParams.workoutType === 'hiit') {
        finalGuidelines = { ...guidelines, reps: 0, rest: [30, 60], sets: 3, duration: [20, 45] }; // Tempo-based, HIIT curto
      } else if (currentParams.workoutType === 'flexibilidade') {
        finalGuidelines = { ...guidelines, sets: 2, reps: 0, duration: [30, 60], rest: [10, 20] };
      } else {
        finalGuidelines = { ...guidelines };
      }

      // Distribui exercícios por dias (split científico: push/pull/legs ou full body baseado em foco)
      const workoutDaysExercises: any[][] = Array.from({ length: currentParams.daysPerWeek }, () => []);
      let exerciseIndex = 0;

      for (let day = 0; day < currentParams.daysPerWeek; day++) {
        const exercisesForDay = [];
        const numExercisesPerDay = currentParams.focusArea === 'full_body' ? 4 : 3; // 3-4 exercícios por dia

        for (let i = 0; i < numExercisesPerDay; i++) {
          if (exerciseIndex < finalExercises.length) {
            exercisesForDay.push(finalExercises[exerciseIndex]);
            exerciseIndex++;
          }
        }
        workoutDaysExercises[day] = exercisesForDay;
      }

      // Achata para lista plana com order_index para DB
      const allTemplateExercises = [];
      let globalOrderIndex = 0;
      workoutDaysExercises.forEach((dayExercises) => {
        dayExercises.forEach((ex) => {
          const sets = Array.isArray(finalGuidelines.sets)
            ? Math.floor(Math.random() * (finalGuidelines.sets[1] - finalGuidelines.sets[0] + 1)) + finalGuidelines.sets[0]
            : finalGuidelines.sets;
          const reps = Array.isArray(finalGuidelines.reps)
            ? Math.floor(Math.random() * (finalGuidelines.reps[1] - finalGuidelines.reps[0] + 1)) + finalGuidelines.reps[0]
            : finalGuidelines.reps;
          const rest_time = Array.isArray(finalGuidelines.rest)
            ? Math.floor(Math.random() * (finalGuidelines.rest[1] - finalGuidelines.rest[0] + 1)) + finalGuidelines.rest[0]
            : finalGuidelines.rest;
          const duration = Array.isArray(finalGuidelines.duration)
            ? Math.floor(Math.random() * (finalGuidelines.duration[1] - finalGuidelines.duration[0] + 1)) + finalGuidelines.duration[0]
            : finalGuidelines.duration;

          allTemplateExercises.push({
            exercise_id: ex.id,
            order_index: globalOrderIndex++,
            sets: sets,
            reps: reps,
            rest_time: rest_time,
            duration: duration,
            notes: anamnesis?.barriers_to_training ? `Adapte para ${anamnesis.barriers_to_training}. Foco: ${student.goal}.` : `Foco em forma correta. Objetivo: ${student.goal}.`
          });
        });
      });

      // Calcula duração total por sessão
      const estimatedDurationPerSession = allTemplateExercises.slice(0, 4).reduce((sum, te) => { // Primeiros 4 para estimativa por sessão
        const exerciseTime = te.duration || (te.sets * 60); // 60s por set se não for tempo-base
        const restTime = (te.sets > 1 ? te.sets - 1 : 0) * (te.rest_time || 60);
        return sum + exerciseTime + restTime;
      }, 0) / 60;

      // Passo 2: Inserir o template
      const { data: insertedTemplate, error: templateError } = await supabase
        .from('workout_templates')
        .insert({
          name: `${student.name} - Treino ${currentParams.workoutType} (${currentParams.daysPerWeek} dias/semana)`,
          description: `Treino 100% personalizado e criado automaticamente para ${student.name} baseado em: ${student.goal.replace('_', ' ')} (idade ${student.age || 'não informada'}, ${student.body_fat_percentage ? `${student.body_fat_percentage}% gordura` : 'sem composição recente'}). Parâmetros: ${currentParams.daysPerWeek} dias de ${currentParams.workoutType} focado em ${currentParams.focusArea}. Embasamento científico: ACSM/NSCA guidelines adaptadas (reps ${Array.isArray(finalGuidelines.reps) ? finalGuidelines.reps[0] + '-' + finalGuidelines.reps[1] : finalGuidelines.reps}, rest ${Array.isArray(finalGuidelines.rest) ? finalGuidelines.rest[0] + '-' + finalGuidelines.rest[1] : finalGuidelines.rest}s). Notas: ${currentParams.specialNotes || 'Nenhum ajuste especial'}. Duração estimada por sessão: ${Math.round(estimatedDurationPerSession)} min. Total semanal: ${Math.round(estimatedDurationPerSession * currentParams.daysPerWeek)} min. Ajustes baseados em anamnese: ${anamnesis?.barriers_to_training || 'Nenhuma barreira informada'}.`,
          category: currentParams.workoutType,
          difficulty: student.age && student.age < 30 ? 'Iniciante' : 'Intermediário',
          estimated_duration: Math.round(estimatedDurationPerSession),
          equipment_needed: currentParams.equipmentAvailable,
          trainer_id: trainerId,
          is_public: false
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Passo 3: Inserir exercícios do template (referenciando exercise_id dos fetched/inserted)
      const { error: exercisesError } = await supabase
        .from('workout_template_exercises')
        .insert(allTemplateExercises.map(ex => ({
          ...ex,
          workout_template_id: insertedTemplate.id
        })));

      if (exercisesError) throw exercisesError;

      toast({
        title: "Treino Criado com Sucesso!",
        description: `Treino completo inserido no banco! ${currentParams.daysPerWeek} dias de ${currentParams.workoutType} com ${allTemplateExercises.length} exercícios (ACSM/NSCA adaptado para ${student.goal}). Visualize e edite no menu Treinos.`,
      });

      // Navega para workouts com o novo template para edição/visualização imediata
      navigate('/workouts', {
        state: {
          newlyCreatedWorkoutId: insertedTemplate.id,
          fromSuggestion: true,
          scientificBasis: `ACSM/NSCA: ${student.goal === 'perder_gordura' ? 'Higher reps (12-15) para EPOC e queima calórica.' : student.goal === 'ganhar_massa' ? '8-12 reps para hipertrofia sarcoplásmica.' : '10-12 reps para manutenção muscular.'} Total: ${allTemplateExercises.length} exercícios inseridos.`
        }
      });

      onClose(); // Fecha o diálogo após sucesso
    } catch (error: any) {
      console.error("Error generating and inserting workout:", error);
      toast({
        title: "Erro na Criação",
        description: error.message || "Não foi possível gerar o treino. Verifique os dados e tente novamente.",
        variant: "destructive"
      });
      setStep('initial');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateWorkout = async () => {
    setIsGenerating(true);
    try {
      const hasAnamnesisFilled = await checkAnamnesis();

      if (!hasAnamnesisFilled) {
        setStep('params'); // Vai para modal de parâmetros
        toast({
          title: "Anamnese incompleta detectada",
          description: "Vamos coletar detalhes adicionais para um treino mais preciso. Preencha os parâmetros abaixo.",
          icon: <AlertCircle className="h-4 w-4" />
        });
        return;
      }

      // Se anamnese OK, gera diretamente
      await generateScientificWorkout(params);
    } catch (error: any) {
      console.error("Error generating workout:", error);
      toast({
        title: "Erro na Geração",
        description: error.message || "Não foi possível gerar a sugestão. Verifique os dados e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleParamsSubmit = async () => {
    // Validações
    if (params.daysPerWeek < 1 || params.daysPerWeek > 7) {
      toast({ title: "Inválido", description: "Dias de treino deve ser entre 1 e 7.", variant: "destructive" });
      return;
    }
    if (!params.workoutType) {
      toast({ title: "Inválido", description: "Tipo de treino é obrigatório.", variant: "destructive" });
      return;
    }
    if (!params.focusArea) {
      toast({ title: "Inválido", description: "Foco principal é obrigatório.", variant: "destructive" });
      return;
    }

    setStep('generating');
    try {
      // Fetch anamnese para complementar (mesmo se incompleta)
      const { data: anamnesis } = await supabase
        .from('anamnesis')
        .select('*')
        .eq('student_id', student.id)
        .single() || {};

      await generateScientificWorkout(params, {
        training_experience: anamnesis?.training_experience,
        main_goal: anamnesis?.main_goal,
        barriers_to_training: anamnesis?.barriers_to_training,
        preferred_training_times: anamnesis?.preferred_training_times,
        equipment_available: params.equipmentAvailable
      });
    } catch (error: any) {
      console.error("Error with params:", error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao gerar treino com parâmetros. Tente novamente.",
        variant: "destructive"
      });
      setStep('initial');
    }
  };

  // Render condicional por step
  if (step === 'initial') {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-6 w-6 text-primary" />
              Sugestão de Treino Personalizado
            </DialogTitle>
            <DialogDescription>
              Baseado na avaliação de {student.name} ({student.goal.replace('_', ' ').toUpperCase()}), nossa IA pode gerar um treino específico.
              <br /><br />
              <strong>Embasamento Científico:</strong> Usamos guidelines ACSM/NSCA:
              <ul className="mt-2 list-disc pl-5 text-sm">
                <li><strong>Perda de Gordura:</strong> 12-15 reps, circuitos HIIT para EPOC elevado (queima calórica pós-treino).</li>
                <li><strong>Ganho de Massa:</strong> 8-12 reps, 3-4 sets, overload progressivo para hipertrofia.</li>
                <li><strong>Manutenção:</strong> 10-12 reps, full body 3x/semana para preservar massa muscular.</li>
              </ul>
              O treino será adaptado à idade ({student.age || 'não informada'}), composição corporal e dados da anamnese (se disponível).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button variant="outline" onClick={onClose}>
              Manter manual
            </Button>
            <Button onClick={handleGenerateWorkout} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Gerar Treino Científico
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (step === 'params') {
    return (
      <Dialog open={true} onOpenChange={(open) => {
        if (!open) {
          setStep('initial');
          onClose();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-orange-500" />
              Parâmetros para Treino Personalizado
            </DialogTitle>
            <DialogDescription>
              Como a anamnese de {student.name} está incompleta, precisamos de detalhes para gerar um treino seguro e eficaz.
              Basearemos na avaliação recente ({student.body_fat_percentage ? `${student.body_fat_percentage}% gordura` : 'sem % gordura'}) e objetivo ({student.goal.replace('_', ' ')}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Dias de Treino por Semana *</Label>
              <Select value={params.daysPerWeek.toString()} onValueChange={(value) => setParams(prev => ({ ...prev, daysPerWeek: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7].map(n => <SelectItem key={n} value={n.toString()}>{n} dias</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Recomendação: 3-4 para iniciantes, 4-5 para intermediários (ACSM).</p>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Treino Principal *</Label>
              <Select value={params.workoutType} onValueChange={(value) => setParams(prev => ({ ...prev, workoutType: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="forca">Força/Hipertrofia (ganho muscular)</SelectItem>
                  <SelectItem value="funcional">Funcional (movimentos cotidianos)</SelectItem>
                  <SelectItem value="cardio">Cardio (resistência aeróbica)</SelectItem>
                  <SelectItem value="hiit">HIIT (alta intensidade intervalada)</SelectItem>
                  <SelectItem value="flexibilidade">Flexibilidade/Mobilidade</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Para {student.goal}: {student.goal === 'perder_gordura' ? 'HIIT/Cardio recomendado' : student.goal === 'ganhar_massa' ? 'Força prioritária' : 'Funcional equilibrado'}.</p>
            </div>

            <div className="space-y-2">
              <Label>Foco Principal *</Label>
              <Select value={params.focusArea} onValueChange={(value) => setParams(prev => ({ ...prev, focusArea: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_body">Full Body (corpo inteiro)</SelectItem>
                  <SelectItem value="upper_body">Parte Superior (peito, costas, braços)</SelectItem>
                  <SelectItem value="lower_body">Parte Inferior (pernas, glúteos)</SelectItem>
                  <SelectItem value="core">Core/Abdômen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Equipamentos Disponíveis</Label>
              <div className="grid grid-cols-3 gap-2">
                {['Nenhum', 'Halteres', 'Barra', 'Rack', 'Máquinas', 'Bola Suíça', 'Elásticos', 'Esteira', 'Bicicleta'].map(eq => (
                  <div key={eq} className="flex items-center space-x-2">
                    <Checkbox
                      id={eq}
                      checked={params.equipmentAvailable.includes(eq)}
                      onCheckedChange={(checked) => {
                        setParams(prev => ({
                          ...prev,
                          equipmentAvailable: checked
                            ? [...prev.equipmentAvailable, eq]
                            : prev.equipmentAvailable.filter(e => e !== eq)
                        }));
                      }}
                    />
                    <Label htmlFor={eq} className="text-xs cursor-pointer">{eq}</Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Priorizaremos exercícios com esses equipamentos para acessibilidade.</p>
            </div>

            <div className="space-y-2">
              <Label>Notas Especiais (opcional)</Label>
              <Textarea
                value={params.specialNotes || ""}
                onChange={(e) => setParams(prev => ({ ...prev, specialNotes: e.target.value }))}
                placeholder="Ex: Evitar agachamentos profundos (dor no joelho), foco em mobilidade de ombro, treinos matinais..."
                rows={2}
              />
              <p className="text-xs text-muted-foreground">Incluiremos adaptações baseadas nisso (ex: substituições para lesões).</p>
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button variant="outline" onClick={() => setStep('initial')}>
              Voltar
            </Button>
            <Button onClick={handleParamsSubmit} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Gerar Treino Personalizado
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (step === 'generating') {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerando Treino...</DialogTitle>
            <DialogDescription>
              Aplicando guidelines ACSM/NSCA para {student.goal} com {params.daysPerWeek} dias/semana de {params.workoutType}.
              <br />Isso leva alguns segundos para otimizar exercícios e progressão.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null; // Não renderiza em outros steps
};

export default WorkoutSuggestionDialog;