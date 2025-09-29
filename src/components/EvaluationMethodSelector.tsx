import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Activity, Calculator, Target, Dumbbell } from "lucide-react";

interface EvaluationMethodSelectorProps {
  onMethodSelect: (method: 'circumferences' | 'skinfolds' | 'fitness_tests') => void;
}

const EvaluationMethodSelector = ({ onMethodSelect }: EvaluationMethodSelectorProps) => {
  const [selectedMethod, setSelectedMethod] = useState<'circumferences' | 'skinfolds' | 'fitness_tests'>('circumferences');

  const handleSubmit = () => {
    onMethodSelect(selectedMethod);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          Método de Avaliação
        </h1>
        <p className="text-muted-foreground mt-2">
          Escolha o método para avaliar a composição corporal
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Selecione o Método
          </CardTitle>
          <CardDescription>
            Cada método tem suas características e precisão específicas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as 'circumferences' | 'skinfolds' | 'fitness_tests')}>
            <div className="grid gap-4">
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="circumferences" id="circumferences" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="circumferences" className="text-base font-medium cursor-pointer">
                    Por Circunferências (Método Navy)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Medidas de pescoço, cintura e quadril. Método prático e amplamente validado.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    <span className="text-xs text-primary">Precisão: Moderada (~3-4% erro). Melhor para monitorar tendências.</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="skinfolds" id="skinfolds" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="skinfolds" className="text-base font-medium cursor-pointer">
                    Por Dobras Cutâneas
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Medição da espessura das dobras cutâneas em pontos específicos do corpo.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="text-xs text-primary">Precisão: Alta (~3-5% erro). Requer profissional treinado e calíper.</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="fitness_tests" id="fitness_tests" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="fitness_tests" className="text-base font-medium cursor-pointer">
                    Testes de Aptidão Física
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Testes de capacidade aeróbica, força, flexibilidade e equilíbrio.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Dumbbell className="h-4 w-4 text-primary" />
                    <span className="text-xs text-primary">Avaliação abrangente da aptidão física geral.</span>
                  </div>
                </div>
              </div>
            </div>
          </RadioGroup>

          <Button 
            onClick={handleSubmit}
            className="w-full gradient-primary shadow-primary hover:shadow-glow transition-all"
          >
            Continuar com {
              selectedMethod === 'circumferences' ? 'Circunferências' : 
              selectedMethod === 'skinfolds' ? 'Dobras Cutâneas' : 
              'Testes de Aptidão Física'
            }
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EvaluationMethodSelector;