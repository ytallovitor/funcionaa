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
  gender: string;
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
    if (formData.weight && formData.waist && formData.neck && student) {
      calculateMetrics();
    }
  }, [formData, student]);

  const calculateMetrics = () => {
    const weight = parseFloat(formData.weight);
    const waist = parseFloat(formData.waist);
    const neck = parseFloat(formData.neck);
    const hip = formData.hip ? parseFloat(formData.hip) : 0;
    
    if (!weight || !waist || !neck || !student) return;

    // Navy Method for body fat calculation
    let bodyFatPercentage: number;
    
    if (student.gender === 'masculino') {
      const heightCm = student.height;
      bodyFatPercentage = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(heightCm)) - 450;
    } else {
      if (!hip) return;
      const heightCm = student.height;
      bodyFatPercentage = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(heightCm)) - 450;
    }

    const fatWeight = (bodyFatPercentage / 100) * weight;
    const leanMass = weight - fatWeight;

    // Harris-Benedict equation for BMR
    let bmr: number;
    if (student.gender === 'masculino') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * student.height) - (5.677 * student.age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * student.height) - (4.330 * student.age);
    }

    const dailyCalories = bmr * 1.55;

    setCalculatedData({
      bodyFatPercentage: Math.max(0, Math.min(50, bodyFatPercentage)),
      fatWeight,
      leanMass,
      bmr,
      dailyCalories
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('evaluations')
        .insert({
          student_id: student.id,
          evaluation_method: 'circumferences',
          weight: parseFloat(formData.weight),
          waist: parseFloat(formData.waist),
          neck: parseFloat(formData.neck),
          hip: formData.hip ? parseFloat(formData.hip) : null,
          right_arm: formData.rightArm ? parseFloat(formData.rightArm) : null,
          right_forearm: formData.rightForearm ? parseFloat(formData.rightForearm) : null,
          body_fat_percentage: calculatedData.bodyFatPercentage,
          fat_weight: calculatedData.fatWeight,
          lean_mass: calculatedData.leanMass,
          bmr: calculatedData.bmr,
          daily_calories: calculatedData.dailyCalories
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Avaliação por circunferências salva com sucesso"
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
            Avaliação para {student.name} - Método Navy
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
              Medidas de circunferências para {student.name}
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
                disabled={isSubmitting || !formData.weight || !formData.waist || !formData.neck || (student.gender === 'feminino' && !formData.hip)}
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
              Métricas automaticamente calculadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <p className="text-sm text-muted-foreground">% Gordura</p>
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
                <p className="text-sm text-muted-foreground">TMB</p>
                <p className="text-2xl font-bold text-primary">
                  {calculatedData.bmr.toFixed(0)}
                </p>
              </div>
            </div>

            <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground">Calorias Diárias</p>
              <p className="text-3xl font-bold text-primary">
                {calculatedData.dailyCalories.toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">kcal/dia</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CircumferencesEvaluation;