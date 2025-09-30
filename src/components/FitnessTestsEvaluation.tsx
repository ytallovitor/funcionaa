"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Activity, HelpCircle } from "lucide-react";
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
  required?: boolean; // Adicionado: propriedade opcional para validação
}

interface FitnessTestsEvaluationProps {
  student: Student;
  onBack: () => void;
  onSuccess: () => void;
}

const FitnessTestsEvaluation = ({ student, onBack, onSuccess }: FitnessTestsEvaluationProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<'taf' | 'tafi' | 'cooper'>('taf');
  const [formData, setFormData] = useState({
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
    { value: 'tafi' as const, label: 'TAFI (Idosos)', description: 'Teste de Aptidão Física para Idosos - Foco em equilíbrio, mobilidade, prevenção de quedas e capacidade funcional' },
    { value: 'cooper' as const, label: 'Cooper Protocol', description: 'Foco em capacidade aeróbica (Cooper + testes de endurance)' }
  ];

  // Campos por protocolo (condicionais) - Todos em português com required definido
  const getFieldsForProtocol = (protocol: 'taf' | 'tafi' | 'cooper'): FieldConfig[] => {
    switch (protocol) {
      case 'taf':
        return [
          { 
            id: 'cooperTestDistance', 
            label: 'Teste de Cooper (distância em metros)', 
            placeholder: 'Ex: 2800', 
            tooltip: 'Corra o máximo possível em 12 minutos. Meça a distância total percorrida (em metros). Use pista reta ou esteira. Aquecimento: 5 min caminhada leve. Frequência cardíaca deve estar monitorada.',
            required: true 
          },
          { 
            id: 'sixMinWalkDistance', 
            label: 'Caminhada de 6 minutos (distância em metros)', 
            placeholder: 'Ex: 550', 
            tooltip: 'Caminhe o máximo possível em 6 minutos, em linha reta. Marque a distância total. Ideal para avaliar resistência aeróbica. Use corredor de 30m. Incentive ritmo constante, sem corrida.',
            required: true 
          },
          { 
            id: 'abdominalTestReps', 
            label: 'Flexão de Abdômen (30 seg)', 
            placeholder: 'Ex: 45', 
            tooltip: 'Deite de costas, joelhos dobrados, mãos atrás da cabeça. Levante o tronco até os joelhos. Conte repetições em 30 segundos. Mantenha ritmo constante, sem puxar o pescoço. Respiração: expire na subida.',
            required: true 
          },
          { 
            id: 'pushupTestReps', 
            label: 'Flexão de Braço (1 min)', 
            placeholder: 'Ex: 20', 
            tooltip: 'Posição de prancha, desça o peito até quase tocar o chão, suba estendendo os braços. Conte repetições em 1 minuto. Para iniciantes: joelhos no chão. Mantenha corpo reto, sem arquear as costas.',
            required: true 
          },
          { 
            id: 'handgripTestRight', 
            label: 'Dinamômetro Direito (kg)', 
            placeholder: 'Ex: 40.5', 
            tooltip: 'Aperte o dinamômetro com força máxima por 3 segundos. Faça 3 tentativas, use a melhor. Posição: sentado, braço em 90°. Relaxe entre tentativas. Meça em kg de força.',
            required: false 
          },
          { 
            id: 'sitAndReachDistance', 
            label: 'Sentar e Alcançar (cm)', 
            placeholder: 'Ex: 25', 
            tooltip: 'Sente no chão, pernas estendidas, alcance os pés com as mãos. Meça a distância do alcance (positivo se ultrapassar, negativo se não). 3 tentativas, use a melhor. Aquecimento antes.',
            required: true 
          },
          { 
            id: 'timedUpAndGo', 
            label: 'Levantar e Andar 2,44m (s)', 
            placeholder: 'Ex: 7.5', 
            tooltip: 'Sente em cadeira, levante, ande 2,44m até uma marca, vire e volte sentando. Cronometre o tempo total. Teste de mobilidade e equilíbrio. 3 tentativas, use a melhor. Use marcações no chão.',
            required: true 
          }
        ];
      case 'tafi':
        return [
          { 
            id: 'sixMinWalkDistance', 
            label: 'Caminhada de 6 minutos (distância em metros)', 
            placeholder: 'Ex: 400', 
            tooltip: 'Caminhe o máximo possível em 6 minutos, em linha reta. Marque a distância total. Para idosos: ritmo confortável, sem forçar. Use corredor de 30m. Incentive pausas se necessário. Avalia capacidade funcional.',
            required: true 
          },
          { 
            id: 'timedUpAndGo', 
            label: 'Levantar e Andar 2,44m (s)', 
            placeholder: 'Ex: 8.0', 
            tooltip: 'Sente em cadeira, levante, ande 2,44m até uma marca, vire e volte sentando. Cronometre o tempo total. Para idosos: foco em segurança, use apoio se precisar. Avalia risco de quedas.',
            required: true 
          },
          { 
            id: 'unipodalBalanceEyesOpen', 
            label: 'Apoio Unipodal Olhos Abertos (s)', 
            placeholder: 'Ex: 20', 
            tooltip: 'Fique em pé sobre uma perna (pé dominante), olhos abertos. Mantenha o equilíbrio o máximo possível. Pare se perder equilíbrio. Para idosos: use apoio próximo, foque em estabilidade.',
            required: true 
          },
          { 
            id: 'unipodalBalanceEyesClosed', 
            label: 'Apoio Unipodal Olhos Fechados (s)', 
            placeholder: 'Ex: 10', 
            tooltip: 'Mesmo que anterior, mas com olhos fechados. Para idosos: teste curto, priorize segurança. Avalia propriocepção e equilíbrio sensorial.',
            required: false 
          },
          { 
            id: 'sitAndReachDistance', 
            label: 'Sentar e Alcançar (cm)', 
            placeholder: 'Ex: 15', 
            tooltip: 'Sente no chão, pernas estendidas, alcance os pés com as mãos. Para idosos: vá devagar, sem forçar. Meça a distância do alcance. Avalia flexibilidade lombar.',
            required: true 
          },
          { 
            id: 'handgripTestRight', 
            label: 'Dinamômetro Direito (kg)', 
            placeholder: 'Ex: 25', 
            tooltip: 'Aperte o dinamômetro com força máxima por 3 segundos. Para idosos: 3 tentativas, use a melhor. Avalia força de preensão (importante para atividades diárias).',
            required: true 
          }
        ];
      case 'cooper':
        return [
          { 
            id: 'cooperTestDistance', 
            label: 'Teste de Cooper (distância em metros)', 
            placeholder: 'Ex: 2800', 
            tooltip: 'Corra o máximo possível em 12 minutos. Meça a distância total percorrida (em metros). Use pista reta ou esteira. Aquecimento: 5 min caminhada leve. Frequência cardíaca deve estar monitorada.',
            required: true 
          },
          { 
            id: 'oneMileTestTime', 
            label: 'Teste de 1600 metros (1.6km) (s)', 
            placeholder: 'Ex: 420', 
            tooltip: 'Corra 1600 metros o mais rápido possível. Cronometre o tempo total em segundos. Use pista reta ou esteira. Aquecimento: 5-10 min. Para iniciantes: caminhada rápida se necessário.',
            required: true 
          },
          { 
            id: 'sixMinWalkDistance', 
            label: 'Caminhada de 6 minutos (distância em metros)', 
            placeholder: 'Ex: 550', 
            tooltip: 'Caminhe o máximo possível em 6 minutos, em linha reta. Marque a distância total. Ideal para avaliar resistência aeróbica. Use corredor de 30m. Incentive ritmo constante, sem corrida.',
            required: false 
          },
          { 
            id: 'legerTestShuttles', 
            label: 'Teste de Léger (lançadeiras)', 
            placeholder: 'Ex: 8', 
            tooltip: 'Corra entre duas linhas de 20m, aumentando velocidade a cada minuto. Conte o nível (estágio) alcançado. Para iniciantes: versão caminhada. Monitore fadiga.',
            required: false 
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
          evaluation_method: `fitness_tests_${selectedProtocol}`,
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
                    <Input
                      id={field.id}
                      type="number"
                      step="0.1"
                      value={formData[field.id as keyof typeof formData] || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                      placeholder={field.placeholder}
                      required={field.required || false} // Usar field.required se existir, senão false
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
    </TooltipProvider>
  );
};

export default FitnessTestsEvaluation;