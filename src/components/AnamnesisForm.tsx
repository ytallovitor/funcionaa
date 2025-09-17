import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, AlertTriangle, Info } from "lucide-react";
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
  
  // Seção 2: Histórico Médico
  medical_conditions?: string;
  surgeries?: string;
  allergies?: string;
  current_pain_level?: number; // 0-10
  pain_locations?: string;
  previous_injuries?: string;
  
  // Seção 3: Medicamentos e Suplementos
  current_medications?: string;
  supplement_use?: string;
  
  // Seção 4: Histórico de Treino
  training_experience?: string;
  current_fitness_level?: string;
  previous_diet_experience?: string;
  
  // Seção 5: Estilo de Vida
  occupation?: string;
  physical_activity_work?: string;
  sleep_quality?: string;
  average_sleep_hours?: number;
  stress_level?: string;
  smoking_status?: string;
  cigarettes_per_day?: number; // Novo campo
  quit_smoking_years_ago?: number; // Novo campo
  alcohol_consumption?: string;
  diet_type?: string;
  
  // Seção 6: Objetivos e Barreiras
  main_goal?: string;
  specific_fitness_goals?: string;
  timeline_for_goals?: string;
  training_frequency?: string;
  preferred_training_times?: string;
  barriers_to_training?: string;
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
        setFormData({
          emergency_contact: "",
          emergency_phone: "",
          medical_conditions: "",
          surgeries: "",
          allergies: "",
          current_pain_level: undefined,
          pain_locations: "",
          previous_injuries: "",
          current_medications: "",
          supplement_use: "",
          training_experience: "",
          current_fitness_level: "",
          previous_diet_experience: "",
          occupation: "",
          physical_activity_work: "",
          sleep_quality: "",
          average_sleep_hours: undefined,
          stress_level: "",
          smoking_status: "",
          cigarettes_per_day: undefined, // Inicializa novo campo
          quit_smoking_years_ago: undefined, // Inicializa novo campo
          alcohol_consumption: "",
          diet_type: "",
          main_goal: "",
          specific_fitness_goals: "",
          timeline_for_goals: "",
          training_frequency: "",
          preferred_training_times: "",
          barriers_to_training: ""
        });
      }
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
    const required = [
      'emergency_contact',
      'emergency_phone',
      'medical_conditions',
      'surgeries',
      'allergies',
      'previous_injuries',
      'current_medications',
      'main_goal',
      'training_experience', // Adicionado como obrigatório para um perfil mais completo
      'current_fitness_level', // Adicionado como obrigatório
      'sleep_quality', // Adicionado como obrigatório
      'average_sleep_hours', // Adicionado como obrigatório
      'stress_level', // Adicionado como obrigatório
      'smoking_status', // Adicionado como obrigatório
      'alcohol_consumption', // Adicionado como obrigatório
      'diet_type', // Adicionado como obrigatório
    ];

    // Validação condicional para tabagismo
    if (data.smoking_status === 'fumante_atual') {
      required.push('cigarettes_per_day');
    } else if (data.smoking_status === 'ex_fumante') {
      required.push('quit_smoking_years_ago');
    }

    return required.every(field => {
      const value = data[field as keyof AnamnesisData];
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

                {/* Seção 2: Histórico Médico */}
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

                {/* Seção 4: Histórico de Treino */}
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
                </div>

                <Separator />

                {/* Seção 5: Estilo de Vida */}
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
                        <SelectItem value="mediterranea">Mediterrânea</SelectItem>
                        <SelectItem value="outra">Outra</SelectItem>
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
                </div>
              </>
            )}
          </div>
          <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSubmitting || !requiredFieldsFilled}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Salvar Anamnese Completa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default AnamnesisForm;