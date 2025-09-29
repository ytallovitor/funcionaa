"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Select from 'react-select';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('evaluations')
        .insert({
          student_id: student.id,
          evaluation_method: 'fitness_tests',
          evaluation_date: new Date().toISOString().split('T')[0],
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
        description: "Avaliação de aptidão física salva com sucesso."
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
            Registre os resultados dos testes de aptidão física para {student.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Testes de Aptidão Física
          </CardTitle>
          <CardDescription>
            Registre os resultados dos testes abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Aerobic Tests */}
              <div>
                <h4 className="font-semibold mb-2">Capacidade Aeróbica</h4>
                <div className="space-y-2">
                  <Label htmlFor="cooperTestDistance">Teste de Cooper (distância em metros)</Label>
                  <Input
                    id="cooperTestDistance"
                    type="number"
                    step="0.1"
                    value={formData.cooperTestDistance}
                    onChange={(e) => setFormData(prev => ({ ...prev, cooperTestDistance: e.target.value }))}
                    placeholder="Ex: 2800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oneMileTestTime">Teste de 1 Milha (tempo em segundos)</Label>
                  <Input
                    id="oneMileTestTime"
                    type="number"
                    step="0.1"
                    value={formData.oneMileTestTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, oneMileTestTime: e.target.value }))}
                    placeholder="Ex: 420"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sixMinWalkDistance">Caminhada de 6 min (distância em metros)</Label>
                  <Input
                    id="sixMinWalkDistance"
                    type="number"
                    step="0.1"
                    value={formData.sixMinWalkDistance}
                    onChange={(e) => setFormData(prev => ({ ...prev, sixMinWalkDistance: e.target.value }))}
                    placeholder="Ex: 550"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legerTestShuttles">Teste de Léger (número de lançadeiras)</Label>
                  <Input
                    id="legerTestShuttles"
                    type="number"
                    value={formData.legerTestShuttles}
                    onChange={(e) => setFormData(prev => ({ ...prev, legerTestShuttles: e.target.value }))}
                    placeholder="Ex: 8"
                  />
                </div>
              </div>

              {/* Strength and Endurance Tests */}
              <div>
                <h4 className="font-semibold mb-2">Força e Resistência Muscular</h4>
                <div className="space-y-2">
                  <Label htmlFor="abdominalTestReps">Abdominais em 1 min (repetições)</Label>
                  <Input
                    id="abdominalTestReps"
                    type="number"
                    value={formData.abdominalTestReps}
                    onChange={(e) => setFormData(prev => ({ ...prev, abdominalTestReps: e.target.value }))}
                    placeholder="Ex: 45"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pushupTestReps">Flexões de Braço (repetições)</Label>
                  <Input
                    id="pushupTestReps"
                    type="number"
                    value={formData.pushupTestReps}
                    onChange={(e) => setFormData(prev => ({ ...prev, pushupTestReps: e.target.value }))}
                    placeholder="Ex: 20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handgripTestRight">Preensão Manual Direita (kg)</Label>
                  <Input
                    id="handgripTestRight"
                    type="number"
                    step="0.1"
                    value={formData.handgripTestRight}
                    onChange={(e) => setFormData(prev => ({ ...prev, handgripTestRight: e.target.value }))}
                    placeholder="Ex: 40.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handgripTestLeft">Preensão Manual Esquerda (kg)</Label>
                  <Input
                    id="handgripTestLeft"
                    type="number"
                    step="0.1"
                    value={formData.handgripTestLeft}
                    onChange={(e) => setFormData(prev => ({ ...prev, handgripTestLeft: e.target.value }))}
                    placeholder="Ex: 38.2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horizontalJumpDistance">Salto Horizontal (distância em cm)</Label>
                  <Input
                    id="horizontalJumpDistance"
                    type="number"
                    step="0.1"
                    value={formData.horizontalJumpDistance}
                    onChange={(e) => setFormData(prev => ({ ...prev, horizontalJumpDistance: e.target.value }))}
                    placeholder="Ex: 220"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verticalJumpHeight">Salto Vertical (altura em cm)</Label>
                  <Input
                    id="verticalJumpHeight"
                    type="number"
                    step="0.1"
                    value={formData.verticalJumpHeight}
                    onChange={(e) => setFormData(prev => ({ ...prev, verticalJumpHeight: e.target.value }))}
                    placeholder="Ex: 45"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Flexibility Tests */}
              <div>
                <h4 className="font-semibold mb-2">Flexibilidade</h4>
                <div className="space-y-2">
                  <Label htmlFor="sitAndReachDistance">Sentar e Alcançar (distância em cm)</Label>
                  <Input
                    id="sitAndReachDistance"
                    type="number"
                    step="0.1"
                    value={formData.sitAndReachDistance}
                    onChange={(e) => setFormData(prev => ({ ...prev, sitAndReachDistance: e.target.value }))}
                    placeholder="Ex: 25"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backReachRight">Alcançar Atrás das Costas (Direito)</Label>
                  <Input
                    id="backReachRight"
                    type="number"
                    step="0.1"
                    value={formData.backReachRight}
                    onChange={(e) => setFormData(prev => ({ ...prev, backReachRight: e.target.value }))}
                    placeholder="Ex: 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backReachLeft">Alcançar Atrás das Costas (Esquerdo)</Label>
                  <Input
                    id="backReachLeft"
                    type="number"
                    step="0.1"
                    value={formData.backReachLeft}
                    onChange={(e) => setFormData(prev => ({ ...prev, backReachLeft: e.target.value }))}
                    placeholder="Ex: 8"
                  />
                </div>
              </div>

              {/* Balance Tests */}
              <div>
                <h4 className="font-semibold mb-2">Equilíbrio</h4>
                <div className="space-y-2">
                  <Label htmlFor="unipodalBalanceEyesOpen">Apoio Unipodal (Olhos Abertos, segundos)</Label>
                  <Input
                    id="unipodalBalanceEyesOpen"
                    type="number"
                    step="0.1"
                    value={formData.unipodalBalanceEyesOpen}
                    onChange={(e) => setFormData(prev => ({ ...prev, unipodalBalanceEyesOpen: e.target.value }))}
                    placeholder="Ex: 30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unipodalBalanceEyesClosed">Apoio Unipodal (Olhos Fechados, segundos)</Label>
                  <Input
                    id="unipodalBalanceEyesClosed"
                    type="number"
                    step="0.1"
                    value={formData.unipodalBalanceEyesClosed}
                    onChange={(e) => setFormData(prev => ({ ...prev, unipodalBalanceEyesClosed: e.target.value }))}
                    placeholder="Ex: 15"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timedUpAndGo">Timed Up and Go (segundos)</Label>
                  <Input
                    id="timedUpAndGo"
                    type="number"
                    step="0.1"
                    value={formData.timedUpAndGo}
                    onChange={(e) => setFormData(prev => ({ ...prev, timedUpAndGo: e.target.value }))}
                    placeholder="Ex: 7.5"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full gradient-primary shadow-primary hover:shadow-glow transition-all"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Salvar Avaliação
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FitnessTestsEvaluation;