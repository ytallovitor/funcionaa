import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast"; // Keep this for shadcn toast
import { 
  Search, 
  Clock, 
  Target,
  Activity,
  TrendingUp,
  Dumbbell, // Keep Dumbbell as it's used in the JSX for icons
  Trash2,
  Edit,
  Loader2
} from "lucide-react";
import AssignWorkoutDialog from "@/components/AssignWorkoutDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ExerciseLibrary from "@/components/ExerciseLibrary";
import WorkoutCreator from "@/components/WorkoutCreator";

// Re-declarando interfaces para garantir consistência e evitar conflitos
interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle_groups: string[];
  difficulty: string;
  equipment: string[];
  instructions: string[];
  tips: string[] | null; // Make tips nullable
  sets?: number | null; // Make sets nullable
  reps?: number | null; // Make reps nullable
  rest_time?: number | null; // Make rest_time nullable
  duration?: number | null; // Make duration nullable
  video_url?: string | null;
  image_url?: string | null;
}

interface WorkoutExercise {
  id?: string;
  exercise: Exercise;
  sets: number;
  reps: number;
  weight_kg?: number | null;
  duration?: number | null;
  rest_time: number;
  notes?: string | null;
  order_index: number;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  difficulty: string;
  estimated_duration: number | null;
  equipment_needed: string[] | null;
  is_public: boolean | null;
  workout_template_exercises?: WorkoutExercise[];
}

const Workouts = () => {
  const navigate = useNavigate();
  const { workoutId: editingWorkoutId } = useParams<{ workoutId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(editingWorkoutId ? "creator" : "templates");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null); // Kept as any for now, can be refined if needed
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutTemplate | null>(null);
  const [workoutToEdit, setWorkoutToEdit] = useState<WorkoutTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (editingWorkoutId && workoutTemplates.length > 0) {
      const foundWorkout = workoutTemplates.find(wt => wt.id === editingWorkoutId);
      if (foundWorkout) {
        setWorkoutToEdit(foundWorkout);
        setActiveTab("creator");
      } else {
        toast({
          title: "Erro",
          description: "Treino não encontrado para edição.",
          variant: "destructive"
        });
        navigate('/workouts');
      }
    } else if (!editingWorkoutId && activeTab === "creator") {
      setWorkoutToEdit(null);
    }
  }, [editingWorkoutId, workoutTemplates, navigate, toast, activeTab]);


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
            id, order_index,
            sets,
            reps,
            weight_kg,
            duration,
            rest_time,
            notes,
            exercises (*)
          )
        `)
        .eq('trainer_id', profile?.id);

      if (templatesError) throw templatesError;
      
      const typedTemplates = templates as WorkoutTemplate[];
      setWorkoutTemplates(typedTemplates || []);

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

  const handleEditWorkout = (workoutId: string) => {
    navigate(`/workouts/edit/${workoutId}`);
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    setIsDeleting(true);
    try {
      // Delete associated workout_template_exercises first
      const { error: deleteExercisesError } = await supabase
        .from('workout_template_exercises')
        .delete()
        .eq('workout_template_id', workoutId);

      if (deleteExercisesError) throw deleteExercisesError;

      // Then delete the workout template
      const { error: deleteTemplateError } = await supabase
        .from('workout_templates')
        .delete()
        .eq('id', workoutId);

      if (deleteTemplateError) throw deleteTemplateError;

      toast({
        title: "Sucesso!",
        description: "Treino excluído com sucesso."
      });
      fetchData(); // Refresh the list
    } catch (err: any) {
      console.error("Error deleting workout:", err);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o treino: " + err.message,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
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

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value as "templates" | "creator" | "library" | "analytics");
        if (value !== "creator") {
          navigate('/workouts'); // Clear edit state from URL
        }
      }} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Modelos de Treino</TabsTrigger>
          <TabsTrigger value="creator">Criar/Editar Treino</TabsTrigger>
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
                      <div className="text-2xl font-bold text-primary">{template.workout_template_exercises?.length || 0}</div>
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
                      <Button variant="outline" size="sm" onClick={() => handleViewWorkout(template.id)}>
                        Visualizar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditWorkout(template.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={isDeleting}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente o modelo de treino "{template.name}" e todos os seus exercícios associados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteWorkout(template.id)} disabled={isDeleting}>
                              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
          <WorkoutCreator onSave={fetchData} editingWorkout={workoutToEdit} onCancel={() => navigate('/workouts')} />
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
                <div className="text-2xl font-bold text-primary">
                  {workoutTemplates.length}
                </div>
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