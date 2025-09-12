import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Activity, Save, ArrowLeft, Loader2 } from "lucide-react";
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

interface SkinfoldsEvaluationProps {
  student: Student;
  onBack: () => void;
  onSuccess: () => void;
}

const SkinfoldsEvaluation = ({ student, onBack, onSuccess }: SkinfoldsEvaluationProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [protocol, setProtocol] = useState<'7-folds' | '3-folds'>('7-folds');
  const [threefoldsProtocol, setThreefoldsProtocol] = useState('jackson-pollock');
  const [formData, setFormData] = useState({
    weight: "",
    // 7 dobras
    triceps: "",
    subscapular: "",
    chest: "",
    axillary: "",
    abdominal: "",
    suprailiac: "",
    thigh: ""
  });
  const [calculatedData, setCalculatedData] = useState({
    bodyFatPercentage: 0,
    fatWeight: 0,
    leanMass: 0,
    bmr: 0,
    dailyCalories: 0
  });

  useEffect(() => {
    if (formData.weight && hasRequiredFields()) {
      calculateMetrics();
    }
  }, [formData, protocol, threefoldsProtocol, student]);

  const hasRequiredFields = () => {
    if (protocol === '7-folds') {
      return formData.triceps && formData.subscapular && formData.chest && 
             formData.axillary && formData.abdominal && formData.suprailiac && formData.thigh;
    } else {
      // Para 3 dobras, os campos dependem do protocolo
      return formData.triceps && formData.subscapular && formData.thigh;
    }
  };

  const calculateMetrics = () => {
    const weight = parseFloat(formData.weight);
    if (!weight || !student) return;

    let bodyDensity: number;
    let bodyFatPercentage: number;

    if (protocol === '7-folds') {
      // Somatório das 7 dobras
      const sum7 = parseFloat(formData.triceps) + parseFloat(formData.subscapular) + 
                   parseFloat(formData.chest) + parseFloat(formData.axillary) + 
                   parseFloat(formData.abdominal) + parseFloat(formData.suprailiac) + 
                   parseFloat(formData.thigh);

      // Equação de Jackson & Pollock (1978) para 7 dobras
      if (student.gender === 'masculino') {
        bodyDensity = 1.112 - (0.00043499 * sum7) + (0.00000055 * sum7 * sum7) - (0.00028826 * student.age);
      } else {
        bodyDensity = 1.097 - (0.00046971 * sum7) + (0.00000056 * sum7 * sum7) - (0.00012828 * student.age);
      }
    } else {
      // 3 dobras - Jackson & Pollock
      const triceps = parseFloat(formData.triceps);
      const subscapular = parseFloat(formData.subscapular);
      const thigh = parseFloat(formData.thigh);
      const sum3 = triceps + subscapular + thigh;

      if (student.gender === 'masculino') {
        bodyDensity = 1.10938 - (0.0008267 * sum3) + (0.0000016 * sum3 * sum3) - (0.0002574 * student.age);
      } else {
        bodyDensity = 1.0994921 - (0.0009929 * sum3) + (0.0000023 * sum3 * sum3) - (0.0001392 * student.age);
      }
    }

    // Equação de Siri para converter densidade corporal em % de gordura
    bodyFatPercentage = ((4.95 / bodyDensity) - 4.5) * 100;

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
          evaluation_method: 'skinfolds',
          weight: parseFloat(formData.weight),
          waist: 0, // Required field, set to 0 for skinfolds
          neck: 0, // Required field, set to 0 for skinfolds
          triceps_skinfold: parseFloat(formData.triceps),
          subscapular_skinfold: parseFloat(formData.subscapular),
          chest_skinfold: protocol === '7-folds' ? parseFloat(formData.chest) : null,
          axillary_skinfold: protocol === '7-folds' ? parseFloat(formData.axillary) : null,
          abdominal_skinfold: protocol === '7-folds' ? parseFloat(formData.abdominal) : null,
          suprailiac_skinfold: protocol === '7-folds' ? parseFloat(formData.suprailiac) : null,
          thigh_skinfold: parseFloat(formData.thigh),
          skinfold_protocol: protocol === '7-folds' ? '7-dobras-jackson-pollock' : `3-dobras-${threefoldsProtocol}`,
          body_fat_percentage: calculatedData.bodyFatPercentage,
          fat_weight: calculatedData.fatWeight,
          lean_mass: calculatedData.leanMass,
          bmr: calculatedData.bmr,
          daily_calories: calculatedData.dailyCalories
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Avaliação por dobras cutâneas salva com sucesso"
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
            Avaliação por Dobras Cutâneas
          </h1>
          <p className="text-muted-foreground mt-2">
            Avaliação para {student.name} - Jackson & Pollock
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Medidas das Dobras
            </CardTitle>
            <CardDescription>
              Medidas em milímetros (mm) para {student.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
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

                <div className="space-y-3">
                  <Label>Protocolo de Dobras *</Label>
                  <RadioGroup value={protocol} onValueChange={(value) => setProtocol(value as '7-folds' | '3-folds')}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="7-folds" id="7-folds" />
                      <Label htmlFor="7-folds">7 Dobras (Jackson & Pollock)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="3-folds" id="3-folds" />
                      <Label htmlFor="3-folds">3 Dobras (Jackson & Pollock)</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Dobras obrigatórias para ambos os protocolos */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="triceps">Tríceps (mm) *</Label>
                    <Input
                      id="triceps"
                      type="number"
                      step="0.1"
                      value={formData.triceps}
                      onChange={(e) => setFormData(prev => ({ ...prev, triceps: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subscapular">Subescapular (mm) *</Label>
                    <Input
                      id="subscapular"
                      type="number"
                      step="0.1"
                      value={formData.subscapular}
                      onChange={(e) => setFormData(prev => ({ ...prev, subscapular: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thigh">Coxa (mm) *</Label>
                  <Input
                    id="thigh"
                    type="number"
                    step="0.1"
                    value={formData.thigh}
                    onChange={(e) => setFormData(prev => ({ ...prev, thigh: e.target.value }))}
                    required
                  />
                </div>

                {/* Dobras adicionais para 7 dobras */}
                {protocol === '7-folds' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="chest">Peitoral (mm) *</Label>
                        <Input
                          id="chest"
                          type="number"
                          step="0.1"
                          value={formData.chest}
                          onChange={(e) => setFormData(prev => ({ ...prev, chest: e.target.value }))}
                          required={protocol === '7-folds'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="axillary">Axilar Média (mm) *</Label>
                        <Input
                          id="axillary"
                          type="number"
                          step="0.1"
                          value={formData.axillary}
                          onChange={(e) => setFormData(prev => ({ ...prev, axillary: e.target.value }))}
                          required={protocol === '7-folds'}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="abdominal">Abdominal (mm) *</Label>
                        <Input
                          id="abdominal"
                          type="number"
                          step="0.1"
                          value={formData.abdominal}
                          onChange={(e) => setFormData(prev => ({ ...prev, abdominal: e.target.value }))}
                          required={protocol === '7-folds'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="suprailiac">Suprailíaca (mm) *</Label>
                        <Input
                          id="suprailiac"
                          type="number"
                          step="0.1"
                          value={formData.suprailiac}
                          onChange={(e) => setFormData(prev => ({ ...prev, suprailiac: e.target.value }))}
                          required={protocol === '7-folds'}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full gradient-primary shadow-primary hover:shadow-glow transition-all"
                disabled={isSubmitting || !formData.weight || !hasRequiredFields()}
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
              Métricas automaticamente calculadas (Jackson & Pollock + Siri)
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

            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Protocolo:</strong> {protocol === '7-folds' ? '7 Dobras' : '3 Dobras'} - Jackson & Pollock<br/>
                <strong>Fórmula:</strong> {protocol === '7-folds' ? 'Somatório de 7 dobras' : 'Tríceps + Subescapular + Coxa'}<br/>
                <strong>Conversão:</strong> Equação de Siri (Densidade → % Gordura)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SkinfoldsEvaluation;