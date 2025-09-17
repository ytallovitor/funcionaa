import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Apple, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FoodItem {
  id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number;
}

interface MealEntry {
  id: string;
  food_item_id: string;
  food_items: FoodItem;
  quantity_grams: number;
  meal_type: string;
  meal_date: string;
}

interface NutritionGoal {
  id: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

interface StudentNutritionCardProps {
  studentId: string;
}

const StudentNutritionCard = ({ studentId }: StudentNutritionCardProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal | null>(null);
  const [totalNutrition, setTotalNutrition] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  useEffect(() => {
    if (studentId) {
      fetchNutritionData();
    }
  }, [studentId]);

  const fetchNutritionData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch active nutrition goal
      const { data: goalData, error: goalError } = await supabase
        .from('nutrition_goals')
        .select('*')
        .eq('student_id', studentId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (goalError && goalError.code !== 'PGRST116') throw goalError;
      setNutritionGoal(goalData);

      // Fetch meal entries for today
      const { data: mealEntriesData, error: mealEntriesError } = await supabase
        .from('meal_entries')
        .select(`
          *,
          food_items (*)
        `)
        .eq('student_id', studentId)
        .eq('meal_date', today);

      if (mealEntriesError) throw mealEntriesError;

      const calculatedTotals = calculateNutrition(mealEntriesData || []);
      setTotalNutrition(calculatedTotals);

    } catch (error) {
      console.error('Error fetching student nutrition data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de nutrição.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateNutrition = (entries: MealEntry[]) => {
    return entries.reduce((total, entry) => {
      const multiplier = entry.quantity_grams / 100;
      return {
        calories: total.calories + (entry.food_items.calories_per_100g * multiplier),
        protein: total.protein + (entry.food_items.protein_per_100g * multiplier),
        carbs: total.carbs + (entry.food_items.carbs_per_100g * multiplier),
        fat: total.fat + (entry.food_items.fat_per_100g * multiplier),
        fiber: total.fiber + ((entry.food_items.fiber_per_100g || 0) * multiplier)
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  };

  const getProgressValue = (consumed: number, goal: number | undefined) => {
    if (!goal || goal === 0) return 0;
    return Math.min((consumed / goal) * 100, 100);
  };

  if (loading) {
    return (
      <Card className="shadow-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle>Carregando Nutrição...</CardTitle>
        </CardHeader>
        <CardContent className="h-40 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-primary/10 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Apple className="h-5 w-5 text-primary" />
          Minha Nutrição Hoje
        </CardTitle>
        <CardDescription>
          Acompanhe suas metas nutricionais diárias
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!nutritionGoal ? (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">Nenhuma meta nutricional definida.</p>
            <p className="text-xs mt-1">Converse com seu personal para definir suas metas!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Calorias</span>
                <span>{Math.round(totalNutrition.calories)}/{nutritionGoal.calories}</span>
              </div>
              <Progress 
                value={getProgressValue(totalNutrition.calories, nutritionGoal.calories)} 
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Proteína</span>
                <span>{Math.round(totalNutrition.protein)}g/{nutritionGoal.protein}g</span>
              </div>
              <Progress 
                value={getProgressValue(totalNutrition.protein, nutritionGoal.protein)} 
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Carboidratos</span>
                <span>{Math.round(totalNutrition.carbs)}g/{nutritionGoal.carbs}g</span>
              </div>
              <Progress 
                value={getProgressValue(totalNutrition.carbs, nutritionGoal.carbs)} 
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Gordura</span>
                <span>{Math.round(totalNutrition.fat)}g/{nutritionGoal.fat}g</span>
              </div>
              <Progress 
                value={getProgressValue(totalNutrition.fat, nutritionGoal.fat)} 
                className="h-2"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentNutritionCard;