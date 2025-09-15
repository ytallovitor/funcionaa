import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Play, 
  Clock, 
  Target, 
  Dumbbell,
  Heart,
  Activity,
  Plus
} from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle_groups: string[];
  difficulty: string;
  equipment: string[];
  instructions: string[];
  tips: string[] | null; // Made nullable for consistency
  duration?: number | null; // Made nullable for consistency
  reps?: number | null; // Made nullable for consistency
  sets?: number | null; // Made nullable for consistency
  rest_time?: number | null; // Made nullable for consistency
  video_url?: string | null;
  image_url?: string | null;
}

interface ExerciseLibraryProps {
  onSelectExercise?: (exercise: Exercise) => void;
  compact?: boolean;
}

const ExerciseLibrary = ({ onSelectExercise, compact = false }: ExerciseLibraryProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Use real data from Supabase
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["all", "Força", "Cardio", "Funcional", "HIIT"];

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.muscle_groups.some(muscle => muscle.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Iniciante': return 'bg-green-500';
      case 'Intermediário': return 'bg-yellow-500';
      case 'Avançado': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Força': return <Dumbbell className="h-4 w-4" />;
      case 'Cardio': return <Heart className="h-4 w-4" />;
      case 'HIIT': return <Activity className="h-4 w-4" />;
      case 'Funcional': return <Target className="h-4 w-4" />;
      default: return <Dumbbell className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando exercícios...</div>;
  }

  if (compact) {
    return (
      <Card className="h-96">
        <CardHeader className="p-4">
          <CardTitle className="text-lg">Exercícios</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar exercícios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-64">
            <div className="p-4 space-y-2">
              {filteredExercises.map((exercise) => (
                <div key={exercise.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-accent/50">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{exercise.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {exercise.muscle_groups.join(", ")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onSelectExercise?.(exercise)}
                    className="gradient-primary text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar exercícios, grupos musculares..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="text-xs">
                {category === "all" ? "Todos" : category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Exercise List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredExercises.map((exercise) => (
            <Card 
              key={exercise.id} 
              className={`cursor-pointer transition-colors ${
                selectedExercise?.id === exercise.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedExercise(exercise)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getCategoryIcon(exercise.category)}
                      {exercise.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {exercise.muscle_groups.join(" • ")}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={`${getDifficultyColor(exercise.difficulty)} text-white text-xs`}
                    >
                      {exercise.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {exercise.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {exercise.sets && (
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      {exercise.sets} séries x {exercise.reps} reps
                    </div>
                  )}
                  {exercise.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {Math.round(exercise.duration / 60)} min
                    </div>
                  )}
                  {exercise.rest_time && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {exercise.rest_time}s descanso
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground">
                    <strong>Equipamentos:</strong> {exercise.equipment.join(", ")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Exercise Details */}
        <div className="lg:col-span-1">
          {selectedExercise ? (
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getCategoryIcon(selectedExercise.category)}
                  {selectedExercise.name}
                </CardTitle>
                <div className="flex gap-2">
                  <Badge className={`${getDifficultyColor(selectedExercise.difficulty)} text-white`}>
                    {selectedExercise.difficulty}
                  </Badge>
                  <Badge variant="outline">
                    {selectedExercise.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedExercise.video_url && (
                  <div className="relative bg-muted rounded-lg h-40 flex items-center justify-center">
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Ver Demonstração
                    </Button>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Grupos Musculares</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedExercise.muscle_groups.map((muscle) => (
                      <Badge key={muscle} variant="secondary" className="text-xs">
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Instruções</h4>
                  <ol className="text-sm space-y-1 text-muted-foreground">
                    {selectedExercise.instructions.map((instruction, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="text-primary font-medium">{index + 1}.</span>
                        {instruction}
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Dicas</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    {selectedExercise.tips?.map((tip, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="text-primary">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {onSelectExercise && (
                  <Button 
                    onClick={() => onSelectExercise(selectedExercise)}
                    className="w-full gradient-primary text-white"
                  >
                    Adicionar ao Treino
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="sticky top-4">
              <CardContent className="flex items-center justify-center h-64 text-center">
                <div>
                  <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Selecione um exercício para ver os detalhes
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseLibrary;