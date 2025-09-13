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
  const [trainerId, setTrainerId] = useState<string | null>(null);

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
      video_url: "https://www.youtube.com/watch?v=Dy28pQ_4yJg",
      image_url: ""
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
      video_url: "https://www.youtube.com/watch?v=dZgVxmf6C28",
      image_url: ""
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
      video_url: "https://www.youtube.com/watch?v=YyG_Q_21_1c",
      image_url: ""
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
      video_url: "https://www.youtube.com/watch?v=pYj82L-g_1Q",
      image_url: ""
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
      video_url: "https://www.youtube.com/watch?v=N_Y_Y_Y_Y_Y", // Placeholder
      image_url: ""
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
      video_url: "https://www.youtube.com/watch?v=SUJ_Y_Y_Y_Y", // Placeholder
      image_url: ""
    },
    {
      name: "Afundo com Halteres",
      category: "Força",
      difficulty: "Intermediário",
      muscle_groups: ["Quadríceps", "Glúteos", "Isquiotibiais"],
      equipment: ["Halteres"],
      instructions: ["Segure um halter em cada mão, braços estendidos ao lado do corpo.", "Dê um passo à frente com uma perna, flexionando ambos os joelhos a 90 graus.", "Mantenha o tronco ereto e o joelho de trás quase tocando o chão.", "Impulsione-se de volta à posição inicial e alterne as pernas."],
      tips: ["Embasamento: Excelente para desenvolvimento unilateral de pernas e glúteos.", "Foco: Mantenha o equilíbrio e a estabilidade do core.", "Variação: Pode ser feito sem halteres para iniciantes."],
      sets: 3,
      reps: 10,
      rest_time: 60,
      duration: 0,
      video_url: "https://www.youtube.com/watch?v=Dy28pQ_4yJg", // Placeholder
      image_url: ""
    },
    {
      name: "Desenvolvimento de Ombros com Halteres",
      category: "Força",
      difficulty: "Intermediário",
      muscle_groups: ["Ombros", "Tríceps"],
      equipment: ["Halteres", "Banco"],
      instructions: ["Sente-se em um banco com encosto, segurando um halter em cada mão na altura dos ombros, palmas para frente.", "Empurre os halteres para cima até que os braços estejam quase estendidos, sem travar os cotovelos.", "Abaixe os halteres de forma controlada até a posição inicial."],
      tips: ["Embasamento: Fortalece os deltoides, importante para a saúde dos ombros.", "Foco: Mantenha o core contraído para estabilizar a coluna.", "Segurança: Não use pesos excessivos para evitar lesões no ombro."],
      sets: 3,
      reps: 10,
      rest_time: 90,
      duration: 0,
      video_url: "https://www.youtube.com/watch?v=Dy28pQ_4yJg", // Placeholder
      image_url: ""
    },
    {
      name: "Remada Curvada com Barra",
      category: "Força",
      difficulty: "Avançado",
      muscle_groups: ["Costas", "Bíceps"],
      equipment: ["Barra"],
      instructions: ["Incline o tronco para frente, mantendo as costas retas e a barra pendurada com as mãos na largura dos ombros.", "Puxe a barra em direção ao abdômen, contraindo as escápulas.", "Abaixe a barra de forma controlada até a posição inicial."],
      tips: ["Embasamento: Um dos melhores exercícios para espessura das costas.", "Foco: Evite balançar o tronco, use apenas a força das costas e braços.", "Progressão: Aumente a carga gradualmente, mantendo a boa forma."],
      sets: 4,
      reps: 8,
      rest_time: 120,
      duration: 0,
      video_url: "https://www.youtube.com/watch?v=Dy28pQ_4yJg", // Placeholder
      image_url: ""
    },
    {
      name: "Flexão de Braço",
      category: "Força",
      difficulty: "Intermediário",
      muscle_groups: ["Peitoral", "Tríceps", "Ombros", "Core"],
      equipment: [],
      instructions: ["Comece em posição de prancha, mãos ligeiramente mais largas que os ombros.", "Abaixe o corpo flexionando os cotovelos até o peito quase tocar o chão.", "Empurre o chão para retornar à posição inicial, estendendo os braços completamente.", "Mantenha o corpo reto e o core engajado durante todo o movimento."],
      tips: ["Embasamento: Exercício composto que trabalha múltiplos grupos musculares.", "Foco: Mantenha a forma correta para maximizar a ativação muscular e evitar lesões.", "Variação: Para maior dificuldade, eleve os pés; para menor, apoie os joelhos."],
      sets: 3,
      reps: 12,
      rest_time: 60,
      duration: 0,
      video_url: "https://www.youtube.com/watch?v=IODxDxX7oi4",
      image_url: ""
    },
    {
      name: "Corrida na Esteira",
      category: "Cardio",
      difficulty: "Iniciante",
      muscle_groups: ["Cardiovascular", "Pernas"],
      equipment: ["Esteira"],
      instructions: ["Ajuste a velocidade e inclinação da esteira para um ritmo confortável.", "Comece caminhando e aumente gradualmente para uma corrida leve.", "Mantenha uma postura ereta, braços balançando naturalmente e olhar para frente.", "Monitore sua frequência cardíaca e respiração."],
      tips: ["Embasamento: Melhora a saúde cardiovascular e a resistência aeróbica.", "Foco: Mantenha um ritmo constante e respire profundamente.", "Progressão: Aumente a duração, velocidade ou inclinação ao longo do tempo."],
      sets: 1,
      reps: 0,
      rest_time: 0,
      duration: 30 * 60, // 30 minutes in seconds
      video_url: "https://www.youtube.com/watch?v=Dy28pQ_4yJg", // Placeholder
      image_url: ""
    },
    {
      name: "Caminhada Rápida",
      category: "Cardio",
      difficulty: "Iniciante",
      muscle_groups: ["Cardiovascular", "Pernas"],
      equipment: [],
      instructions: ["Comece com um aquecimento leve de 5 minutos.", "Mantenha um ritmo acelerado que eleve sua frequência cardíaca e respiração, mas que ainda permita conversar.", "Use um bom calçado e mantenha uma postura ereta.", "Termine com um desaquecimento de 5 minutos."],
      tips: ["Embasamento: Ótima opção de baixo impacto para iniciantes e recuperação ativa.", "Foco: Mantenha um passo firme e use os braços para impulsionar.", "Progressão: Aumente a distância ou adicione inclinações."],
      sets: 1,
      reps: 0,
      rest_time: 0,
      duration: 40 * 60, // 40 minutes in seconds
      video_url: "https://www.youtube.com/watch?v=Dy28pQ_4yJg", // Placeholder
      image_url: ""
    },
    {
      name: "Pular Corda",
      category: "HIIT/Cardio",
      difficulty: "Intermediário",
      muscle_groups: ["Cardiovascular", "Pernas", "Ombros"],
      equipment: ["Corda de pular"],
      instructions: ["Segure as alças da corda, com os cotovelos próximos ao corpo.", "Gire a corda usando os punhos e salte levemente sobre as pontas dos pés.", "Mantenha um ritmo constante e aterrissagem suave.", "Varie os saltos (pés juntos, alternados, etc.)."],
      tips: ["Embasamento: Excelente para coordenação, agilidade e queima calórica intensa.", "Foco: Mantenha o core engajado e os ombros relaxados.", "Progressão: Aumente a duração dos intervalos de salto e diminua o descanso."],
      sets: 5, // Number of intervals
      reps: 0,
      rest_time: 30, // Rest between intervals
      duration: 60, // Duration of each interval in seconds
      video_url: "https://www.youtube.com/watch?v=Dy28pQ_4yJg", // Placeholder
      image_url: ""
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
        .ilike('category', `%${currentParams.workoutType === 'forca' ? 'Força' : currentParams.workoutType.charAt(0).toUpperCase() + currentParams.workoutType.slice(1)}%`)
        .in('difficulty', ['Iniciante', 'Intermediário', 'Avançado']) // Fetch all difficulties
        .limit(50) // Fetch more to ensure variety
        .order('name');

      let exercises = exercisesFromDB || [];

      // Se DB vazio ou poucos exercícios, insere fallback e usa IDs
      if (exercises.length < 20) { // Threshold for fallback
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
            .select('id, name, category, muscle_groups, difficulty, equipment, instructions, tips, duration, reps, sets, rest_time, video_url, image_url');

          if (insertError) throw insertError;
          exercises = [...exercises, ...newlyInsertedExercises];
        }
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
      const filteredByParams = exercises.filter(ex => {
        const matchesCategory = ex.category.toLowerCase().includes(currentParams.workoutType) ||
                                (currentParams.workoutType === 'forca' && ex.category === 'Força') ||
                                (currentParams.workoutType === 'cardio' && ex.category === 'Cardio') ||
                                (currentParams.workoutType === 'hiit' && ex.category === 'HIIT') ||
                                (currentParams.workoutType === 'funcional' && ex.category === 'Funcional') ||
                                (currentParams.workoutType === 'flexibilidade' && ex.category === 'Flexibilidade');
        
        const matchesFocus = currentParams.focusArea === 'full_body' || ex.muscle_groups.some(mg => mg.toLowerCase().includes(currentParams.focusArea.toLowerCase()));
        
        const matchesEquipment = currentParams.equipmentAvailable.length === 0 || currentParams.equipmentAvailable.includes('Nenhum') || ex.equipment.some(eq => currentParams.equipmentAvailable.includes(eq));

        return matchesCategory && matchesFocus && matchesEquipment;
      }).sort(() => 0.5 - Math.random()); // Randomiza a ordem

      if (filteredByParams.length === 0) {
        throw new Error("Nenhum exercício adequado encontrado ou gerado. Tente ajustar os parâmetros.");
      }

      // Baseado no objetivo do aluno (ACSM/NSCA guidelines)
      const objectiveGuidelines = {
        perder_gordura: { reps: [12, 15], sets: 3, rest: [45, 60], type: 'funcional', focus: 'full_body', numExercises: 5 },
        ganhar_massa: { reps: [8, 12], sets: [3, 4], rest: [90, 120], type: 'forca', focus: 'hipertrofia', numExercises: 4 },
        manter_peso: { reps: [10, 12], sets: 3, rest: [60, 90], type: 'funcional', focus: 'manutencao', numExercises: 5 }
      };

      const guidelines = objectiveGuidelines[student.goal as keyof typeof objectiveGuidelines] ||
                         { reps: [10, 12], sets: 3, rest: [60, 90], type: 'forca', focus: 'full_body', numExercises: 4 };

      let finalGuidelines;
      if (currentParams.workoutType === 'cardio' || currentParams.workoutType === 'hiit') {
        finalGuidelines = { ...guidelines, reps: 0, rest: [30, 60], sets: 1, duration: [20 * 60, 45 * 60], numExercises: 1 }; // Duration in seconds
      } else if (currentParams.workoutType === 'flexibilidade') {
        finalGuidelines = { ...guidelines, sets: 2, reps: 0, duration: [30, 60], rest: [10, 20], numExercises: 3 }; // Duration in seconds for each stretch
      } else {
        finalGuidelines = { ...guidelines, numExercises: currentParams.focusArea === 'full_body' ? 5 : 4 }; // 4-5 exercises per session
      }

      const daysOfWeek = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
      const createdWorkoutIds: string[] = [];

      for (let dayIndex = 0; dayIndex < currentParams.daysPerWeek; dayIndex++) {
        const dayName = daysOfWeek[dayIndex];
        const exercisesForThisDay = filteredByParams
          .slice(dayIndex * finalGuidelines.numExercises, (dayIndex + 1) * finalGuidelines.numExercises);
        
        if (exercisesForThisDay.length === 0) {
          // If not enough unique exercises, reuse or throw error
          throw new Error(`Não há exercícios suficientes para ${currentParams.daysPerWeek} dias de treino com os parâmetros selecionados.`);
        }

        const allTemplateExercises = [];
        let globalOrderIndex = 0;

        let totalDurationSecondsForDay = 0;

        exercisesForThisDay.forEach((ex) => {
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

          // Calculate duration for this exercise
          if (currentParams.workoutType === 'cardio' || currentParams.workoutType === 'hiit' || currentParams.workoutType === 'flexibilidade') {
            totalDurationSecondsForDay += duration;
          } else {
            // For strength/functional: (sets * reps * time_per_rep) + (sets-1 * rest_time)
            totalDurationSecondsForDay += (sets * reps * 4) + ((sets > 1 ? sets - 1 : 0) * rest_time);
          }
        });

        const estimatedDurationPerSession = Math.round(totalDurationSecondsForDay / 60);

        // Passo 2: Inserir o template para o dia
        const { data: insertedTemplate, error: templateError } = await supabase
          .from('workout_templates')
          .insert({
            name: `${student.name} - Treino de ${dayName}`,
            description: `Treino personalizado para ${student.name} (${dayName}) baseado em: ${student.goal.replace('_', ' ')} (idade ${student.age || 'não informada'}, ${student.body_fat_percentage ? `${student.body_fat_percentage}% gordura` : 'sem composição recente'}). Tipo: ${currentParams.workoutType}, Foco: ${currentParams.focusArea}. Embasamento científico: ACSM/NSCA guidelines adaptadas. Notas: ${currentParams.specialNotes || 'Nenhum ajuste especial'}. Duração estimada: ${estimatedDurationPerSession} min. Ajustes baseados em anamnese: ${anamnesis?.barriers_to_training || 'Nenhuma barreira informada'}.`,
            category: currentParams.workoutType,
            difficulty: student.age && student.age < 30 ? 'Iniciante' : 'Intermediário',
            estimated_duration: estimatedDurationPerSession,
            equipment_needed: currentParams.equipmentAvailable,
            trainer_id: trainerId,
            is_public: false
          })
          .select()
          .single();

        if (templateError) throw templateError;
        createdWorkoutIds.push(insertedTemplate.id);

        // Passo 3: Inserir exercícios do template
        const { error: exercisesError } = await supabase
          .from('workout_template_exercises')
          .insert(allTemplateExercises.map(ex => ({
            ...ex,
            workout_template_id: insertedTemplate.id
          })));

        if (exercisesError) throw exercisesError;
      }

      toast({
        title: "Treinos Criados com Sucesso!",
        description: `${currentParams.daysPerWeek} treinos completos inseridos no banco! Visualize e edite no menu Treinos.`,
      });

      navigate('/workouts', {
        state: {
          newlyCreatedWorkoutIds: createdWorkoutIds,
          fromSuggestion: true,
          scientificBasis: `ACSM/NSCA: ${student.goal === 'perder_gordura' ? 'Higher reps (12-15) para EPOC e queima calórica.' : student.goal === 'ganhar_massa' ? '8-12 reps para hipertrofia sarcoplásmica.' : '10-12 reps para manutenção muscular.'} Total: ${createdWorkoutIds.length} treinos inseridos.`
        }
      });

      onClose();
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
        setStep('params');
        toast({
          title: "Anamnese incompleta detectada",
          description: "Vamos coletar detalhes adicionais para um treino mais preciso. Preencha os parâmetros abaixo.",
          icon: <AlertCircle className="h-4 w-4" />
        });
        return;
      }

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

  return null;
};

export default WorkoutSuggestionDialog;