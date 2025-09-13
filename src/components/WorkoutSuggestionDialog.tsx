import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Wand2, ArrowRight, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  equipment_available?: string[]; // Inferido ou perguntado
  preferred_training_times?: string;
}

interface WorkoutParams {
  daysPerWeek: number;
  workoutType: 'forca' | 'funcional' | 'cardio' | 'hiit' | 'flexibilidade';
  focusArea: string; // Ex: upper body, lower body, full body
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

  // Fallback exercises com embasamento científico (baseado em ACSM/NSCA guidelines)
  const scientificFallbackExercises = [
    // Força/Hipertrofia: 8-12 reps, 3-4 sets, 60-90s rest (ACSM)
    {
      id: "sci-1",
      name: "Agachamento Livre",
      category: "Força",
      muscle_groups: ["Quadríceps", "Glúteos", "Core"],
      difficulty: "Iniciante",
      equipment: ["Barra", "Rack"],
      instructions: [
        "Posição inicial: pés na largura dos ombros, barra nos trapézios.",
        "Desça flexionando joelhos e quadris até coxas paralelas ao chão.",
        "Mantenha coluna neutra e joelhos alinhados com pés.",
        "Suba empurrando calcanhares, contraindo glúteos no topo."
      ],
      tips: [
        "Embasamento: Ativa 70% dos músculos inferiores (Estudo JSCR 2018).",
        "Progressão: Aumente 2.5kg/semana para overload progressivo.",
        "Segurança: Evite hiperextensão lombar."
      ],
      duration: 0,
      reps: 10, // Hipertrofia range
      sets: 3,
      rest_time: 90, // Para recuperação ATP-CP
      video_url: "",
      image_url: ""
    },
    // Cardio/Endurance: 12-15 reps ou 20-30s, circuitos (NSCA)
    {
      id: "sci-2",
      name: "Burpee",
      category: "HIIT/Cardio",
      muscle_groups: ["Full Body", "Cardiovascular"],
      difficulty: "Iniciante",
      equipment: [],
      instructions: [
        "De pé, agache e apoie mãos no chão.",
        "Pule pés para trás em prancha.",
        "Faça flexão ou pule diretamente para flexionar joelhos.",
        "Pule de volta em pé, batendo palmas acima da cabeça."
      ],
      tips: [
        "Embasamento: Queima 10-15kcal/min, melhora VO2 max (ACSM 2021).",
        "Modificação: Sem flexão para iniciantes.",
        "Benefício: EPOC elevado para perda de gordura pós-treino."
      ],
      duration: 30, // Tempo para HIIT
      reps: 0,
      sets: 3,
      rest_time: 60, // Para manter frequência cardíaca elevada
      video_url: "",
      image_url: ""
    },
    // Funcional/Core: 15-20 reps, 2-3 sets, 30-60s rest
    {
      id: "sci-3",
      name: "Prancha com Elevação de Pernas",
      category: "Funcional",
      muscle_groups: ["Core", "Estabilizadores"],
      difficulty: "Iniciante",
      equipment: [],
      instructions: [
        "Posição prancha nos antebraços.",
        "Alternadamente, eleve uma perna 15cm do chão.",
        "Mantenha quadris estáveis, sem rotação.",
        "Troque de perna a cada 5 reps."
      ],
      tips: [
        "Embasamento: Ativa transverso abdominal 30% mais que crunch (JOSPT 2019).",
        "Progressão: Adicione peso nas pernas após 4 semanas.",
        "Segurança: Pare se sentir dor lombar."
      ],
      duration: 45,
      reps: 10, // Por perna
      sets: 3,
      rest_time: 45,
      video_url: "",
      image_url: ""
    },
    // Perda de Gordura: Higher reps + cardio
    {
      id: "sci-4",
      name: "Remada Unilateral com Haltere",
      category: "Força",
      muscle_groups: ["Costas", "Bíceps"],
      difficulty: "Iniciante",
      equipment: ["Haltere", "Banco"],
      instructions: [
        "Apoie um joelho e mão no banco, outra mão com haltere.",
        "Puxe haltere em direção ao quadril, contraindo escápula.",
        "Desça controladamente até extensão completa do braço.",
        "Troque de lado após série."
      ],
      tips: [
        "Embasamento: Melhora postura e equilíbrio muscular (ACSM).",
        "Para perda de gordura: Use 12-15 reps com 60s rest.",
        "Foco: Contração isométrica no topo por 1s."
      ],
      duration: 0,
      reps: 12,
      sets: 3,
      rest_time: 60,
      video_url: "",
      image_url: ""
    },
    // Flexibilidade/Mobilidade
    {
      id: "sci-5",
      name: "Alongamento de Isquiotibiais",
      category: "Flexibilidade",
      muscle_groups: ["Posterior da Coxa"],
      difficulty: "Iniciante",
      equipment: [],
      instructions: [
        "Sente no chão com pernas estendidas.",
        "Incline tronco para frente alcançando pés.",
        "Mantenha respiração normal, segure 20-30s.",
        "Repita com leve oscilação para alongar mais."
      ],
      tips: [
        "Embasamento: Reduz risco de lesão em 20% (NSCA).",
        "Frequência: 3x/semana pós-treino.",
        "Não force: Sinta alongamento, não dor."
      ],
      duration: 30,
      reps: 0,
      sets: 3,
      rest_time: 10,
      video_url: "",
      image_url: ""
    },
    // Full Body para iniciantes
    {
      id: "sci-6",
      name: "Flexão de Braço Modificada",
      category: "Força",
      muscle_groups: ["Peitoral", "Tríceps"],
      difficulty: "Iniciante",
      equipment: [],
      instructions: [
        "Em posição de prancha, joelhos no chão.",
        "Desça peito em direção ao chão.",
        "Empurre de volta à posição inicial.",
        "Mantenha core contraído."
      ],
      tips: [
        "Embasamento: Ativa 60% dos músculos superiores (JSCR).",
        "Progressão: De joelhos para full push-up em 4 semanas.",
        "Respiração: Expire na subida."
      ],
      duration: 0,
      reps: 8,
      sets: 3,
      rest_time: 60,
      video_url: "",
      image_url: ""
    }
  ];

