"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Save, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  name: string;
  age: number;
  gender: 'masculino' | 'feminino';
  goal: string;
  height: number;
}

interface CircumferencesEvaluationProps {
  student: Student;
  onBack: () => void;
  onSuccess: () => void;
}

const CircumferencesEvaluation = ({ student, onBack, onSuccess }: CircumferencesEvaluationProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    weight: "",
    waist: "",
    neck: "",
    hip: "",
    rightArm: "",
    rightForearm: ""
  });
  const [calculatedData, setCalculatedData] = useState({
    bodyFatPercentage: 0,
    fatWeight: 0,
    leanMass: 0,
    bmr: 0,
    dailyCalories: 0
  });

  useEffect(() => {
    const fetchLatestEvaluation = async () => {
      if (!student) return;

      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('student_id', student.id)
        .order('evaluation_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching latest evaluation:", error);
      }

      if (data) {
        setFormData({
          weight: data.weight?.toString() || "",
          waist: data.waist?.toString() || "",
          neck: data.neck?.toString() || "",
          hip: data.hip?.toString() || "",
          rightArm: data.right_arm?.toString() || "",
          rightForearm: data.right_forearm?.toString() || ""
        });
        toast({
          title: "Dados carregados",
          description: "A última avaliação foi pré-carregada para facilitar.",
        });
      }
    };

    fetchLatestEvaluation();
  }, [student, toast]);

  useEffect(() => {
    if (formData.weight && formData.waist && formData.neck && student) {
      calculateMetrics();
    }
  }, [formData, student]);

  const calculateMetrics = () => {
    const weight = parseFloat(formData.weight);
    const waist = parseFloat(formData.waist);
    const neck = parseFloat(formData.neck);
    const hip = formData.hip ? parseFloat(formData.hip) : 0;
    
    if (!weight || !waist || !neck || !student || isNaN(weight) || isNaN(waist) || isNaN(neck)) return;

    // Converter medidas para inches (fórmula US Navy espera inches, não cm)
    const heightInches = student.height / 2.54;
    const waistInches = waist / 2.54;
    const neckInches = neck / 2.54;
    const hipInches = hip / 2.54;

    let bodyFatPercentage: number;
    
    if (student.gender === 'masculino') {
      if (waistInches <= neckInches) {
        toast({
          title: "Atenção",
          description: "Medida de cintura não pode ser menor ou igual ao pescoço. Verifique as medidas (fórmula US Navy).",
          variant: "destructive"
        });
        return;
      }
      bodyFatPercentage = 86.010 * Math.log10(waistInches - neckInches) - 70.041 * Math.log10(heightInches) + 36.76;
    } else {
      if (!hip || hip <= 0) {
        toast({
          title: "Atenção",
          description: "Medida de quadril é obrigatória para mulheres. Preencha o campo.",
          variant: "destructive"
        });
        return;
      }
      if (waistInches + hipInches <= neckInches) {
        toast({
          title: "Atenção",
          description: "Medidas inválidas: abdômen + quadril deve ser maior que o pescoço. Verifique.",
          variant: "destructive"
        });
        return;
      }
      bodyFatPercentage = 163.205 * Math.log10(waistInches + hipInches - neckInches) - 97.684 * Math.log10(heightInches) - 78.387;
    }
    
    // Limitar %BF a valores realistas (homens: 3-50%, mulheres: 12-50%)
    const minBF = student.gender === 'masculino' ? 3 : 12;
    bodyFatPercentage = Math.max(minBF, Math.min(50, bodyFatPercentage));

    const fatWeight = (bodyFatPercentage / 100) * weight;
    const leanMass = weight - fatWeight;

    // Taxa Metabólica Basal (BMR) - Equação de Harris-Benedict Revisada (1984)
    // Altura em cm, peso em kg (correto)
    let bmr: number;
    if (student.gender === 'masculino') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * student.height) - (5.677 * student.age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * student.height) - (4.330 * student.age);
    }
    
    // Calorias diárias: BMR × 1.55 (moderadamente ativo, ACSM)
    const dailyCalories = Math.round(bmr * 1.55);

    setCalculatedData({
      bodyFatPercentage,
      fatWeight,
      leanMass,
      bmr,
      dailyCalories
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    // Validação final
    const weight = parseFloat(formData.weight);
    const waist = parseFloat(formData.waist);
    const neck = parseFloat(formData.neck);
    const hip = formData.hip ? parseFloat(formData.hip) : null;
    
    if (isNaN(weight) || isNaN(waist) || isNaN(neck) || weight <= 0 || waist <= 0 || neck <= 0) {
      toast({
        title: "Validação",
        description: "Peso, cintura e pescoço devem ser números positivos válidos.",
        variant: "destructive"
      });
      return;
    }

    if (student.gender === 'feminino' && (!hip || hip <= 0)) {
      toast({
        title: "Validação",
        description: "Medida de quadril é obrigatória para mulheres no método de circunferências.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('evaluations')
        .insert({
          student_id: student.id,
          evaluation_method: 'circumferences',
          evaluation_date: new Date().toISOString().split('T')[0],
          weight,
          waist,
          neck,
          hip,
          right_arm: formData.rightArm ? parseFloat(formData.rightArm) : null,
          right_forearm: formData.rightForearm ? parseFloat(formData.rightForearm) : null,
          body_fat_percentage: calculatedData.bodyFatPercentage,
          fat_weight: calculatedData.fatWeight,
          lean_mass: calculatedData.leanMass,
          bmr: calculatedData.bmr,
          daily_calories: calculatedData.dailyCalories,
          skinfold_protocol: null
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Avaliação por circunferências salva com sucesso. Método US Navy - Precisão ~3-4% (Hodgdon & Beckett, 1994)."
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

  const isWeightValid = () => {
    const w = parseFloat(formData.weight);
    return !isNaN(w) && w > 0;
  };

  const isWaistValid = () => {
    const w = parseFloat(formData.waist);
    return !isNaN(w) && w > 0;
  };

  const isNeckValid = () => {
    const n = parseFloat(formData.neck);
    return !isNaN(n) && n > 0;
  };

  const isHipValid = () => {
    if (student.gender !== 'feminino') return true;
    const h = parseFloat(formData.hip);
    return !isNaN(h) && h > 0;
  };

  const isFormValid = isWeightValid() && isWaistValid() && isNeckValid() && isHipValid();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Avaliação por Circunferências
          </h1>
          <p className="text-muted-foreground mt-2">
            Avaliação para {student.name} - Método Navy (validado para precisão de campo, ~3-4% erro)
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Medidas Corporais
            </CardTitle>
            <CardDescription>
              Medidas de circunferências para {student.name} (em cm)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waist">Cintura (cm) *</Label>
                  <Input
                    id="waist"
                    type="number"
                    step="0.1"
                    value={formData.waist}
                    onChange={(e) => setFormData(prev => ({ ...prev, waist: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="neck">Pescoço (cm) *</Label>
                  <Input
                    id="neck"
                    type="number"
                    step="0.1"
                    value={formData.neck}
                    onChange={(e) => setFormData(prev => ({ ...prev, neck: e.target.value }))}
                    required
                  />
                </div>
                {student.gender === 'feminino' && (
                  <div className="space-y-2">
                    <Label htmlFor="hip">Quadril (cm) *</Label>
                    <Input
                      id="hip"
                      type="number"
                      step="0.1"
                      value={formData.hip}
                      onChange={(e) => setFormData(prev => ({ ...prev, hip: e.target.value }))}
                      required={student.gender === 'feminino'}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rightArm">Braço direito (cm)</Label>
                  <Input
                    id="rightArm"
                    type="number"
                    step="0.1"
                    value={formData.rightArm}
                    onChange={(e) => setFormData(prev => ({ ...prev, rightArm: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rightForearm">Antebraço direito (cm)</Label>
                  <Input
                    id="rightForearm"
                    type="number"
                    step="0.1"
                    value={formData.rightForearm}
                    onChange={(e) => setFormData(prev => ({ ...prev, rightForearm: e.target.value }))}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full gradient-primary shadow-primary hover:shadow-glow transition-all"
                disabled={!isFormValid}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Salvar Avaliação
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resultados Calculados</CardTitle>
            <CardDescription>
              Métricas automaticamente calculadas (US Navy Method + Harris-Benedict)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <p className="text-sm text-muted-foreground">% Gordura Corporal</p>
                <p className="text-2xl font-bold text-primary">
                  {calculatedData.bodyFatPercentage.toFixed(1)}%
                </p>
              </div>
              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Massa Magra</p>
                <p className="text-2xl font-bold text-primary">
                  {calculatedData.leanMass.toFixed(1)}kg
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Peso da Gordura</p>
                <p className="text-2xl font-bold text-primary">
                  {calculatedData.fatWeight.toFixed(1)}kg
                </p>
              </div>
              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <p className="text-sm text-muted-foreground">TMB (BMR)</p>
                <p className="text-2xl font-bold text-primary">
                  {calculatedData.bmr.toFixed(0)} kcal
                </p>
              </div>
            </div>

            <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground">Calorias Diárias Recomendadas</p>
              <p className="text-3xl font-bold text-primary">
                {calculatedData.dailyCalories.toFixed(0)} kcal
              </p>
              <p className="text-xs text-muted-foreground mt-1">Base: Atividade moderada (1.55 × BMR, ACSM)</p>
            </div>

            <div className="mt-4 p-3 bg-orange-50/50 rounded-lg border border-orange-200">
              <p className="text-xs text-orange-700">
                <strong>Aviso:</strong> O método de circunferências (US Navy) é prático, mas pode ter uma margem de erro maior para o percentual de gordura corporal (~3-4%). É mais recomendado para **monitorar tendências de progresso** ao longo do tempo do que para uma medida exata. Para maior precisão, considere métodos como dobras cutâneas (com profissional treinado) ou bioimpedância.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CircumferencesEvaluation;