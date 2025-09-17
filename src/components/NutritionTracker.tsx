import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Plus, 
  Search, 
  Apple, 
  Coffee, 
  Utensils, 
  Moon,
  Target,
  Trash2
} from "lucide-react";

interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  category: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number;
  barcode?: string;
}

interface MealEntry {
  id: string;
  student_id: string;
  food_item_id: string;
  food_items: FoodItem;
  quantity_grams: number;
  meal_type: string;
  meal_date: string;
  created_at: string;
}

interface NutritionGoal {
  id: string;
  student_id: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
}

interface NutritionTrackerProps {
  studentId?: string;
}

const NutritionTracker = ({ studentId }: NutritionTrackerProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [mealEntries, setMealEntries] = useState<MealEntry[]>([]);
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal | null>(null);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState("cafe_da_manha");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(100);

  const mealTypes = {
    cafe_da_manha: { name: "Café da Manhã", icon: Coffee },
    almoco: { name: "Almoço", icon: Utensils },
    lanche: { name: "Lanche", icon: Apple },
    jantar: { name: "Jantar", icon: Moon }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, studentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchMealEntries(),
        fetchNutritionGoal(),
        fetchFoodItems()
      ]);
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMealEntries = async () => {
    try {
      const targetStudentId = studentId || user?.id;
      if (!targetStudentId) return;

      const { data, error } = await supabase
        .from('meal_entries')
        .select(`
          *,
          food_items (*)
        `)
        .eq('student_id', targetStudentId)
        .eq('meal_date', selectedDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMealEntries(data || []);
    } catch (error) {
      console.error('Error fetching meal entries:', error);
    }
  };

  const fetchNutritionGoal = async () => {
    try {
      const targetStudentId = studentId || user?.id;
      if (!targetStudentId) return;

      const { data, error } = await supabase
        .from('nutrition_goals')
        .select('*')
        .eq('student_id', targetStudentId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setNutritionGoal(data);
    } catch (error) {
      console.error('Error fetching nutrition goal:', error);
    }
  };

  const fetchFoodItems = async () => {
    try {
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .order('name');

      if (error) throw error;
      setFoodItems(data || []);
    } catch (error) {
      console.error('Error fetching food items:', error);
    }
  };

  const addMealEntry = async () => {
    if (!selectedFood) return;

    try {
      const targetStudentId = studentId || user?.id;
      if (!targetStudentId) return;

      const { error } = await supabase
        .from('meal_entries')
        .insert({
          student_id: targetStudentId,
          food_item_id: selectedFood.id,
          quantity_grams: quantity,
          meal_type: selectedMealType,
          meal_date: selectedDate
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Alimento adicionado ao diário"
      });

      setIsAddFoodOpen(false);
      setSelectedFood(null);
      setQuantity(100);
      fetchMealEntries();
    } catch (error) {
      console.error('Error adding meal entry:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o alimento",
        variant: "destructive"
      });
    }
  };

  const removeMealEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('meal_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Alimento removido do diário"
      });

      fetchMealEntries();
    } catch (error) {
      console.error('Error removing meal entry:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o alimento",
        variant: "destructive"
      });
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

  const filteredFoodItems = foodItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalNutrition = calculateNutrition(mealEntries);

  const getNutritionProgress = (consumed: number, goal: number) => {
    return goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
  };

  if (loading) {
    return <div className="text-center py-8">Carregando dados nutricionais...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Diário Nutricional</h2>
          <p className="text-muted-foreground">Acompanhe sua alimentação diária</p>
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <Dialog open={isAddFoodOpen} onOpenChange={setIsAddFoodOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Alimento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Alimento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mealType">Refeição</Label>
                  <Select value={selectedMealType} onValueChange={setSelectedMealType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(mealTypes).map(([key, meal]) => (
                        <SelectItem key={key} value={key}>
                          {meal.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search">Buscar Alimento</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Digite o nome do alimento..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <ScrollArea className="h-48 border rounded-lg p-2">
                  <div className="space-y-2">
                    {filteredFoodItems.map((food) => (
                      <div
                        key={food.id}
                        className={`p-3 border rounded-lg cursor-pointer hover:bg-accent/50 ${
                          selectedFood?.id === food.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedFood(food)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{food.name}</h4>
                            {food.brand && (
                              <p className="text-sm text-muted-foreground">{food.brand}</p>
                            )}
                          </div>
                          <Badge variant="outline">{food.category}</Badge>
                        </div>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{food.calories_per_100g} kcal</span>
                          <span>P: {food.protein_per_100g}g</span>
                          <span>C: {food.carbs_per_100g}g</span>
                          <span>G: {food.fat_per_100g}g</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {selectedFood && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantidade (gramas)</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                        min="1"
                        max="2000"
                      />
                    </div>

                    <div className="p-3 bg-accent/30 rounded-lg">
                      <h4 className="font-medium mb-2">Valores Nutricionais ({quantity}g)</h4>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Calorias</span>
                          <p className="font-medium">
                            {Math.round((selectedFood.calories_per_100g * quantity) / 100)} kcal
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Proteína</span>
                          <p className="font-medium">
                            {Math.round((selectedFood.protein_per_100g * quantity) / 100)}g
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Carboidratos</span>
                          <p className="font-medium">
                            {Math.round((selectedFood.carbs_per_100g * quantity) / 100)}g
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Gordura</span>
                          <p className="font-medium">
                            {Math.round((selectedFood.fat_per_100g * quantity) / 100)}g
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button onClick={addMealEntry} className="w-full gradient-primary text-white">
                      Adicionar ao Diário
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Nutrition Overview */}
      {nutritionGoal && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Resumo Nutricional
            </CardTitle>
            <CardDescription>
              Progresso das suas metas nutricionais de hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Calorias</span>
                  <span>{Math.round(totalNutrition.calories)}/{nutritionGoal.calories}</span>
                </div>
                <Progress 
                  value={getNutritionProgress(totalNutrition.calories, nutritionGoal.calories)} 
                  className="h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Proteína</span>
                  <span>{Math.round(totalNutrition.protein)}g/{nutritionGoal.protein}g</span>
                </div>
                <Progress 
                  value={getNutritionProgress(totalNutrition.protein, nutritionGoal.protein)} 
                  className="h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Carboidratos</span>
                  <span>{Math.round(totalNutrition.carbs)}g/{nutritionGoal.carbs}g</span>
                </div>
                <Progress 
                  value={getNutritionProgress(totalNutrition.carbs, nutritionGoal.carbs)} 
                  className="h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Gordura</span>
                  <span>{Math.round(totalNutrition.fat)}g/{nutritionGoal.fat}g</span>
                </div>
                <Progress 
                  value={getNutritionProgress(totalNutrition.fat, nutritionGoal.fat)} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meal Entries by Type */}
      <div className="grid md:grid-cols-2 gap-6">
        {Object.entries(mealTypes).map(([mealType, mealConfig]) => {
          const mealEntriesToShow = mealEntries.filter(entry => entry.meal_type === mealType);
          const mealNutrition = calculateNutrition(mealEntriesToShow);

          return (
            <Card key={mealType}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <mealConfig.icon className="h-5 w-5" />
                  {mealConfig.name}
                </CardTitle>
                <CardDescription>
                  {Math.round(mealNutrition.calories)} kcal
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mealEntriesToShow.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Nenhum alimento registrado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mealEntriesToShow.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{entry.food_items.name}</h4>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>{entry.quantity_grams}g</span>
                            <span>
                              {Math.round((entry.food_items.calories_per_100g * entry.quantity_grams) / 100)} kcal
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMealEntry(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default NutritionTracker;