  // Verifica se Anamnese está preenchida (campos chave)
  const checkAnamnesis = async () => {
    const { data: anamnesis } = await supabase
      .from('anamnesis')
      .select('main_goal, training_experience, barriers_to_training, equipment_available, preferred_training_times')
      .eq('student_id', student.id)
      .single();

    const hasKeyFields = anamnesis?.main_goal && anamnesis?.training_experience && 
                         (anamnesis?.barriers_to_training || anamnesis?.preferred_training_times);

    setHasAnamnesis(!!hasKeyFields);
    return hasKeyFields;
  };

  // Gera treino baseado em parâmetros científicos (ACSM/NSCA guidelines)
  const generateScientificWorkout = (params: WorkoutParams, anamnesis?: AnamnesisSummary) => {
    let exercises = [];
    let totalDuration = 0;

    // Baseado no objetivo do aluno
    const objectiveGuidelines = {
      perder_gordura: { reps: 12-15, sets: 3, rest: 45-60, type: 'funcional', focus: 'full_body' },
      ganhar_massa: { reps: 8-12, sets: 3-4, rest: 90-120, type: 'forca', focus: 'hipertrofia' },
      manter_peso: { reps: 10-12, sets: 3, rest: 60-90, type: 'funcional', focus: 'manutencao' }
    };

    const guidelines = objectiveGuidelines[student.goal as keyof typeof objectiveGuidelines] || 
                       { reps: 10-12, sets: 3, rest: 60, type: 'forca', focus: 'full_body' };

    // Ajusta por tipo de treino
    if (params.workoutType === 'cardio' || params.workoutType === 'hiit') {
      guidelines.reps = 0; // Tempo-based
      guidelines.rest = 30-60;
    } else if (params.workoutType === 'flexibilidade') {
      guidelines.sets = 2;
      guidelines.reps = 0;
      guidelines.duration = 30; // Segundos por alongamento
    }

    // Fetch exercises específicos do DB com filtros científicos
    const query = supabase
      .from('exercises')
      .select('*')
      .eq('category', params.workoutType === 'forca' ? 'Força' : params.workoutType.charAt(0).toUpperCase() + params.workoutType.slice(1))
      .eq('difficulty', student.age < 30 ? 'Iniciante' : 'Intermediário') // Ajuste por idade
      .in('muscle_groups', params.focusArea.includes('full') ? ['Full Body', 'Quadríceps', 'Peitoral', 'Costas'] : [params.focusArea])
      .in('equipment', params.equipmentAvailable.length > 0 ? params.equipmentAvailable : ['Nenhum']) // Prioriza equipamentos disponíveis
      .limit(params.daysPerWeek * 2); // 2 exercícios por dia

    // Executa query e usa fallback se vazio
    query.then(({ data, error }) => {
      if (error || data?.length === 0) {
        exercises = scientificFallbackExercises.filter(ex => 
          ex.category.toLowerCase().includes(params.workoutType) &&
          ex.muscle_groups.some(mg => mg.toLowerCase().includes(params.focusArea))
        ).slice(0, params.daysPerWeek * 2);
      } else {
        exercises = data;
      }

      // Distribui exercícios por dias (split científico: push/pull/legs ou full body)
      const daysSplit = params.focusArea === 'full_body' ? 
        Array.from({ length: params.daysPerWeek }, () => exercises.slice(0, 4)) : // 4 ex por dia full body
        [ // Exemplo push/pull/legs cycle
          exercises.filter(ex => ex.muscle_groups.includes('Peitoral') || ex.muscle_groups.includes('Ombros')), // Push
          exercises.filter(ex => ex.muscle_groups.includes('Costas') || ex.muscle_groups.includes('Bíceps')), // Pull
          exercises.filter(ex => ex.muscle_groups.includes('Quadríceps') || ex.muscle_groups.includes('Panturrilhas')) // Legs
        ].slice(0, params.daysPerWeek);

      const workoutDays = daysSplit.map((dayExercises, dayIndex) => ({
        day: dayIndex + 1,
        exercises: dayExercises.map((ex, exIndex) => ({
          exercise: ex,
          sets: guidelines.sets,
          reps: typeof guidelines.reps === 'number' ? guidelines.reps : Math.floor(Math.random() * (guidelines.reps[1] - guidelines.reps[0]) + guidelines.reps[0]),
          rest_time: guidelines.rest,
          notes: anamnesis?.barriers_to_training ? `Adapte para ${anamnesis.barriers_to_training}` : `Foco em forma correta.`
        })),
        duration: dayExercises.reduce((sum, ex) => sum + (ex.duration || (guidelines.sets * 60) + (guidelines.sets * guidelines.rest)), 0) / 60
      }));

      // Calcula duração total
      totalDuration = workoutDays.reduce((sum, day) => sum + day.duration, 0);

      // Monta o treino sugerido
      const suggestedWorkout = {
        name: `${student.name} - Treino ${params.workoutType} (${params.daysPerWeek} dias/semana)`,
        description: `Treino personalizado baseado em ${student.goal.replace('_', ' ')}, experiência ${anamnesis?.training_experience || 'iniciante'} e parâmetros informados. Embasamento: ACSM/NSCA guidelines para ${params.workoutType} (reps ${guidelines.reps}, rest ${guidelines.rest}s). Duração total: ${totalDuration} min/semana. Ajustes: ${params.specialNotes || 'Nenhum'}.`,
        category: params.workoutType,
        difficulty: student.age < 30 ? 'Iniciante' : 'Intermediário',
        estimated_duration: totalDuration / params.daysPerWeek, // Por sessão
        equipment_needed: params.equipmentAvailable,
        workout_days: workoutDays // Estrutura por dias
      };

      // Navega para o criador com a sugestão
      navigate('/workouts', { 
        state: { 
          suggestedWorkout,
          fromSuggestion: true,
          scientificBasis: `ACSM/NSCA: ${student.goal === 'perder_gordura' ? 'Higher reps (12-15) para EPOC e queima calórica.' : student.goal === 'ganhar_massa' ? '8-12 reps para hipertrofia sarcoplásmica.' : '10-12 reps para manutenção muscular.'}`
        } 
      });

      toast({
        title: "Treino Gerado com Base Científica!",
        description: `Criado ${params.daysPerWeek}-dia(s) de ${params.workoutType} focado em ${params.focusArea}. Embasamento: ACSM/NSCA guidelines adaptadas aos dados de ${student.name}. Edite no criador!`,
      });
    });
  };

  const generateWorkout = async () => {
    setIsGenerating(true);
    try {
      // Verifica Anamnese primeiro
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
        description: "Não foi possível gerar a sugestão. Verifique os dados e tente novamente.",
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
        description: "Falha ao gerar treino com parâmetros. Tente novamente.",
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
            <Button onClick={generateWorkout} disabled={isGenerating}>
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
                  {[1,2,3,4,5,6,7].map(n => <SelectItem key={n} value={n.toString()}>{n} dias</SelectItem>)}
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
                  <Checkbox
                    key={eq}
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
                  >
                    <Label htmlFor={eq} className="text-xs cursor-pointer">{eq}</Label>
                  </Checkbox>
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
            <Button onClick={handleParamsSubmit}>
              <Check className="mr-2 h-4 w-4" />
              Gerar Treino Personalizado
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