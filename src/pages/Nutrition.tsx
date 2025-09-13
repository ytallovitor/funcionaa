import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import NutritionTracker from "@/components/NutritionTracker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Apple, 
  Plus, 
  Search, 
  Calendar,
  TrendingUp,
  Target,
  Utensils,
  Coffee,
  Sandwich,
  Cookie
} from "lucide-react";

interface Food {
  id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  category: string;
}

interface MealEntry {
  id: string;
  food_item: Food;
  quantity_grams: number;
  meal_type: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  meal_date: string;
}

const Nutrition = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [foodItems, setFoodItems] = useState<Food[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'snack' | 'dinner'>('breakfast');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Mock nutrition goals - should come from database
  const nutritionGoals = {
    calories: 2200,
    protein: 150,
    carbs: 250,
    fat: 70,
    fiber: 30
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      
      setUserProfile(profile);

      // Fetch food items
      const { data: foods, error: foodsError } = await supabase
        .from('food_items')
        .select('*')
        .order('name');

      if (foodsError) throw foodsError;
      setFoodItems(foods || []);

      // Fetch meal entries for selected date
      const { data: mealEntries, error: mealsError } = await supabase
        .from('meal_entries')
        .select(`
          *,
          food_items (*)
        `)
        .eq('meal_date', selectedDate);

      if (mealsError) throw mealsError;
      
      // Transform data to match interface
      const transformedMeals: MealEntry[] = mealEntries?.map(entry => ({
        id: entry.id,
        food_item: entry.food_items,
        quantity_grams: entry.quantity_grams,
        meal_type: entry.meal_type as 'breakfast' | 'lunch' | 'snack' | 'dinner',
        meal_date: entry.meal_date
      })) || [];
      
      setMeals(transformedMeals);

    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de nutrição",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredFoods = foodItems.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayMeals = meals.filter(meal => meal.meal_date === selectedDate);

  const calculateTotals = () => {
    return todayMeals.reduce((totals, meal) => ({
      calories: totals.calories + (meal.food_item.calories_per_100g * meal.quantity_grams / 100),
      protein: totals.protein + (meal.food_item.protein_per_100g * meal.quantity_grams / 100),
      carbs: totals.carbs + (meal.food_item.carbs_per_100g * meal.quantity_grams / 100),
      fat: totals.fat + (meal.food_item.fat_per_100g * meal.quantity_grams / 100),
      fiber: totals.fiber + (meal.food_item.fiber_per_100g * meal.quantity_grams / 100)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  };

  const totals = calculateTotals();

  const addFood = async (food: Food, quantity: number = 100) => {
    const targetStudentId = userProfile?.id; // Use profile ID for current user (student view)
    
    if (!targetStudentId) {
      toast({
        title: "Erro",
        description: "Perfil de aluno não encontrado. Faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('meal_entries')
        .insert({
          student_id: targetStudentId,
          food_item_id: food.id,
          quantity_grams: quantity,
          meal_type: selectedMeal,
          meal_date: selectedDate
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Alimento adicionado à refeição"
      });

      // Refresh data
      fetchData();

    } catch (error) {
      console.error('Error adding food:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o alimento",
        variant: "destructive"
      });
    }
  };

  const removeMeal = async (mealId: string) => {
    try {
      const { error } = await supabase
        .from('meal_entries')
        .delete()
        .eq('id', mealId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Alimento removido da refeição"
      });

      // Refresh data
      fetchData();

    } catch (error) {
      console.error('Error removing meal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o alimento",
        variant: "destructive"
      });
    }
  };

  const getMealIcon = (meal: string) => {
    switch (meal) {
      case 'breakfast': return <Coffee className="h-4 w-4" />;
      case 'lunch': return <Utensils className="h-4 w-4" />;
      case 'snack': return <Cookie className="h-4 w-4" />;
      case 'dinner': return <Sandwich className="h-4 w-4" />;
      default: return <Utensils className="h-4 w-4" />;
    }
  };

  const getMealName = (meal: string) => {
    switch (meal) {
      case 'breakfast': return 'Café da Manhã';
      case 'lunch': return 'Almoço';
      case 'snack': return 'Lanche';
      case 'dinner': return 'Jantar';
      default: return meal;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Carregando...</h1>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Nutrição
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe a alimentação e metas nutricionais dos alunos
          </p>
        </div>
      </div>

      <Tabs defaultValue="tracker" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tracker">Acompanhamento</TabsTrigger>
          <TabsTrigger value="legacy">Visão Legada</TabsTrigger>
        </TabsList>

        <TabsContent value="tracker">
          <NutritionTracker />
        </TabsContent>

        <TabsContent value="legacy">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>

      {/* Nutrition Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Calorias
            </CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {Math.round(totals.calories)}/{nutritionGoals.calories}
            </div>
            <Progress 
              value={(totals.calories / nutritionGoals.calories) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(nutritionGoals.calories - totals.calories)} restantes
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Proteína
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {Math.round(totals.protein)}g
            </div>
            <Progress 
              value={(totals.protein / nutritionGoals.protein) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Meta: {nutritionGoals.protein}g
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Carboidratos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {Math.round(totals.carbs)}g
            </div>
            <Progress 
              value={(totals.carbs / nutritionGoals.carbs) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Meta: {nutritionGoals.carbs}g
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gorduras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {Math.round(totals.fat)}g
            </div>
            <Progress 
              value={(totals.fat / nutritionGoals.fat) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Meta: {nutritionGoals.fat}g
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fibras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {Math.round(totals.fiber)}g
            </div>
            <Progress 
              value={(totals.fiber / nutritionGoals.fiber) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Meta: {nutritionGoals.fiber}g
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Food Diary */}
        <Card className="shadow-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Apple className="h-5 w-5 text-primary" />
              Diário Alimentar
            </CardTitle>
            <CardDescription>
              Registre suas refeições do dia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedMeal} onValueChange={(value) => setSelectedMeal(value as any)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="breakfast" className="text-xs">Café</TabsTrigger>
                <TabsTrigger value="lunch" className="text-xs">Almoço</TabsTrigger>
                <TabsTrigger value="snack" className="text-xs">Lanche</TabsTrigger>
                <TabsTrigger value="dinner" className="text-xs">Jantar</TabsTrigger>
              </TabsList>
              
              {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((meal) => (
                <TabsContent key={meal} value={meal} className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    {getMealIcon(meal)}
                    <h4 className="font-semibold">{getMealName(meal)}</h4>
                  </div>
                  
                  {todayMeals
                    .filter(entry => entry.meal_type === meal)
                    .map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{entry.food_item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.quantity_grams}g • {Math.round(entry.food_item.calories_per_100g * entry.quantity_grams / 100)} cal
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMeal(entry.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  
                  {todayMeals.filter(entry => entry.meal_type === meal).length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <p className="text-sm">Nenhum alimento adicionado</p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Food Search */}
        <Card className="shadow-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Buscar Alimentos
            </CardTitle>
            <CardDescription>
              Encontre e adicione alimentos às suas refeições
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Busque por alimentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredFoods.map((food) => (
                <div key={food.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{food.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {food.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {food.calories_per_100g} cal • P: {food.protein_per_100g}g • C: {food.carbs_per_100g}g • G: {food.fat_per_100g}g
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addFood(food)}
                    className="gradient-primary text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {filteredFoods.length === 0 && searchTerm && (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">Nenhum alimento encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Nutrition;