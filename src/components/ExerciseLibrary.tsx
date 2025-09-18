import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Play, 
  Clock, 
  Target, 
  Dumbbell,
  Heart,
  Activity,
  Plus,
  Loader2
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
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateExerciseOpen, setIsCreateExerciseOpen] = useState(false);
  const [isSubmittingNewExercise, setIsSubmittingNewExercise] = useState(false);
  const [newExerciseForm, setNewExerciseForm] = useState({
    name: "",
    category: "Força",
    muscle_groups: "", // comma-separated string
    difficulty: "Iniciante",
    equipment: "", // comma-separated string
    instructions: "", // newline-separated string
    tips: "", // newline-separated string
    sets: "",
    reps: "",
    rest_time: "",
    duration: "",
    video_url: "",
    image_url: ""
  });

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
      toast({
        title: "Erro",
        description: "Não foi possível carregar os exercícios.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewExercise = async () => {
    setIsSubmittingNewExercise(true);
    try {
      const { name, category, muscle_groups, difficulty, equipment, instructions, tips, sets, reps, rest_time, duration, video_url, image_url } = newExerciseForm;

      if (!name || !category || !muscle_groups || !difficulty || !equipment || !instructions) {
        toast({
          title: "Campos Obrigatórios",
          description: "Preencha todos os campos obrigatórios para criar o exercício.",
          variant: "destructive"
        });
        setIsSubmittingNewExercise(false);
        return;
      }

      const exerciseData = {
        name: name.trim(),
        category,
        muscle_groups: muscle_groups.split(',').map(s => s.trim()).filter(Boolean),
        difficulty,
        equipment: equipment.split(',').map(s => s.trim()).filter(Boolean),
        instructions: instructions.split('\n').map(s => s.trim()).filter(Boolean),
        tips: tips ? tips.split('\n').map(s => s.trim()).filter(Boolean) : null,
        sets: sets ? parseInt(sets) : null,
        reps: reps ? parseInt(reps) : null,
        rest_time: rest_time ? parseInt(rest_time) : null,
        duration: duration ? parseInt(duration) : null,
        video_url: video_url.trim() || null,
        image_url: image_url.trim() || null
      };

      const { error } = await supabase.from('exercises').insert(exerciseData);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Exercício criado e adicionado à biblioteca."
      });
      setIsCreateExerciseOpen(false);
      setNewExerciseForm({
        name: "", category: "Força", muscle_groups: "", difficulty: "Iniciante", equipment: "",
        instructions: "", tips: "", sets: "", reps: "", rest_time: "", duration: "", video_url: "", image_url: ""
      });
      fetchExercises(); // Refresh the list
    } catch (error) {
      console.error("Error creating exercise:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o exercício.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingNewExercise(false);
    }
  };

  const categories = ["all", "Força", "Cardio", "Funcional", "HIIT", "Flexibilidade"];

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
      case 'Flexibilidade': return <Activity className="h-4 w-4" />; // Usando Activity para Flexibilidade
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
        <Dialog open={isCreateExerciseOpen} onOpenChange={setIsCreateExerciseOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white">
              <Plus className="mr-2 h-4 w-4" />
              Novo Exercício
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Exercício</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-exercise-name">Nome do Exercício *</Label>
                <Input
                  id="new-exercise-name"
                  value={newExerciseForm.name}
                  onChange={(e) => setNewExerciseForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Agachamento Livre"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-exercise-category">Categoria *</Label>
                  <Select
                    value={newExerciseForm.category}
                    onValueChange={(value) => setNewExerciseForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Força">Força</SelectItem>
                      <SelectItem value="Cardio">Cardio</SelectItem>
                      <SelectItem value="Funcional">Funcional</SelectItem>
                      <SelectItem value="HIIT">HIIT</SelectItem>
                      <SelectItem value="Flexibilidade">Flexibilidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-exercise-difficulty">Dificuldade *</Label>
                  <Select
                    value={newExerciseForm.difficulty}
                    onValueChange={(value) => setNewExerciseForm(prev => ({ ...prev, difficulty: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a dificuldade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Iniciante">Iniciante</SelectItem>
                      <SelectItem value="Intermediário">Intermediário</SelectItem>
                      <SelectItem value="Avançado">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-exercise-muscle-groups">Grupos Musculares (separados por vírgula) *</Label>
                <Input
                  id="new-exercise-muscle-groups"
                  value={newExerciseForm.muscle_groups}
                  onChange={(e) => setNewExerciseForm(prev => ({ ...prev, muscle_groups: e.target.value }))}
                  placeholder="Ex: Peitoral, Tríceps, Ombros"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-exercise-equipment">Equipamentos (separados por vírgula) *</Label>
                <Input
                  id="new-exercise-equipment"
                  value={newExerciseForm.equipment}
                  onChange={(e) => setNewExerciseForm(prev => ({ ...prev, equipment: e.target.value }))}
                  placeholder="Ex: Halteres, Banco, Barra"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-exercise-instructions">Instruções (uma por linha) *</Label>
                <Textarea
                  id="new-exercise-instructions"
                  value={newExerciseForm.instructions}
                  onChange={(e) => setNewExerciseForm(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="1. Posição inicial...\n2. Execute o movimento..."
                  rows={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-exercise-tips">Dicas (uma por linha)</Label>
                <Textarea
                  id="new-exercise-tips"
                  value={newExerciseForm.tips}
                  onChange={(e) => setNewExerciseForm(prev => ({ ...prev, tips: e.target.value }))}
                  placeholder="Ex: Mantenha o core ativado\nRespire profundamente"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-exercise-sets">Séries (opcional)</Label>
                  <Input
                    id="new-exercise-sets"
                    type="number"
                    value={newExerciseForm.sets}
                    onChange={(e) => setNewExerciseForm(prev => ({ ...prev, sets: e.target.value }))}
                    placeholder="Ex: 3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-exercise-reps">Repetições (opcional)</Label>
                  <Input
                    id="new-exercise-reps"
                    type="number"
                    value={newExerciseForm.reps}
                    onChange={(e) => setNewExerciseForm(prev => ({ ...prev, reps: e.target.value }))}
                    placeholder="Ex: 12"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-exercise-rest-time">Tempo de Descanso (segundos, opcional)</Label>
                  <Input
                    id="new-exercise-rest-time"
                    type="number"
                    value={newExerciseForm.rest_time}
                    onChange={(e) => setNewExerciseForm(prev => ({ ...prev, rest_time: e.target.value }))}
                    placeholder="Ex: 60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-exercise-duration">Duração (segundos, opcional)</Label>
                  <Input
                    id="new-exercise-duration"
                    type="number"
                    value={newExerciseForm.duration}
                    onChange={(e) => setNewExerciseForm(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="Ex: 180 (para cardio)"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-exercise-video-url">URL do Vídeo (opcional)</Label>
                <Input
                  id="new-exercise-video-url"
                  value={newExerciseForm.video_url}
                  onChange={(e) => setNewExerciseForm(prev => ({ ...prev, video_url: e.target.value }))}
                  placeholder="Ex: https://youtube.com/watch?v=..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-exercise-image-url">URL da Imagem (opcional)</Label>
                <Input
                  id="new-exercise-image-url"
                  value={newExerciseForm.image_url}
                  onChange={(e) => setNewExerciseForm(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="Ex: https://example.com/image.jpg"
                />
              </div>
              <Button onClick={handleCreateNewExercise} disabled={isSubmittingNewExercise}>
                {isSubmittingNewExercise && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Exercício
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
                    <Button variant="outline" size="sm" onClick={() => window.open(selectedExercise.video_url!, '_blank')}>
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