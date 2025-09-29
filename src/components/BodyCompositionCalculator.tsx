import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Weight, 
  TrendingUp, 
  Target, 
  Zap,
  Calculator,
  Info
} from "lucide-react";

interface BodyData {
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  waist: number;
  neck: number;
  hip?: number; // Only for females
}

interface BodyComposition {
  bodyFatPercentage: number;
  fatWeight: number;
  leanMass: number;
  bmr: number;
  dailyCalories: number;
  bmi: number;
  category: string;
}

interface BodyCompositionCalculatorProps {
  data: BodyData;
  onChange?: (composition: BodyComposition) => void;
}

const BodyCompositionCalculator = ({ data, onChange }: BodyCompositionCalculatorProps) => {
  const [composition, setComposition] = useState<BodyComposition | null>(null);

  useEffect(() => {
    if (data.weight && data.height && data.age && data.waist && data.neck) {
      const calculated = calculateBodyComposition(data);
      setComposition(calculated);
      onChange?.(calculated);
    }
  }, [data, onChange]);

  const calculateBodyComposition = (bodyData: BodyData): BodyComposition => {
    const { weight, height, age, gender, waist, neck, hip } = bodyData;
    
    // Convert height from cm to meters for BMI
    const heightM = height / 100;
    
    // Calculate BMI
    const bmi = weight / (heightM * heightM);
    
    // BMI Categories
    let category = "";
    if (bmi < 18.5) category = "Abaixo do peso";
    else if (bmi < 25) category = "Peso normal";
    else if (bmi < 30) category = "Sobrepeso";
    else category = "Obesidade";

    // Calculate Body Fat Percentage using US Navy Method
    let bodyFatPercentage = 0;
    
    if (gender === 'male') {
      // Male formula: 86.010 × log10(waist - neck) - 70.041 × log10(height) + 36.76
      bodyFatPercentage = 86.010 * Math.log10(waist - neck) - 70.041 * Math.log10(height) + 36.76;
    } else {
      // Female formula: 163.205 × log10(waist + hip - neck) - 97.684 × log10(height) - 78.387
      const hipMeasurement = hip || waist; // Fallback if hip not provided
      bodyFatPercentage = 163.205 * Math.log10(waist + hipMeasurement - neck) - 97.684 * Math.log10(height) - 78.387;
    }
    
    // Ensure body fat percentage is within reasonable bounds
    bodyFatPercentage = Math.max(3, Math.min(50, bodyFatPercentage));
    
    // Calculate fat weight and lean mass
    const fatWeight = (weight * bodyFatPercentage) / 100;
    const leanMass = weight - fatWeight;
    
    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr = 0;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height + 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height + 5 * age - 161;
    }
    
    // Calculate daily calories (assuming moderately active lifestyle)
    const dailyCalories = bmr * 1.55;
    
    return {
      bodyFatPercentage: Math.round(bodyFatPercentage * 10) / 10,
      fatWeight: Math.round(fatWeight * 10) / 10,
      leanMass: Math.round(leanMass * 10) / 10,
      bmr: Math.round(bmr),
      dailyCalories: Math.round(dailyCalories),
      bmi: Math.round(bmi * 10) / 10,
      category
    };
  };

  const getBodyFatCategory = (percentage: number, gender: string) => {
    if (gender === 'male') {
      if (percentage < 6) return { label: "Essencial", color: "bg-blue-100 text-blue-700" };
      if (percentage < 14) return { label: "Atlético", color: "bg-green-100 text-green-700" };
      if (percentage < 18) return { label: "Fitness", color: "bg-yellow-100 text-yellow-700" };
      if (percentage < 25) return { label: "Aceitável", color: "bg-orange-100 text-orange-700" };
      return { label: "Alto", color: "bg-red-100 text-red-700" };
    } else {
      if (percentage < 14) return { label: "Essencial", color: "bg-blue-100 text-blue-700" };
      if (percentage < 21) return { label: "Atlético", color: "bg-green-100 text-green-700" };
      if (percentage < 25) return { label: "Fitness", color: "bg-yellow-100 text-yellow-700" };
      if (percentage < 32) return { label: "Aceitável", color: "bg-orange-100 text-orange-700" };
      return { label: "Alto", color: "bg-red-100 text-red-700" };
    }
  };

  const getBMIColor = (bmi: number) => {
    if (bmi < 18.5) return "bg-blue-100 text-blue-700";
    if (bmi < 25) return "bg-green-100 text-green-700";
    if (bmi < 30) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  if (!composition) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Cálculos Automáticos</h3>
          <p className="text-muted-foreground">
            Preencha todos os dados de medidas para ver os cálculos de composição corporal
          </p>
        </CardContent>
      </Card>
    );
  }

  const bodyFatCategory = getBodyFatCategory(composition.bodyFatPercentage, data.gender);

  return (
    <div className="space-y-6">
      {/* Main Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="gradient-primary text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              % Gordura Corporal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{composition.bodyFatPercentage}%</div>
            <Badge className={`mt-2 ${bodyFatCategory.color}`}>
              {bodyFatCategory.label}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Weight className="h-4 w-4" />
              Massa Magra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{composition.leanMass}kg</div>
            <p className="text-sm text-muted-foreground mt-1">
              Músculos, ossos, órgãos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Peso da Gordura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{composition.fatWeight}kg</div>
            <p className="text-sm text-muted-foreground mt-1">
              {((composition.fatWeight / data.weight) * 100).toFixed(1)}% do peso total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Zap className="h-4 w-4" />
              TMB
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{composition.bmr}</div>
            <p className="text-sm text-muted-foreground mt-1">kcal/dia em repouso</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gasto Calórico Diário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">TMB (Repouso)</span>
              <span className="text-sm">{composition.bmr} kcal</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Atividade Moderada</span>
              <span className="text-sm font-semibold">{composition.dailyCalories} kcal</span>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                * Cálculo baseado em atividade física moderada (3-5x por semana)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Índice de Massa Corporal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{composition.bmi}</div>
              <Badge className={`mt-2 ${getBMIColor(composition.bmi)}`}>
                {composition.category}
              </Badge>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Faixa normal: 18.5 - 24.9 kg/m²
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Method Information */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Método de Cálculo</h4>
              <p className="text-xs text-muted-foreground">
                • <strong>% Gordura:</strong> Método da Marinha Americana (circunferências)
              </p>
              <p className="text-xs text-muted-foreground">
                • <strong>TMB:</strong> Equação de Mifflin-St Jeor (mais precisa)
              </p>
              <p className="text-xs text-muted-foreground">
                • <strong>Gasto Calórico:</strong> TMB × 1.55 (atividade moderada)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BodyCompositionCalculator;