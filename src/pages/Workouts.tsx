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
  const [_userProfile, setUserProfile] = useState<any>(null); // Renamed to _userProfile as it's not used
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-gradient-to-br from-emerald-400/20 to-teal-600/20 rounded-full blur-3xl" />
        <div className="absolute -top-10 -right-20 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-600/10 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent animate-in fade-in slide-in-from-left-4 duration-500">
              Biblioteca de Treinos
            </h1>
            <p className="text-slate-600 text-lg animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
              Crie, gerencie e atribua treinos personalizados para seus alunos
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value as "templates" | "creator" | "library" | "analytics");
        if (value !== "creator") {
          navigate('/workouts'); // Clear edit state from URL
        }
      }} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-slate-50 to-slate-100 p-1.5 rounded-xl shadow-sm border border-slate-200">
          <TabsTrigger value="templates" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg">Modelos de Treino</TabsTrigger>
          <TabsTrigger value="creator" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg">Criar/Editar Treino</TabsTrigger>
          <TabsTrigger value="library" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg">Biblioteca de Exercícios</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg">Analytics</TabsTrigger>
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

          <div className="grid gap-6">
            {filteredTemplates.map((template, index) => (
              <Card key={template.id} className="group relative overflow-hidden border-slate-200 hover:border-emerald-300 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-100 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-teal-600 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-emerald-700 transition-colors duration-300">{template.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getDifficultyColor(template.difficulty)} text-white text-xs px-3 py-1 shadow-md animate-pulse`}>
                        {template.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs px-3 py-1 border-emerald-200 bg-emerald-50 text-emerald-700 font-medium">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <div className="relative text-center group/stat">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-lg transform scale-0 group-hover/stat:scale-100 transition-transform duration-300" />
                      <div className="relative text-3xl font-bold bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent transition-transform duration-300 group-hover/stat:scale-110">{template.estimated_duration}</div>
                      <div className="relative text-xs text-slate-600 font-medium mt-1">Minutos</div>
                    </div>
                    <div className="relative text-center group/stat">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg transform scale-0 group-hover/stat:scale-100 transition-transform duration-300" />
                      <div className="relative text-3xl font-bold bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent transition-transform duration-300 group-hover/stat:scale-110">{template.workout_template_exercises?.length || 0}</div>
                      <div className="relative text-xs text-slate-600 font-medium mt-1">Exercícios</div>
                    </div>
                    <div className="relative text-center group/stat">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg transform scale-0 group-hover/stat:scale-100 transition-transform duration-300" />
                      <div className="relative text-3xl font-bold bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent transition-transform duration-300 group-hover/stat:scale-110">{template.equipment_needed?.length || 0}</div>
                      <div className="relative text-xs text-slate-600 font-medium mt-1">Equipamentos</div>
                    </div>
                    <div className="relative text-center group/stat">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg transform scale-0 group-hover/stat:scale-100 transition-transform duration-300" />
                      <div className="relative text-3xl font-bold bg-gradient-to-br from-orange-600 to-red-600 bg-clip-text text-transparent transition-transform duration-300 group-hover/stat:scale-110">{template.is_public ? 'Sim' : 'Não'}</div>
                      <div className="relative text-xs text-slate-600 font-medium mt-1">Público</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2 flex-wrap">
                      {template.equipment_needed?.slice(0, 3).map((equipment, index) => (
                        <Badge key={index} variant="secondary" className="text-xs px-3 py-1 bg-gradient-to-r from-slate-100 to-slate-200 border border-slate-300 text-slate-700 font-medium hover:from-emerald-50 hover:to-teal-50 hover:border-emerald-300 transition-all duration-300">
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
                      <Button variant="outline" size="sm" onClick={() => handleViewWorkout(template.id)} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-300">
                        Visualizar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditWorkout(template.id)} className="hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 hover:border-amber-300 hover:text-amber-700 transition-all duration-300">
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
                      <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:shadow-xl hover:shadow-emerald-200 transition-all duration-300 hover:scale-105" onClick={() => handleAssignClick(template)}>
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