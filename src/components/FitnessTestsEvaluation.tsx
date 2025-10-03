"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Save, Loader2, Activity, HelpCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Student {
  id: string;
  name: string;
  age: number;
  gender: 'masculino' | 'feminino';
  height: number;
}

interface FieldConfig {
  id: string;
  label: string;
  placeholder: string;
  tooltip: string;
  required?: boolean;
  type?: 'number' | 'radio'; // Adicionado tipo para diferenciar campos
}

interface FitnessTestsEvaluationProps {
  student: Student;
  onBack: () => void;
  onSuccess: () => void;
}

const FitnessTestsEvaluation = ({ student, onBack, onSuccess }: FitnessTestsEvaluationProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<'taf' | 'tafi' | 'cooper' | 'parq'>('taf');
  const [formData, setFormData] = useState({
    // Campos numéricos
    cooperTestDistance: "",
    oneMileTestTime: "",
    sixMinWalkDistance: "",
    legerTestShuttles: "",
    abdominalTestReps: "",
    pushupTestReps: "",
    handgripTestRight: "",
    handgripTestLeft: "",
    horizontalJumpDistance: "",
    verticalJumpHeight: "",
    sitAndReachDistance: "",
    backReachRight: "",
    backReachLeft: "",
    unipodalBalanceEyesOpen: "",
    unipodalBalanceEyesClosed: "",
    timedUpAndGo: "",
    // Campos PAR-Q (respostas Sim/Não)
    parqHeartProblem: "",
    parqChestPain: "",
    parqDizziness: "",
    parqJointProblem: "",
    parqMedication: "",
    parqBoneProblem: "",
    parqOtherReason: ""
  });

  const protocols = [
    { value: 'taf' as const, label: 'TAF (Teste de Aptidão Física - Completo)', description: 'Testes completos: aeróbico, força, flexibilidade e equilíbrio' },
    { value: 'tafi' as const, label: 'TAFI (Idosos)', description: 'Teste de Aptidão Física para Idosos - Foco em equilíbrio, mobilidade, prevenção de quedas e capacidade funcional' },
    { value: 'cooper' as const, label: 'Cooper Protocol', description: 'Foco em capacidade aeróbica (Cooper + testes de endurance)' },
    { value: 'parq' as const, label: 'PAR-Q (Questionário de Prontidão)', description: 'Questionário de triagem médica para atividade física' }
  ];

  // Campos por protocolo (condicionais)
  const getFieldsForProtocol = (protocol: 'taf' | 'tafi' | 'cooper' | 'parq'): FieldConfig[] => {
    switch (protocol) {
      case 'taf':
        return [
          { 
            id: 'cooperTestDistance', 
            label: 'Teste de Cooper (distância em metros)', 
            placeholder: 'Ex: 2800', 
            tooltip: 'Corra o máximo possível em 12 minutos. Meça a distância total percorrida (em metros). Use pista reta ou esteira. Aquecimento: 5 min caminhada leve. Frequência cardíaca deve estar monitorada.',
            required: true,
            type: 'number'
          },
          // ... outros campos TAF (manter como antes)
        ];
      case 'tafi':
        return [
          // ... campos TAFI (manter como antes)
        ];
      case 'cooper':
        return [
          // ... campos Cooper (manter como antes)
        ];
      case 'parq':
        return [
          {
            id: 'parqHeartProblem',
            label: '1. Algum médico já disse que você tem algum problema cardíaco e recomendou que você só fizesse atividade física sob supervisão médica?',
            placeholder: '',
            tooltip: 'Questão de triagem para problemas cardíacos conhecidos. Resposta honesta é essencial para segurança.',
            required: true,
            type: 'radio'
          },
          {
            id: 'parqChestPain',
            label: '2. Você sente dor no peito quando pratica atividade física?',
            placeholder: '',
            tooltip: 'Dor no peito durante exercícios pode indicar problemas cardiovasculares. Consulte um médico se responder Sim.',
            required: true,
            type: 'radio'
          },
          {
            id: 'parqDizziness',
            label: '3. No último mês, você teve dor no peito quando não estava praticando atividade física?',
            placeholder: '',
            tooltip: 'Dor no peito em repouso é um sinal de alerta importante. Avaliação médica é recomendada.',
            required: true,
            type: 'radio'
          },
          {
            id: 'parqJointProblem',
            label: '4. Você perde o equilíbrio por causa de tontura ou já perdeu a consciência?',
            placeholder: '',
            tooltip: 'Tonturas ou perda de consciência podem indicar problemas neurológicos ou cardiovasculares.',
            required: true,
            type: 'radio'
          },
          {
            id: 'parqMedication',
            label: '5. Você tem algum problema ósseo ou articular que poderia piorar com a atividade física?',
            placeholder: '',
            tooltip: 'Problemas articulares pré-existentes podem exigir adaptações no exercício.',
            required: true,
            type: 'radio'
          },
          {
            id: 'parqBoneProblem',
            label: '6. Você está tomando atualmente algum medicamento para pressão arterial ou para algum problema cardíaco?',
            placeholder: '',
            tooltip: 'Medicações cardíacas podem afetar a resposta ao exercício. Informe sempre ao profissional.',
            required: true,
            type: 'radio'
          },
          {
            id: 'parqOtherReason',
            label: '7. Você tem conhecimento de qualquer outra razão pela qual não deveria praticar atividade física?',
            placeholder: '',
            tooltip: 'Questão aberta para qualquer outra condição de saúde que possa contraindicar exercícios.',
            required: true,
            type: 'radio'
          }
        ];
      default:
        return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    setIsSubmitting(true);

    try {
      // Validação básica por protocolo
      const requiredFields = getFieldsForProtocol(selectedProtocol).filter(field => field.required);
      const hasRequired = requiredFields.every(field => {
        const value = formData[field.id as keyof typeof formData];
        return value && value.trim() !== '';
      });

      if (!hasRequired) {
        toast({
          title: "Validação",
          description: `Preencha todos os campos obrigatórios para o protocolo ${protocols.find(p => p.value === selectedProtocol)?.label}.`,
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Para PAR-Q: verificar se alguma resposta é "Sim" e alertar
      if (selectedProtocol === 'parq') {
        const hasPositiveResponse = Object.keys(formData).some(key => 
          key.startsWith('parq') && formData[key as keyof typeof formData] === 'Sim'
        );

        if (hasPositiveResponse) {
          toast({
            title: "Atenção!",
            description: "Uma ou mais respostas indicam necessidade de avaliação médica antes de iniciar exercícios.",
            variant: "default"
          });
        }
      }

      const { error } = await supabase
        .from('evaluations')
        .insert({
          student_id: student.id,
          evaluation_method: `fitness_tests_${selectedProtocol}`,
          evaluation_date: new Date().toISOString().split('T')[0],
          // Campos numéricos (null se não aplicáveis)
          cooper_test_distance: parseFloat(formData.cooperTestDistance) || null,
          one_mile_test_time: parseFloat(formData.oneMileTestTime) || null,
          six_min_walk_distance: parseFloat(formData.sixMinWalkDistance) || null,
          leger_test_shuttles: parseInt(formData.legerTestShuttles) || null,
          abdominal_test_reps: parseInt(formData.abdominalTestReps) || null,
          pushup_test_reps: parseInt(formData.pushupTestReps) || null,
          handgrip_test_right: parseFloat(formData.handgripTestRight) || null,
          handgrip_test_left: parseFloat(formData.handgripTestLeft) || null,
          horizontal_jump_distance: parseFloat(formData.horizontalJumpDistance) || null,
          vertical_jump_height: parseFloat(formData.verticalJumpHeight) || null,
          sit_and_reach_distance: parseFloat(formData.sitAndReachDistance) || null,
          back_reach_right: parseFloat(formData.backReachRight) || null,
          back_reach_left: parseFloat(formData.backReachLeft) || null,
          unipodal_balance_eyes_open: parseFloat(formData.unipodalBalanceEyesOpen) || null,
          unipodal_balance_eyes_closed: parseFloat(formData.unipodalBalanceEyesClosed) || null,
          timed_up_and_go: parseFloat(formData.timedUpAndGo) || null,
          // Campos PAR-Q (respostas em JSON)
          parq_responses: selectedProtocol === 'parq' ? {
            heart_problem: formData.parqHeartProblem,
            chest_pain: formData.parqChestPain,
            dizziness: formData.parqDizziness,
            joint_problem: formData.parqJointProblem,
            medication: formData.parqMedication,
            bone_problem: formData.parqBoneProblem,
            other_reason: formData.parqOtherReason
          } : null
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Avaliação salva com sucesso (Protocolo: ${protocols.find(p => p.value === selectedProtocol)?.label}).`
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving evaluation:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar avaliação",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldsForProtocol = getFieldsForProtocol(selectedProtocol);
  const hasParqPositiveResponse = selectedProtocol === 'parq' && 
    Object.keys(formData).some(key => 
      key.startsWith('parq') && formData[key as keyof typeof formData] === 'Sim'
    );

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Avaliação de Aptidão Física
            </h1>
            <p className="text-muted-foreground mt-2">
              Protocolo selecionado: {protocols.find(p => p.value === selectedProtocol)?.label} - {protocols.find(p => p.value === selectedProtocol)?.description}
            </p>
          </div>
        </div>

        {/* Seletor de Protocolo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Escolha o Protocolo
            </CardTitle>
            <CardDescription>
              Selecione o tipo de teste de aptidão física para {student.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="protocol">Protocolo de Avaliação</Label>
              <Select value={selectedProtocol} onValueChange={(value) => setSelectedProtocol(value as 'taf' | 'tafi' | 'cooper' | 'parq')}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o protocolo" />
                </SelectTrigger>
                <SelectContent>
                  {protocols.map((proto) => (
                    <SelectItem key={proto.value} value={proto.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{proto.label}</span>
                        <span className="text-xs text-muted-foreground">{proto.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Alerta para PAR-Q com respostas positivas */}
        {hasParqPositiveResponse && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção! Avaliação Médica Recomendada</AlertTitle>
            <AlertDescription>
              Uma ou mais respostas indicam que {student.name} deve ser avaliado por um médico antes de iniciar atividades físicas.
            </AlertDescription>
          </Alert>
        )}

        {/* Formulário com Campos Condicionais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Testes do Protocolo Selecionado
            </CardTitle>
            <CardDescription>
              Preencha os resultados dos testes conforme o protocolo escolhido
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className={selectedProtocol === 'parq' ? "space-y-6" : "grid md:grid-cols-2 gap-4"}>
                {fieldsForProtocol.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label htmlFor={field.id}>
                        {field.label} {field.required && <span className="text-destructive">*</span>}
                      </Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm max-w-xs">{field.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    
                    {field.type === 'radio' ? (
                      <RadioGroup
                        value={formData[field.id as keyof typeof formData] || ""}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, [field.id]: value }))}
                        required={field.required}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Sim" id={`${field.id}-sim`} />
                          <Label htmlFor={`${field.id}-sim`}>Sim</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Não" id={`${field.id}-nao`} />
                          <Label htmlFor={`${field.id}-nao`}>Não</Label>
                        </div>
                      </RadioGroup>
                    ) : (
                      <Input
                        id={field.id}
                        type="number"
                        step="0.1"
                        value={formData[field.id as keyof typeof formData] || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </div>

              <Button 
                type="submit" 
                className="w-full gradient-primary shadow-primary hover:shadow-glow transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Salvar Avaliação ({protocols.find(p => p.value === selectedProtocol)?.label})
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default FitnessTestsEvaluation;