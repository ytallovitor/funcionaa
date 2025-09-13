import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Import useNavigate
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ExerciseLibrary from "@/components/ExerciseLibrary";
import WorkoutCreator from "@/components/WorkoutCreator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Clock, 
  Target,
  Activity,
  TrendingUp,
  Dumbbell
} from "lucide-react";
import AssignWorkoutDialog from "@/components/AssignWorkoutDialog";

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle_groups: string[];
  difficulty: string;
  equipment: string[];
  instructions: string[];
  tips: string[];
  sets?: number;
  reps?: number;
  rest_time?: number;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  estimated_duration: number;
  equipment_needed: string[];
  is_public: boolean;
  exercises?: {
    exercise: Exercise;
    order_index: number;
    sets?: number;
    reps?: number;
    weight_kg?: number;
    rest_time?: number;
    notes?: string;
  }[];
}

const Workouts = () => {
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(location.state?.suggestedWorkout ? "creator" : "templates");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutTemplate | null>(null);

  // Create template form state
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    category: "Força",
    difficulty: "Iniciante" as "Iniciante" | "Intermediário" | "Avançado",
    estimated_duration: 60,
    equipment_needed: [] as string[],
    is_public: false
  });
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      
      setUserProfile(profile);

      const { data: templates, error: templatesError } = await supabase
        .from('workout_templates')
        .select(`
          *,
          workout_template_exercises (
            order_index,
            sets,
            reps,
            weight_kg,
            rest_time,
            notes,
            exercises (*)
          )
        `)
        .eq('trainer_id', profile?.id);

      if (templatesError) throw templatesError;
      setWorkoutTemplates(templates || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClick = (template: WorkoutTemplate) => {
    setSelectedWorkout(template);
    setIsAssignDialogOpen(true);
  };

  const handleViewWorkout = (workoutId: string) => {
    navigate(`/workouts/${workoutId}`);
  };

  const categories = ["all", "Força", "Cardio", "Funcional", "HIIT", "Flexibilidade"];

  const filteredTemplates = workoutTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
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
            Treinos
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie treinos, templates e acompanhe o progresso dos alunos
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Modelos de Treino</TabsTrigger>
          <TabsTrigger value="creator">Criar Treino</TabsTrigger>
          <TabsTrigger value="library">Biblioteca de Exercícios</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar modelos de treino..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === "all" ? "Todos" : category}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="shadow-primary/10 border-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getDifficultyColor(template.difficulty)} text-white text-xs`}>
                        {template.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{template.estimated_duration}</div>
                      <div className="text-xs text-muted-foreground">Minutos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{template.exercises?.length || 0}</div>
                      <div className="text-xs text-muted-foreground">Exercícios</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{template.equipment_needed?.length || 0}</div>
                      <div className="text-xs text-muted-foreground">Equipamentos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{template.is_public ? 'Sim' : 'Não'}</div>
                      <div className="text-xs text-muted-foreground">Público</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {template.equipment_needed?.slice(0, 3).map((equipment, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {equipment}
                        </Badge>
                      ))}
                      {template.equipment_needed && template.equipment_needed.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.equipment_needed.length - 3}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewWorkout(template.id)}> {/* ADDED onClick */}
                        Visualizar
                      </Button>
                      <Button size="sm" className="gradient-primary text-white" onClick={() => handleAssignClick(template)}>
                        Atribuir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <div className="text-muted-foreground">
                  <p>Nenhum modelo de treino encontrado</p>
                  <p className="text-sm mt-1">
                    {searchTerm || selectedCategory !== "all" 
                      ? "Tente ajustar os filtros de busca" 
                      : "Crie seu primeiro modelo de treino"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="creator" className="space-y-6">
          <WorkoutCreator onSave={fetchData} editingWorkout={location.state?.suggestedWorkout} />
        </TabsContent>

        <TabsContent value="library" className="space-y-6">
          <ExerciseLibrary />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-primary/10 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Templates Ativos
                </CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{workoutTemplates.length}</div>
                <p className="text-xs text-muted-foreground">
                  Modelos de treino criados
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-primary/10 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Treinos Esta Semana
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">12</div>
                <p className="text-xs text-muted-foreground">
                  +3 desde a semana passada
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-primary/10 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taxa de Conclusão
                </CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">89%</div>
                <p className="text-xs text-muted-foreground">
                  +5% vs mês anterior
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-primary/10 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Duração Média
                </CardTitle>
                <Clock className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">52 min</div>
                <p className="text-xs text-muted-foreground">
                  Tempo médio por sessão
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      <AssignWorkoutDialog
        workoutTemplate={selectedWorkout}
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        onAssigned={fetchData}
      />
    </div>
  );
};

export default Workouts;