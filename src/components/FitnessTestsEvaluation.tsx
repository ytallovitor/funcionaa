"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  name: string;
  age: number;
  gender: 'masculino' | 'feminino';
  height: number;
}

interface FitnessTestsEvaluationProps {
  student: Student;
  onBack: () => void;
  onSuccess: () => void;
}

const FitnessTestsEvaluation = ({ student, onBack, onSuccess }: FitnessTestsEvaluationProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<'taf' | 'tafi' | 'cooper'>('taf'); // Protocolo selecionado
  const [formData, setFormData] = useState({
    // Campos comuns a todos
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
    timedUpAndGo: ""
  });

  const protocols = [
    { value: 'taf' as const, label: 'TAF (Teste de Aptidão Física - Completo)', description: 'Testes completos: aeróbico, força, flexibilidade e equilíbrio' },
    { value: 'tafi' as const, label: 'TAFI (Individualizado)', description: 'Testes personalizados focados no aluno' },
    { value: 'cooper' as const, label: 'Cooper Protocol', description: 'Foco em capacidade aeróbica (Cooper + testes de endurance)' }
  ];

  // Campos por protocolo (condicionais)
  const getFieldsForProtocol = (protocol: 'taf' | 'tafi' | 'cooper') => {
    switch (protocol) {
      case 'taf':
        return [
          // Aeróbico
          { id: 'cooperTestDistance', label: 'Teste de Cooper (metros)', placeholder: 'Ex: 2800' },
          { id: 'sixMinWalkDistance', label: 'Caminhada de 6 min (metros)', placeholder: 'Ex: 550' },
          // Força
          { id: 'abdominalTestReps', label: 'Abdominais (reps)', placeholder: 'Ex: 45' },
          { id: 'pushupTestReps', label: 'Flexões (reps)', placeholder: 'Ex: 20' },
          { id: 'handgripTestRight', label: 'Preensão Direita (kg)', placeholder: 'Ex: 40.5' },
          // Flexibilidade
          { id: 'sitAndReachDistance', label: 'Sentar e Alcançar (cm)', placeholder: 'Ex: 25' },
          // Equilíbrio
          { id: 'timedUpAndGo', label: 'Timed Up and Go (s)', placeholder: 'Ex: 7.5' }
        ];
      case 'tafi':
        return [
          // Personalizado: permite todos, mas com foco em testes selecionados
          { id: 'oneMileTestTime', label: 'Teste de 1 Milha (s)', placeholder: 'Ex: 420' },
          { id: 'legerTestShuttles', label: 'Teste de Léger (lançadeiras)', placeholder: 'Ex: 8' },
          { id: 'horizontalJumpDistance', label: 'Salto Horizontal (cm)', placeholder: 'Ex: 220' },
          { id: 'verticalJumpHeight', label: 'Salto Vertical (cm)', placeholder: 'Ex: 45' },
          { id: 'unipodalBalanceEyesOpen', label: 'Apoio Unipodal Olhos Abertos (s)', placeholder: 'Ex: 30' }
        ];
      case 'cooper':
        return [
          // Foco aeróbico
          { id: 'cooperTestDistance', label: 'Teste de Cooper (metros)', placeholder: 'Ex: 2800', required: true },
          { id: 'oneMileTestTime', label: 'Teste de 1 Milha (s)', placeholder: 'Ex: 420', required: true },
          { id: 'sixMinWalkDistance', label: 'Caminhada de 6 min (metros)', placeholder: 'Ex: 550' },
          { id: 'legerTestShuttles', label: 'Teste de Léger (lançadeiras)', placeholder: 'Ex: 8' }
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
          description: `Preencha os campos obrigatórios para o protocolo ${protocols.find(p => p.value === selectedProtocol)?.label}.`,
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('evaluations')
        .insert({
          student_id: student.id,
          evaluation_method: `fitness_tests_${selectedProtocol}`, // Inclui o protocolo no método
          evaluation_date: new Date().toISOString().split('T')[0],
          // Todos os campos (alguns null se não aplicáveis)
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
          timed_up_and_go: parseFloat(formData.timedUpAndGo) || null
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Avaliação de aptidão física salva com sucesso (Protocolo: ${protocols.find(p => p.value === selectedProtocol)?.label}).`
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving fitness tests:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar avaliação de aptidão física",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldsForProtocol = getFieldsForProtocol(selectedProtocol);

  return (
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
            <Select value={selectedProtocol} onValueChange={(value) => setSelectedProtocol(value as 'taf' | 'tafi' | 'cooper')}>
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
            <div className="grid md:grid-cols-2 gap-4">
              {fieldsForProtocol.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id}>{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
                  <Input
                    id={field.id}
                    type="number"
                    step="0.1"
                    value={formData[field.id as keyof typeof formData] || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
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
  );
};

export default FitnessTestsEvaluation;