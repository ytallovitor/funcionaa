import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Info, Wand2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Student {
  id: string;
  name: string;
}

interface AnamnesisData {
  // Seção 1: Contato de Emergência
  emergency_contact?: string;
  emergency_phone?: string;
  
  // Seção 2: Histórico Médico e Saúde Atual
  medical_conditions?: string;
  surgeries?: string;
  allergies?: string;
  current_pain_level?: number; // 0-10
  pain_locations?: string;
  previous_injuries?: string;
  family_medical_history?: string; // NOVO
  cardiovascular_risk_factors?: string; // NOVO
  respiratory_issues?: string; // NOVO
  digestive_issues?: string; // NOVO
  neurological_issues?: string; // NOVO
  bone_joint_issues?: string; // NOVO
  mental_health_history?: string; // NOVO
  recent_medical_exams?: string; // NOVO
  
  // Seção 3: Medicamentos e Suplementos
  current_medications?: string;
  supplement_use?: string;
  
  // Seção 4: Histórico de Treino e Atividade Física
  training_experience?: string;
  current_fitness_level?: string;
  previous_diet_experience?: string;
  previous_physical_activities?: string; // NOVO
  reasons_for_stopping_training?: string; // NOVO
  preferred_training_environment?: string; // NOVO
  preferred_training_style?: string; // NOVO
  
  // Seção 5: Estilo de Vida e Hábitos Diários
  occupation?: string;
  physical_activity_work?: string;
  sleep_quality?: string;
  average_sleep_hours?: number;
  stress_level?: string;
  smoking_status?: string;
  cigarettes_per_day?: number;
  quit_smoking_years_ago?: number;
  alcohol_consumption?: string;
  diet_type?: string;
  daily_water_intake_liters?: number; // NOVO
  daily_caffeine_intake_mg?: number; // NOVO
  screen_time_hours_per_day?: number; // NOVO
  hobbies_interests?: string; // NOVO
  social_support_network?: string; // NOVO
  
  // Seção 6: Objetivos e Barreiras ao Treino
  main_goal?: string;
  specific_fitness_goals?: string;
  timeline_for_goals?: string;
  training_frequency?: string;
  preferred_training_times?: string;
  barriers_to_training?: string;
  motivation_level?: string; // NOVO
  expectations_from_trainer?: string; // NOVO
  how_success_is_measured_by_client?: string; // NOVO
}

interface AIReport {
  summary: {
    fitnessReadiness: 'APTO' | 'APTO_COM_RESTRICOES' | 'NAO_APTO';
    fitnessReadinessReason: string;
    overallRisks: string[];
    overallSuggestions: string[];
  };
  detailedAnalysis: { section: string; findings: string[]; recommendations: string[] }[];
  disclaimer: string;
}

interface AnamnesisFormProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AnamnesisForm = ({ student, open, onOpenChange }: AnamnesisFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AnamnesisData>({});
  const [requiredFieldsFilled, setRequiredFieldsFilled] = useState(false);
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    if (open && student) {
      fetchAnamnesis();
    }
  }, [open, student]);

  const fetchAnamnesis = async () => {
    if (!student) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('anamnesis')
        .select('*')
        .eq('student_id', student.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setFormData(data);
      } else {
        // Initialize all fields to empty/undefined for a clean form
        setFormData({
          emergency_contact: "", emergency_phone: "",
          medical_conditions: "", surgeries: "", allergies: "", current_pain_level: undefined, pain_locations: "", previous_injuries: "",
          family_medical_history: "", cardiovascular_risk_factors: "", respiratory_issues: "", digestive_issues: "", neurological_issues: "", bone_joint_issues: "", mental_health_history: "", recent_medical_exams: "",
          current_medications: "", supplement_use: "",
          training_experience: "", current_fitness_level: "", previous_diet_experience: "",
          previous_physical_activities: "", reasons_for_stopping_training: "", preferred_training_environment: "", preferred_training_style: "",
          occupation: "", physical_activity_work: "", sleep_quality: "", average_sleep_hours: undefined, stress_level: "", smoking_status: "", cigarettes_per_day: undefined, quit_smoking_years_ago: undefined, alcohol_consumption: "", diet_type: "",
          daily_water_intake_liters: undefined, daily_caffeine_intake_mg: undefined, screen_time_hours_per_day: undefined, hobbies_interests: "", social_support_network: "",
          main_goal: "", specific_fitness_goals: "", timeline_for_goals: "", training_frequency: "", preferred_training_times: "", barriers_to_training: "",
          motivation_level: "", expectations_from_trainer: "", how_success_is_measured_by_client: ""
        });
      }
      setAiReport(null); // Reset AI report when fetching new anamnesis
    } catch (error) {
      console.error("Error fetching anamnesis:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a anamnese.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof AnamnesisData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateRequiredFields = (data: AnamnesisData) => {
    const required: (keyof AnamnesisData)[] = [
      'emergency_contact', 'emergency_phone',
      'medical_conditions', 'surgeries', 'allergies', 'previous_injuries', 'current_medications',
      'main_goal', 'training_experience', 'current_fitness_level', 'sleep_quality', 'average_sleep_hours',
      'stress_level', 'smoking_status', 'alcohol_consumption', 'diet_type',
    ];

    // Validação condicional para tabagismo
    if (data.smoking_status === 'fumante_atual') {
      required.push('cigarettes_per_day');
    } else if (data.smoking_status === 'ex_fumante') {
      required.push('quit_smoking_years_ago');
    }

    return required.every(field => {
      const value = data[field];
      return typeof value === 'string' ? value.trim() !== '' : value !== undefined && value !== null;
    });
  };

  useEffect(() => {
    setRequiredFieldsFilled(validateRequiredFields(formData));
  }, [formData]);

  const handleSave = async () => {
    if (!student) return;
    setIsSubmitting(true);
    try {
      if (!validateRequiredFields(formData)) {
        toast({
          title: "Campos Obrigatórios",
          description: "Preencha todos os campos marcados com * para salvar.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('anamnesis')
        .upsert({
          student_id: student.id,
          ...formData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id' });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Anamnese salva com sucesso. Agora você tem um perfil completo para criar treinos personalizados. (Protocolo baseado em ACSM/NSCA para triagem de riscos)."
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving anamnesis:", error);
      toast({
        title: "Erro",
        description: "Falha ao salvar a anamnese.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAIReport = async () => {
    if (!student) return;
    if (!requiredFieldsFilled) {
      toast({
        title: "Campos Obrigatórios",
        description: "Preencha todos os campos marcados com * antes de gerar o relatório da IA.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingReport(true);
    setAiReport(null); // Clear previous report

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("Sessão do usuário não encontrada. Faça login novamente.");
      }
      const accessToken = session.access_token;

      const SUPABASE_PROJECT_ID = 'accvidvcrihjrzreedix'; // From Supabase Context
      const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
      const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/generate-anamnesis-report`;

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`, // Pass auth token
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY, // Pass anon key
        },
        body: JSON.stringify({ anamnesisData: formData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      const reportData: AIReport = await response.json();
      setAiReport(reportData);
      toast({
        title: "Relatório de IA Gerado!",
        description: "A análise da anamnese foi concluída. Revise os riscos e sugestões.",
      });

    } catch (error: any) {
      console.error("Error generating AI report:", error);
      toast({
        title: "Erro ao Gerar Relatório de IA",
        description: error.message || "Não foi possível gerar o relatório. Verifique sua conexão e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (!student) return null;

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              📋 Anamnese Completa - {student.name}
            </DialogTitle>
            <DialogDescription>
              Esta é a anamnese profissional mais completa do mercado, baseada em protocolos ACSM e NSCA. 
              Colete informações detalhadas para criar treinos seguros e personalizados. 
              Campos obrigatórios são marcados com <span className="text-red-500 font-bold">*</span>.
              <br /><br />
              <strong>Disclaimer Profissional:</strong> Esta ferramenta auxilia na triagem inicial, mas não substitui consulta médica. 
              Recomenda-se encaminhar clientes com condições médicas para avaliação médica antes do início de programas de treino (ACSM Pre-Exercise Screening, 2021).
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 space-y-6 p-1 pr-4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                {/* Seção 1: Contato de Emergência */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    🚨 Contato de Emergência
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-blue-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Informações cruciais para qualquer emergência durante o treino (ACSM, 2021).</p>
                      </TooltipContent>
                    </Tooltip>
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergency_contact">Nome do Contato de Emergência <span className="text-red-500">*</span></Label>
                      <Input
                        id="emergency_contact"
                        value={formData.emergency_contact || ""}
                        onChange={(e) => updateFormData('emergency_contact', e.target.value)}
                        placeholder="Ex: Maria Silva (esposa/pai)"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergency_phone">Telefone de Emergência <span className="text-red-500">*</span></Label>
                      <Input
                        id="emergency_phone"
                        value={formData.emergency_phone || ""}
                        onChange={(e) => updateFormData('emergency_phone', e.target.value)}
                        placeholder="(11) 99999-9999"
                        required
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Seção 2: Histórico Médico e Saúde Atual */}
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                    🏥 Histórico Médico e Saúde Atual
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-red-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Essencial para triagem de riscos e adaptação do programa de exercícios (ACSM Pre-Exercise Screening, 2021).</p>
                      </TooltipContent>
                    </Tooltip>
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="medical_conditions">Condições Médicas Atuais ou Passadas <span className="text-red-500">*</span></Label>
                      <Textarea
                        id="medical_conditions"
                        value={formData.medical_conditions || ""}
                        onChange={(e) => updateFormData('medical_conditions', e.target.value)}
                        placeholder="Ex: Hipertensão, diabetes tipo 2, asma, artrite, problemas cardíacos, tireoide..."
                        rows={3}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="surgeries">Cirurgias ou Procedimentos <span className="text-red-500">*</span></Label>
                      <Textarea
                        id="surgeries"
                        value={formData.surgeries || ""}
                        onChange={(e) => updateFormData('surgeries', e.target.value)}
                        placeholder="Ex: Apendicite (2018), cirurgia no joelho (2020), cesariana (2015), hérnia de disco..."
                        rows={3}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="allergies">Alergias <span className="text-red-500">*</span></Label>
                      <Input
                        id="allergies"
                        value={formData.allergies || ""}
                        onChange={(e) => updateFormData('allergies', e.target.value)}
                        placeholder="Ex: Penicilina, frutos do mar, látex"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="current_pain_level">Nível de Dor Atual (0-10) <span className="text-red-500">*</span></Label>
                      <Input
                        id="current_pain_level"
                        type="number"
                        min="0"
                        max="10"
                        value={formData.current_pain_level === undefined ? "" : String(formData.current_pain_level)}
                        onChange={(e) => updateFormData('current_pain_level', e.target.value === "" ? undefined : parseInt(e.target.value))}
                        placeholder="0 = Sem dor, 10 = Dor insuportável"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pain_locations">Local da Dor</Label>
                      <Input
                        id="pain_locations"
                        value={formData.pain_locations || ""}
                        onChange={(e) => updateFormData('pain_locations', e.target.value)}
                        placeholder="Ex: Joelho esquerdo, lombar, ombro direito"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="previous_injuries">Lesões ou Traumas Anteriores <span className="text-red-500">*</span></Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Textarea
                          id="previous_injuries"
                          value={formData.previous_injuries || ""}
                          onChange={(e) => updateFormData('previous_injuries', e.target.value)}
                          placeholder="Ex: Distensão muscular no posterior da coxa (2022), entorse de tornozelo (2019), fratura no braço (adolescência)..."
                          rows={3}
                          required
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Informações vitais para evitar recidivas e adaptar exercícios, garantindo a segurança (NSCA, 2016).</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="family_medical_history">Histórico Médico Familiar (Doenças Cardiovasculares, Diabetes, Câncer, etc.)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Textarea
                          id="family_medical_history"
                          value={formData.family_medical_history || ""}
                          onChange={(e) => updateFormData('family_medical_history', e.target.value)}
                          placeholder="Ex: Pai com hipertensão, mãe com diabetes tipo 2, avô com histórico de infarto..."
                          rows={2}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Fatores genéticos podem aumentar o risco de certas condições (ACSM, 2021).</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="cardiovascular_risk_factors">Fatores de Risco Cardiovascular (além do tabagismo)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Textarea
                          id="cardiovascular_risk_factors"
                          value={formData.cardiovascular_risk_factors || ""}
                          onChange={(e) => updateFormData('cardiovascular_risk_factors', e.target.value)}
                          placeholder="Ex: Hipertensão, dislipidemia, diabetes, obesidade, sedentarismo (se não for o caso do aluno)..."
                          rows={2}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Identificar e gerenciar esses fatores é crucial para a saúde cardíaca (ACSM, 2021).</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="respiratory_issues">Problemas Respiratórios (Asma, Bronquite, DPOC)</Label>
                      <Textarea
                        id="respiratory_issues"
                        value={formData.respiratory_issues || ""}
                        onChange={(e) => updateFormData('respiratory_issues', e.target.value)}
                        placeholder="Ex: Asma induzida por exercício, bronquite crônica..."
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="digestive_issues">Problemas Digestivos (Refluxo, SII, Gastrite)</Label>
                      <Textarea
                        id="digestive_issues"
                        value={formData.digestive_issues || ""}
                        onChange={(e) => updateFormData('digestive_issues', e.target.value)}
                        placeholder="Ex: Refluxo gastroesofágico, síndrome do intestino irritável..."
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="neurological_issues">Problemas Neurológicos (Enxaqueca, Tontura, Convulsões)</Label>
                      <Textarea
                        id="neurological_issues"
                        value={formData.neurological_issues || ""}
                        onChange={(e) => updateFormData('neurological_issues', e.target.value)}
                        placeholder="Ex: Enxaquecas frequentes, histórico de tonturas..."
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bone_joint_issues">Problemas Ósseos/Articulares (Osteoporose, Artrose, Coluna)</Label>
                      <Textarea
                        id="bone_joint_issues"
                        value={formData.bone_joint_issues || ""}
                        onChange={(e) => updateFormData('bone_joint_issues', e.target.value)}
                        placeholder="Ex: Osteoporose, artrose no joelho, hérnia de disco lombar..."
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="mental_health_history">Histórico de Saúde Mental (Depressão, Ansiedade, Transtornos Alimentares)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Textarea
                          id="mental_health_history"
                          value={formData.mental_health_history || ""}
                          onChange={(e) => updateFormData('mental_health_history', e.target.value)}
                          placeholder="Ex: Depressão (em tratamento), ansiedade generalizada, histórico de transtorno alimentar..."
                          rows={2}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>A saúde mental impacta a adesão e a percepção do exercício (ACSM, 2021).</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="recent_medical_exams">Exames Médicos Recentes (Data do último check-up, exames de sangue relevantes)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Textarea
                          id="recent_medical_exams"
                          value={formData.recent_medical_exams || ""}
                          onChange={(e) => updateFormData('recent_medical_exams', e.target.value)}
                          placeholder="Ex: Último check-up em Jan/2024, exames de sangue com colesterol alto..."
                          rows={2}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Fornece uma base objetiva para a condição de saúde atual (ACSM, 2021).</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <Separator />

                {/* Seção 3: Medicamentos e Suplementos */}
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                    💊 Medicamentos e Suplementação
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-yellow-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Medicamentos podem afetar a resposta ao exercício; suplementos devem ser monitorados (ACSM, 2021).</p>
                      </TooltipContent>
                    </Tooltip>
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="current_medications">Medicamentos de Uso Contínuo <span className="text-red-500">*</span></Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Textarea
                            id="current_medications"
                            value={formData.current_medications || ""}
                            onChange={(e) => updateFormData('current_medications', e.target.value)}
                            placeholder="Ex: Losartana 50mg (hipertensão), metformina 850mg (diabetes), ibuprofeno sódico (dor ocasional)..."
                            rows={3}
                            required
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Interações: Beta-bloqueadores reduzem resposta cardíaca; diuréticos afetam hidratação (ACSM, 2021).</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supplement_use">Suplementos e Vitaminas</Label>
                      <Textarea
                        id="supplement_use"
                        value={formData.supplement_use || ""}
                        onChange={(e) => updateFormData('supplement_use', e.target.value)}
                        placeholder="Ex: Whey protein (pós-treino), creatina 5g/dia, multivitamínico, ômega-3 1000mg..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Seção 4: Histórico de Treino e Atividade Física */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    💪 Histórico de Treino e Atividade Física
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-green-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Define o ponto de partida e a progressão adequada do programa (NSCA, 2016).</p>
                      </TooltipContent>
                    </Tooltip>
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="training_experience">Nível de Experiência com Treino <span className="text-red-500">*</span></Label>
                      <Select
                        value={formData.training_experience || ""}
                        onValueChange={(value) => updateFormData('training_experience', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione seu nível" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sedentario">Sedentário (pouca ou nenhuma atividade física regular)</SelectItem>
                          <SelectItem value="iniciante">Iniciante (treino ocasional, menos de 6 meses de experiência)</SelectItem>
                          <SelectItem value="intermediario">Intermediário (treina regularmente há 6-24 meses)</SelectItem>
                          <SelectItem value="avancado">Avançado (treina consistentemente há mais de 2 anos)</SelectItem>
                          <SelectItem value="atleta">Atleta (treino profissional ou semi-profissional)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="current_fitness_level">Nível Atual de Condicionamento Físico <span className="text-red-500">*</span></Label>
                      <Select
                        value={formData.current_fitness_level || ""}
                        onValueChange={(value) => updateFormData('current_fitness_level', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Como você se avalia?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sedentario">Sedentário</SelectItem>
                          <SelectItem value="baixo">Baixo</SelectItem>
                          <SelectItem value="moderado">Moderado</SelectItem>
                          <SelectItem value="alto">Alto</SelectItem>
                          <SelectItem value="excelente">Excelente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="previous_diet_experience">Experiência Anterior com Dietas ou Nutrição</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Textarea
                          id="previous_diet_experience"
                          value={formData.previous_diet_experience || ""}
                          onChange={(e) => updateFormData('previous_diet_experience', e.target.value)}
                          placeholder="Ex: Fiz low carb por 3 meses (perdi 8kg), tentei jejum intermitente (não funcionou), sigo dieta vegetariana..."
                          rows={2}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ajuda a personalizar nutrição integrada ao treino e entender padrões alimentares (NSCA, 2016).</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="previous_physical_activities">Modalidades de Atividade Física Praticadas Anteriormente</Label>
                    <Textarea
                      id="previous_physical_activities"
                      value={formData.previous_physical_activities || ""}
                      onChange={(e) => updateFormData('previous_physical_activities', e.target.value)}
                      placeholder="Ex: Musculação (5 anos), corrida (2 anos), natação (infância), yoga..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="reasons_for_stopping_training">Motivos de Interrupção de Treinos Anteriores</Label>
                    <Textarea
                      id="reasons_for_stopping_training"
                      value={formData.reasons_for_stopping_training || ""}
                      onChange={(e) => updateFormData('reasons_for_stopping_training', e.target.value)}
                      placeholder="Ex: Falta de tempo, lesão, desmotivação, mudança de rotina..."
                      rows={2}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="preferred_training_environment">Ambiente de Treino Preferido</Label>
                      <Select
                        value={formData.preferred_training_environment || ""}
                        onValueChange={(value) => updateFormData('preferred_training_environment', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Onde você prefere treinar?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="academia">Academia</SelectItem>
                          <SelectItem value="ar_livre">Ar Livre (parque, rua)</SelectItem>
                          <SelectItem value="casa">Casa</SelectItem>
                          <SelectItem value="estudio">Estúdio (personal, pilates)</SelectItem>
                          <SelectItem value="variado">Variado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferred_training_style">Estilo de Treino Preferido</Label>
                      <Textarea
                        id="preferred_training_style"
                        value={formData.preferred_training_style || ""}
                        onChange={(e) => updateFormData('preferred_training_style', e.target.value)}
                        placeholder="Ex: Musculação com pesos livres, funcional com peso corporal, aulas de grupo, yoga..."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Seção 5: Estilo de Vida e Hábitos Diários */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                    🏠 Estilo de Vida e Hábitos Diários
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-purple-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Fatores como sono e estresse impactam diretamente a recuperação e performance (ACSM, 2021).</p>
                      </TooltipContent>
                    </Tooltip>
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="occupation">Ocupação/Profissão</Label>
                      <Input
                        id="occupation"
                        value={formData.occupation || ""}
                        onChange={(e) => updateFormData('occupation', e.target.value)}
                        placeholder="Ex: Professor, engenheiro de software, vendedor, estudante"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="physical_activity_work">Atividade Física no Trabalho</Label>
                      <Select
                        value={formData.physical_activity_work || ""}
                        onValueChange={(value) => updateFormData('physical_activity_work', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seu trabalho envolve movimento?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sedentario">Sedentário (escritório, sentado o dia todo)</SelectItem>
                          <SelectItem value="leve">Leve (caminha um pouco, mas majoritariamente sentado)</SelectItem>
                          <SelectItem value="moderado">Moderado (caminha bastante, carrega objetos leves)</SelectItem>
                          <SelectItem value="intenso">Intenso (trabalho físico, carrega peso, muito movimento)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="sleep_quality">Qualidade do Sono (subjetiva) <span className="text-red-500">*</span></Label>
                      <Select
                        value={formData.sleep_quality || ""}
                        onValueChange={(value) => updateFormData('sleep_quality', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Como você dorme?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excelente">Excelente (dorme bem, acorda descansado)</SelectItem>
                          <SelectItem value="boa">Boa (dorme bem na maioria das noites)</SelectItem>
                          <SelectItem value="regular">Regular (dorme, mas acorda cansado algumas vezes)</SelectItem>
                          <SelectItem value="ruim">Ruim (dorme mal frequentemente)</SelectItem>
                          <SelectItem value="muito_ruim">Muito Ruim (insônia, acorda várias vezes)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="average_sleep_hours">Horas Médias de Sono por Noite <span className="text-red-500">*</span></Label>
                      <Input
                        id="average_sleep_hours"
                        type="number"
                        min="0"
                        max="24"
                        value={formData.average_sleep_hours === undefined ? "" : String(formData.average_sleep_hours)}
                        onChange={(e) => updateFormData('average_sleep_hours', e.target.value === "" ? undefined : parseInt(e.target.value))}
                        placeholder="Ex: 7 horas"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="stress_level">Nível de Estresse Atual <span className="text-red-500">*</span></Label>
                      <Select
                        value={formData.stress_level || ""}
                        onValueChange={(value) => updateFormData('stress_level', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Como está seu estresse?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixo">Baixo (gerencio bem o estresse)</SelectItem>
                          <SelectItem value="moderado">Moderado (estresse gerenciável)</SelectItem>
                          <SelectItem value="alto">Alto (estresse constante, afeta minha rotina)</SelectItem>
                          <SelectItem value="muito_alto">Muito Alto (estresse extremo, ansiedade/pânico)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alcohol_consumption">Consumo de Álcool <span className="text-red-500">*</span></Label>
                      <Select
                        value={formData.alcohol_consumption || ""}
                        onValueChange={(value) => updateFormData('alcohol_consumption', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Você consome álcool?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nenhum">Nenhum consumo</SelectItem>
                          <SelectItem value="ocasional">Ocasional (fins de semana, social)</SelectItem>
                          <SelectItem value="moderado">Moderado (algumas vezes por semana)</SelectItem>
                          <SelectItem value="frequente">Frequente (diário ou quase)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="smoking_status">Status de Tabagismo <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.smoking_status || ""}
                      onValueChange={(value) => {
                        updateFormData('smoking_status', value);
                        // Reset conditional fields when status changes
                        if (value !== 'fumante_atual') updateFormData('cigarettes_per_day', undefined);
                        if (value !== 'ex_fumante') updateFormData('quit_smoking_years_ago', undefined);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Você fuma?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nunca">Nunca fumei</SelectItem>
                        <SelectItem value="ex_fumante">Ex-fumante</SelectItem>
                        <SelectItem value="fumante_atual">Fumante atual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.smoking_status === 'fumante_atual' && (
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="cigarettes_per_day">Cigarros por Dia <span className="text-red-500">*</span></Label>
                      <Input
                        id="cigarettes_per_day"
                        type="number"
                        min="0"
                        value={formData.cigarettes_per_day === undefined ? "" : String(formData.cigarettes_per_day)}
                        onChange={(e) => updateFormData('cigarettes_per_day', e.target.value === "" ? undefined : parseInt(e.target.value))}
                        placeholder="Ex: 10"
                        required
                      />
                    </div>
                  )}
                  {formData.smoking_status === 'ex_fumante' && (
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="quit_smoking_years_ago">Anos desde que Parou de Fumar <span className="text-red-500">*</span></Label>
                      <Input
                        id="quit_smoking_years_ago"
                        type="number"
                        min="0"
                        value={formData.quit_smoking_years_ago === undefined ? "" : String(formData.quit_smoking_years_ago)}
                        onChange={(e) => updateFormData('quit_smoking_years_ago', e.target.value === "" ? undefined : parseInt(e.target.value))}
                        placeholder="Ex: 5"
                        required
                      />
                    </div>
                  )}
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="diet_type">Tipo de Dieta Atual <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.diet_type || ""}
                      onValueChange={(value) => updateFormData('diet_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Qual sua dieta?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nenhuma">Nenhuma específica</SelectItem>
                        <SelectItem value="onivora">Onívora</SelectItem>
                        <SelectItem value="vegetariana">Vegetariana</SelectItem>
                        <SelectItem value="vegana">Vegana</SelectItem>
                        <SelectItem value="low_carb">Low Carb</SelectItem>
                        <SelectItem value="cetogenica">Cetogênica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="daily_water_intake_liters">Consumo Diário de Água (litros)</Label>
                      <Input
                        id="daily_water_intake_liters"
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.daily_water_intake_liters === undefined ? "" : String(formData.daily_water_intake_liters)}
                        onChange={(e) => updateFormData('daily_water_intake_liters', e.target.value === "" ? undefined : parseFloat(e.target.value))}
                        placeholder="Ex: 2.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="daily_caffeine_intake_mg">Consumo Diário de Cafeína (mg)</Label>
                      <Input
                        id="daily_caffeine_intake_mg"
                        type="number"
                        min="0"
                        value={formData.daily_caffeine_intake_mg === undefined ? "" : String(formData.daily_caffeine_intake_mg)}
                        onChange={(e) => updateFormData('daily_caffeine_intake_mg', e.target.value === "" ? undefined : parseInt(e.target.value))}
                        placeholder="Ex: 200 (aprox. 2 xícaras de café)"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="screen_time_hours_per_day">Tempo de Tela Diário (horas)</Label>
                    <Input
                      id="screen_time_hours_per_day"
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.screen_time_hours_per_day === undefined ? "" : String(formData.screen_time_hours_per_day)}
                      onChange={(e) => updateFormData('screen_time_hours_per_day', e.target.value === "" ? undefined : parseFloat(e.target.value))}
                      placeholder="Ex: 6.5"
                    />
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="hobbies_interests">Hobbies e Interesses (para entender atividades de lazer)</Label>
                    <Textarea
                      id="hobbies_interests"
                      value={formData.hobbies_interests || ""}
                      onChange={(e) => updateFormData('hobbies_interests', e.target.value)}
                      placeholder="Ex: Leitura, jardinagem, jogos de tabuleiro, fotografia, música..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="social_support_network">Rede de Apoio Social</Label>
                    <Select
                      value={formData.social_support_network || ""}
                      onValueChange={(value) => updateFormData('social_support_network', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Como você avalia sua rede de apoio?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="forte">Forte (muito apoio de amigos/família)</SelectItem>
                        <SelectItem value="moderada">Moderada (algum apoio)</SelectItem>
                        <SelectItem value="limitada">Limitada (pouco ou nenhum apoio)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Seção 6: Objetivos e Barreiras */}
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <h3 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                    🎯 Objetivos e Barreiras ao Treino
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-indigo-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Compreender metas e desafios é fundamental para a adesão e sucesso do programa (NSCA, 2016).</p>
                      </TooltipContent>
                    </Tooltip>
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="main_goal">Objetivo Principal do Treino (detalhado) <span className="text-red-500">*</span></Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Textarea
                          id="main_goal"
                          value={formData.main_goal || ""}
                          onChange={(e) => updateFormData('main_goal', e.target.value)}
                          placeholder="Ex: Perder 8kg de gordura corporal em 4 meses, focar em hipertrofia de glúteos e pernas, melhorar resistência para corrida de 10km..."
                          rows={3}
                          required
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Base para periodização: Objetivos SMART (Specific, Measurable, Achievable, Relevant, Time-bound) são mais eficazes (NSCA, 2016).</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specific_fitness_goals">Metas Específicas de Fitness</Label>
                    <Textarea
                      id="specific_fitness_goals"
                      value={formData.specific_fitness_goals || ""}
                      onChange={(e) => updateFormData('specific_fitness_goals', e.target.value)}
                      placeholder="Ex: Aumentar o supino para 80kg, correr 5km sem parar, flexibilidade para yoga..."
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="timeline_for_goals">Prazo para as Metas</Label>
                      <Input
                        id="timeline_for_goals"
                        value={formData.timeline_for_goals || ""}
                        onChange={(e) => updateFormData('timeline_for_goals', e.target.value)}
                        placeholder="Ex: 3 meses para perder 5kg, 6 meses para corrida de 10km"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="training_frequency">Frequência de Treino Desejada</Label>
                      <Select
                        value={formData.training_frequency || ""}
                        onValueChange={(value) => updateFormData('training_frequency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Quantas vezes por semana?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-2">1 a 2 vezes por semana</SelectItem>
                          <SelectItem value="3-4">3 a 4 vezes por semana</SelectItem>
                          <SelectItem value="5+">5 ou mais vezes por semana</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="preferred_training_times">Horários Preferidos para Treino</Label>
                    <Select
                      value={formData.preferred_training_times || ""}
                      onValueChange={(value) => updateFormData('preferred_training_times', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Quando você pode treinar?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manha">Manhã (6h-12h)</SelectItem>
                        <SelectItem value="tarde">Tarde (12h-18h)</SelectItem>
                        <SelectItem value="noite">Noite (18h-22h)</SelectItem>
                        <SelectItem value="flexivel">Flexível</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barriers_to_training">Barreiras ou Limitações para Treino</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Textarea
                          id="barriers_to_training"
                          value={formData.barriers_to_training || ""}
                          onChange={(e) => updateFormData('barriers_to_training', e.target.value)}
                          placeholder="Ex: Falta de tempo (trabalho 10h/dia), dor lombar limita agachamentos, sem acesso a academia..."
                          rows={2}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Essencial para adaptações: 70% dos desistentes citam barreiras logísticas. Identificá-las permite criar soluções (NSCA, 2016).</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="motivation_level">Nível de Motivação para o Treino</Label>
                    <Select
                      value={formData.motivation_level || ""}
                      onValueChange={(value) => updateFormData('motivation_level', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Qual seu nível de motivação?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="muito_alta">Muito Alta</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="moderada">Moderada</SelectItem>
                        <SelectItem value="baixa">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="expectations_from_trainer">Expectativas em Relação ao Treinador</Label>
                    <Textarea
                      id="expectations_from_trainer"
                      value={formData.expectations_from_trainer || ""}
                      onChange={(e) => updateFormData('expectations_from_trainer', e.target.value)}
                      placeholder="Ex: Espero orientação constante, correção de postura, motivação, planos de treino variados..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="how_success_is_measured_by_client">Como o Aluno Mede o Próprio Sucesso</Label>
                    <Textarea
                      id="how_success_is_measured_by_client"
                      value={formData.how_success_is_measured_by_client || ""}
                      onChange={(e) => updateFormData('how_success_is_measured_by_client', e.target.value)}
                      placeholder="Ex: Pela balança, pelas roupas, pela energia diária, pela performance nos treinos, pela saúde geral..."
                      rows={2}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 pt-4 border-t">
            <Button 
              onClick={handleGenerateAIReport} 
              disabled={isGeneratingReport || !requiredFieldsFilled}
              className="gradient-primary text-white"
            >
              {isGeneratingReport ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando Relatório...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Gerar Relatório de IA
                </>
              )}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={isSubmitting || !requiredFieldsFilled}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Salvar Anamnese Completa
              </Button>
            </div>
          </DialogFooter>

          {aiReport && (
            <div className="mt-6 p-4 border rounded-lg bg-card shadow-lg">
              <h3 className="text-xl font-bold text-gradient mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Análise da IA: Relatório de Anamnese
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Este relatório oferece uma visão automatizada dos riscos e sugestões com base nos dados da anamnese.
                Lembre-se: a decisão final e a personalização são sempre do profissional.
              </p>

              <div className="space-y-4">
                {/* Recomendação de Aptidão */}
                <div className={`p-4 rounded-lg border-2 ${
                  aiReport.summary.fitnessReadiness === 'APTO' 
                    ? 'bg-green-50 border-green-500' 
                    : aiReport.summary.fitnessReadiness === 'APTO_COM_RESTRICOES'
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-red-50 border-red-500'
                }`}>
                  <h4 className={`font-bold text-xl mb-2 flex items-center gap-2 ${
                    aiReport.summary.fitnessReadiness === 'APTO' 
                      ? 'text-green-700' 
                      : aiReport.summary.fitnessReadiness === 'APTO_COM_RESTRICOES'
                      ? 'text-yellow-700'
                      : 'text-red-700'
                  }`}>
                    {aiReport.summary.fitnessReadiness === 'APTO' && '✅ ALUNO APTO'}
                    {aiReport.summary.fitnessReadiness === 'APTO_COM_RESTRICOES' && '⚠️ APTO COM RESTRIÇÕES'}
                    {aiReport.summary.fitnessReadiness === 'NAO_APTO' && '❌ NÃO APTO'}
                  </h4>
                  <p className={`text-sm font-medium ${
                    aiReport.summary.fitnessReadiness === 'APTO' 
                      ? 'text-green-800' 
                      : aiReport.summary.fitnessReadiness === 'APTO_COM_RESTRICOES'
                      ? 'text-yellow-800'
                      : 'text-red-800'
                  }`}>
                    {aiReport.summary.fitnessReadinessReason}
                  </p>
                </div>

                {aiReport.summary.overallRisks.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-lg text-red-600 mb-2">Riscos Gerais Identificados:</h4>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      {aiReport.summary.overallRisks.map((risk, index) => (
                        <li key={index}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiReport.summary.overallSuggestions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-lg text-green-600 mb-2">Sugestões Gerais da IA:</h4>
                    <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                      {aiReport.summary.overallSuggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiReport.detailedAnalysis.length > 0 && (
                  <div className="space-y-4 mt-4">
                    <h4 className="font-semibold text-lg text-primary">Análise Detalhada por Seção:</h4>
                    {aiReport.detailedAnalysis.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="border-l-4 border-primary-glow pl-3 py-1">
                        <h5 className="font-medium text-base text-primary-glow">{section.section}</h5>
                        {section.findings.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-muted-foreground">Achados:</p>
                            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                              {section.findings.map((finding, index) => (
                                <li key={index}>{finding}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {section.recommendations.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-muted-foreground">Recomendações:</p>
                            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                              {section.recommendations.map((rec, index) => (
                                <li key={index}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground italic mt-6 border-t pt-3">
                {aiReport.disclaimer}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default AnamnesisForm;