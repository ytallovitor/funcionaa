import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Plus, Activity, Calendar, Loader2, Edit, Dumbbell, FileText, Archive, Trash2, Clock, AlertTriangle, Check, MoreVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import StudentPortalManager from "@/components/StudentPortalManager";
import EditStudentDialog from "@/components/EditStudentDialog";
import StudentWorkoutManager from "@/components/StudentWorkoutManager";
import AnamnesisForm from "@/components/AnamnesisForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Student {
  id: string;
  name: string;
  age: number;
  gender: string;
  goal: string;
  height: number;
  birth_date?: string;
  created_at: string;
  lastEvaluation?: string;
  bodyFat?: number;
  weight?: number;
  status?: 'active' | 'archived' | 'deleted'; // Opcional: se colunas existirem
  deleted_at?: string; // Opcional: se colunas existirem
}

const Students = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'archived' | 'trash'>('active');
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [managingWorkoutsFor, setManagingWorkoutsFor] = useState<Student | null>(null);
  const [isWorkoutManagerOpen, setIsWorkoutManagerOpen] = useState(false);
  const [anamnesisStudent, setAnamnesisStudent] = useState<Student | null>(null);
  const [isAnamnesisOpen, setIsAnamnesisOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    birth_date: "",
    gender: "",
    goal: "",
    height: ""
  });
  const [trainerId, setTrainerId] = useState<string | null>(null); // Cache para trainer_id
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadTrainerId();
      fetchStudents();
    }
  }, [user]);

  // Fetch trainer_id uma vez no load (cache global para performance)
  const loadTrainerId = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (profile) {
        console.log("Trainer ID cached:", profile.id); // Debug: ID do profile
        setTrainerId(profile.id);
      } else {
        console.error("Trainer profile not found for user:", user?.id);
        toast({
          title: "Erro",
          description: "Perfil de trainer não encontrado. Crie um perfil primeiro.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading trainer ID:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar perfil. Faça login novamente.",
        variant: "destructive"
      });
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      if (!trainerId) {
        console.warn("Trainer ID not loaded yet – retrying...");
        await loadTrainerId(); // Tenta recarregar se não estiver pronto
        if (!trainerId) throw new Error('Trainer ID não disponível');
      }

      console.log("Fetching students for trainer:", trainerId); // Debug

      const { data: studentsData, error } = await supabase
        .from('students')
        .select(`
          *,
          evaluations (
            evaluation_date,
            weight,
            body_fat_percentage
          )
        `)
        .eq('trainer_id', trainerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch error:', error); // Log detalhado
        throw error;
      }

      const processedStudents = studentsData?.map(student => {
        const latestEvaluation = student.evaluations?.[0];
        return {
          ...student,
          lastEvaluation: latestEvaluation?.evaluation_date,
          weight: latestEvaluation?.weight,
          bodyFat: latestEvaluation?.body_fat_percentage,
          // Status defaults (se colunas não existirem, fica undefined – código lida com isso)
          status: student.status || 'active',
          deleted_at: student.deleted_at || null
        };
      }) || [];

      console.log("Students fetched:", processedStudents.length, "students"); // Debug
      setStudents(processedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar alunos. Verifique console para detalhes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!trainerId) throw new Error('ID do trainer não encontrado. Recarregue a página.');

      const age = formData.birth_date ? 
        new Date().getFullYear() - new Date(formData.birth_date).getFullYear() : 0;

      const { error } = await supabase
        .from('students')
        .insert({
          name: formData.name,
          age: age,
          birth_date: formData.birth_date || null,
          gender: formData.gender,
          goal: formData.goal,
          height: parseFloat(formData.height),
          trainer_id: trainerId,
          status: 'active',
          deleted_at: null
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Aluno adicionado com sucesso"
      });

      setFormData({ name: "", birth_date: "", gender: "", goal: "", height: "" });
      setIsDialogOpen(false);
      fetchStudents();
    } catch (error: any) {
      console.error('Error adding student:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao adicionar aluno",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Todas as funções usam trainerId cacheado + logs + validação
  const archiveStudent = async (studentId: string) => {
    try {
      if (!trainerId) {
        throw new Error('ID do trainer não carregado. Recarregue a página.');
      }

      console.log("Archiving student", studentId, "for trainer", trainerId); // Debug

      // Verifica se aluno existe e pertence ao trainer (RLS-safe)
      const { data: studentCheck, error: checkError } = await supabase
        .from('students')
        .select('id, trainer_id')
        .eq('id', studentId)
        .eq('trainer_id', trainerId)
        .single();

      if (checkError) {
        console.error('Check error:', checkError);
        throw new Error('Falha na verificação do aluno.');
      }

      if (!studentCheck) {
        throw new Error('Aluno não encontrado ou não pertence a você.');
      }

      // UPDATE com colunas (agora existem após SQL)
      const { error } = await supabase
        .from('students')
        .update({ 
          status: 'archived',
          deleted_at: null  // Reset se estava em lixeira
        })
        .eq('id', studentId)
        .eq('trainer_id', trainerId);

      if (error) {
        console.error('Update error details:', error); // Log exato do erro Supabase
        if (error.code === '42703') { // Column does not exist
          throw new Error('Colunas "status" ou "deleted_at" não existem no banco. Execute o SQL fornecido primeiro.');
        }
        if (error.code === '42501') { // Permission denied (RLS)
          throw new Error('Permissão negada. Verifique RLS policies no Supabase.');
        }
        if (error.code === 'PGRST116') { // No rows
          throw new Error('Nenhuma linha atualizada – aluno pode não existir ou RLS bloqueando.');
        }
        throw error;
      }

      console.log("Student archived successfully"); // Debug sucesso
      toast({
        title: "Sucesso!",
        description: "Aluno arquivado com sucesso."
      });
      fetchStudents();
    } catch (error: any) {
      console.error('Detailed error archiving student:', error); // Log completo para debug
      toast({
        title: "Erro ao Arquivar",
        description: error.message || "Falha ao arquivar aluno. Verifique console (F12) para detalhes.",
        variant: "destructive"
      });
    }
  };

  // Similar para outras funções (unarchive, deleteToTrash, etc.) – uso trainerId cacheado
  const unarchiveStudent = async (studentId: string) => {
    try {
      if (!trainerId) throw new Error('ID do trainer não carregado.');

      console.log("Unarchiving student", studentId, "for trainer", trainerId);

      const { data: studentCheck } = await supabase
        .from('students')
        .select('id')
        .eq('id', studentId)
        .eq('trainer_id', trainerId)
        .single();

      if (!studentCheck) {
        throw new Error('Aluno não encontrado ou não pertence a você.');
      }

      const { error } = await supabase
        .from('students')
        .update({ 
          status: 'active',
          deleted_at: null
        })
        .eq('id', studentId)
        .eq('trainer_id', trainerId);

      if (error) {
        console.error('Update error details:', error);
        if (error.code === '42703') {
          throw new Error('Colunas "status" ou "deleted_at" não existem. Execute o SQL.');
        }
        if (error.code === '42501') {
          throw new Error('Permissão negada. Verifique RLS policies no Supabase.');
        }
        if (error.code === 'PGRST116') {
          throw new Error('Nenhuma linha atualizada – aluno pode não existir.');
        }
        throw error;
      }

      console.log("Student unarchived successfully");
      toast({
        title: "Sucesso!",
        description: "Aluno desarquivado com sucesso."
      });
      fetchStudents();
    } catch (error: any) {
      console.error('Detailed error unarchiving student:', error);
      toast({
        title: "Erro ao Desarquivar",
        description: error.message || "Falha ao desarquivar aluno.",
        variant: "destructive"
      });
    }
  };

  const deleteToTrash = async (studentId: string) => {
    try {
      if (!trainerId) throw new Error('ID do trainer não carregado.');

      console.log("Moving student to trash", studentId, "for trainer", trainerId);

      const { data: studentCheck } = await supabase
        .from('students')
        .select('id')
        .eq('id', studentId)
        .eq('trainer_id', trainerId)
        .single();

      if (!studentCheck) {
        throw new Error('Aluno não encontrado ou não pertence a você.');
      }

      const { error } = await supabase
        .from('students')
        .update({ 
          status: 'deleted',
          deleted_at: new Date().toISOString()
        })
        .eq('id', studentId)
        .eq('trainer_id', trainerId);

      if (error) {
        console.error('Update error details:', error);
        if (error.code === '42703') {
          throw new Error('Colunas "status" ou "deleted_at" não existem. Execute o SQL.');
        }
        if (error.code === '42501') {
          throw new Error('Permissão negada. Verifique RLS policies no Supabase.');
        }
        throw error;
      }

      console.log("Student moved to trash successfully");
      toast({
        title: "Sucesso!",
        description: "Aluno movido para lixeira (90 dias para recuperação)."
      });
      fetchStudents();
    } catch (error: any) {
      console.error('Detailed error moving to trash:', error);
      toast({
        title: "Erro ao Mover para Lixeira",
        description: error.message || "Falha ao mover aluno para lixeira.",
        variant: "destructive"
      });
    }
  };

  const restoreFromTrash = async (studentId: string) => {
    try {
      if (!trainerId) throw new Error('ID do trainer não carregado.');

      console.log("Restoring student from trash", studentId, "for trainer", trainerId);

      const { data: studentCheck } = await supabase
        .from('students')
        .select('id')
        .eq('id', studentId)
        .eq('trainer_id', trainerId)
        .single();

      if (!studentCheck) {
        throw new Error('Aluno não encontrado ou não pertence a você.');
      }

      const { error } = await supabase
        .from('students')
        .update({ 
          status: 'active',
          deleted_at: null
        })
        .eq('id', studentId)
        .eq('trainer_id', trainerId);

      if (error) {
        console.error('Update error details:', error);
        if (error.code === '42703') {
          throw new Error('Colunas "status" ou "deleted_at" não existem. Execute o SQL.');
        }
        if (error.code === '42501') {
          throw new Error('Permissão negada. Verifique RLS policies no Supabase.');
        }
        throw error;
      }

      console.log("Student restored successfully");
      toast({
        title: "Sucesso!",
        description: "Aluno restaurado da lixeira."
      });
      fetchStudents();
    } catch (error: any) {
      console.error('Detailed error restoring student:', error);
      toast({
        title: "Erro ao Restaurar",
        description: error.message || "Falha ao restaurar aluno da lixeira.",
        variant: "destructive"
      });
    }
  };

  const permanentDelete = async (studentId: string) => {
    try {
      if (!trainerId) throw new Error('ID do trainer não carregado.');

      console.log("Permanent deleting student", studentId, "for trainer", trainerId);

      const { data: studentCheck } = await supabase
        .from('students')
        .select('id')
        .eq('id', studentId)
        .eq('trainer_id', trainerId)
        .single();

      if (!studentCheck) {
        throw new Error('Aluno não encontrado ou não pertence a você.');
      }

      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)
        .eq('trainer_id', trainerId);

      if (error) {
        console.error('Delete error details:', error);
        if (error.code === '42501') { // Permission denied
          throw new Error('Permissão negada. Verifique RLS policies no Supabase.');
        }
        throw error;
      }

      console.log("Student permanently deleted");
      toast({
        title: "Sucesso!",
        description: "Aluno excluído permanentemente."
      });
      fetchStudents();
    } catch (error: any) {
      console.error('Detailed error permanent delete:', error);
      toast({
        title: "Erro ao Excluir Permanentemente",
        description: error.message || "Falha ao excluir aluno permanentemente.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return { variant: "outline" as const, color: "", icon: null }; // Fallback se colunas não existirem
    switch (status) {
      case 'active': return { variant: "default" as const, color: "bg-green-100 text-green-700", icon: <Check className="h-3 w-3" /> };
      case 'archived': return { variant: "secondary" as const, color: "bg-yellow-100 text-yellow-700", icon: <Archive className="h-3 w-3" /> };
      case 'deleted': return { variant: "destructive" as const, color: "bg-red-100 text-red-700", icon: <Trash2 className="h-3 w-3" /> };
      default: return { variant: "outline" as const, color: "", icon: null };
    }
  };

  const getFilteredStudents = (tab: 'active' | 'archived' | 'trash') => {
    return students.filter(student => {
      const status = student.status || 'active'; // Fallback se coluna não existir
      if (tab === 'active') return status === 'active';
      if (tab === 'archived') return status === 'archived';
      if (tab === 'trash') return status === 'deleted';
      return true;
    }).filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getDaysLeftInTrash = (deletedAt?: string) => {
    if (!deletedAt) return null;
    const deletedDate = new Date(deletedAt);
    const daysPassed = Math.floor((Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = 90 - daysPassed;
    return daysLeft > 0 ? daysLeft : 0;
  };

  const filteredStudents = getFilteredStudents(activeTab);

  const getGoalBadge = (goal: string) => {
    const goals = {
      perder_gordura: { label: "Perder Gordura", variant: "destructive" as const },
      ganhar_massa: { label: "Ganhar Massa", variant: "default" as const },
      manter_peso: { label: "Manter Peso", variant: "secondary" as const }
    };
    return goals[goal as keyof typeof goals] || { label: goal, variant: "outline" as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Alunos
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus alunos e suas informações
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary shadow-primary hover:shadow-glow transition-all">
              <Plus className="h-4 w-4 mr-2" />
              Novo Aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Aluno</DialogTitle>
              <DialogDescription>
                Preencha as informações básicas do aluno
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={formData.height}
                  onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gênero</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecione o gênero" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Objetivo</Label>
                <Select value={formData.goal} onValueChange={(value) => setFormData(prev => ({ ...prev, goal: value }))}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecione o objetivo" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    <SelectItem value="perder_gordura">Perder Gordura</SelectItem>
                    <SelectItem value="ganhar_massa">Ganhar Massa</SelectItem>
                    <SelectItem value="manter_peso">Manter Peso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gradient-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Adicionar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar alunos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{filteredStudents.length} {activeTab} alunos</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            Ativos ({students.filter(s => s.status === 'active').length})
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Arquivados ({students.filter(s => s.status === 'archived').length})
          </TabsTrigger>
          <TabsTrigger value="trash" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Lixeira ({students.filter(s => s.status === 'deleted').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {getFilteredStudents('active').map((student) => (
              <Card key={student.id} className="shadow-primary/10 border-primary/20 hover:shadow-primary/20 transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{student.name}</CardTitle>
                      <CardDescription>
                        {student.age} anos • {student.gender === "masculino" ? "M" : "F"}
                      </CardDescription>
                    </div>
                    <Badge variant={getGoalBadge(student.goal).variant}>
                      {getGoalBadge(student.goal).label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats: Stack in 1 column on mobile, 2 cols on sm+ with overflow protection */}
                  <div className="min-w-0 overflow-hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="text-center p-3 bg-accent/50 rounded-lg">
                        <p className="text-xs sm:text-sm text-muted-foreground">Peso</p>
                        <p className="text-sm sm:text-base font-semibold text-primary">
                          {student.weight ? `${student.weight}kg` : '-'}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-accent/50 rounded-lg">
                        <p className="text-xs sm:text-sm text-muted-foreground">% Gordura</p>
                        <p className="text-xs sm:text-base font-semibold text-primary truncate">
                          {student.bodyFat ? `${student.bodyFat}%` : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Última: {student.lastEvaluation 
                          ? new Date(student.lastEvaluation).toLocaleDateString('pt-BR')
                          : 'Nunca'
                        }
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setAnamnesisStudent(student);
                          setIsAnamnesisOpen(true);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Anamnese
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="hover:bg-primary hover:text-primary-foreground"
                        onClick={() => window.location.href = `/evaluation?student=${student.id}`}
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        Avaliar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setManagingWorkoutsFor(student);
                          setIsWorkoutManagerOpen(true);
                        }}
                      >
                        <Dumbbell className="h-4 w-4 mr-2" />
                        Treinos
                      </Button>
                      <StudentPortalManager student={student} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => {
                            setEditingStudent(student);
                            setIsEditDialogOpen(true);
                          }}>
                            <Edit className="mr-2 h-3 w-3" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => archiveStudent(student.id)}>
                            <Archive className="mr-2 h-3 w-3" />
                            Arquivar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteToTrash(student.id)}>
                            <Trash2 className="mr-2 h-3 w-3 text-destructive" />
                            Excluir (Lixeira)
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setAnamnesisStudent(student);
                            setIsAnamnesisOpen(true);
                          }}>
                            <FileText className="mr-2 h-3 w-3" />
                            Ver Anamnese
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="archived" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {getFilteredStudents('archived').map((student) => (
              <Card key={student.id} className="shadow-primary/10 border-primary/20 hover:shadow-primary/20 transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{student.name}</CardTitle>
                      <CardDescription>
                        {student.age} anos • {student.gender === "masculino" ? "M" : "F"}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-yellow-700 border-yellow-200">
                      <Archive className="h-3 w-3 mr-1" />
                      Arquivado
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="min-w-0 overflow-hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="text-center p-3 bg-accent/50 rounded-lg">
                        <p className="text-xs sm:text-sm text-muted-foreground">Peso</p>
                        <p className="text-sm sm:text-base font-semibold text-primary">
                          {student.weight ? `${student.weight}kg` : '-'}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-accent/50 rounded-lg">
                        <p className="text-xs sm:text-sm text-muted-foreground">% Gordura</p>
                        <p className="text-xs sm:text-base font-semibold text-primary truncate">
                          {student.bodyFat ? `${student.bodyFat}%` : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Última: {student.lastEvaluation 
                          ? new Date(student.lastEvaluation).toLocaleDateString('pt-BR')
                          : 'Nunca'
                        }
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setAnamnesisStudent(student);
                          setIsAnamnesisOpen(true);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Anamnese
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="hover:bg-primary hover:text-primary-foreground"
                        onClick={() => window.location.href = `/evaluation?student=${student.id}`}
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        Avaliar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setManagingWorkoutsFor(student);
                          setIsWorkoutManagerOpen(true);
                        }}
                      >
                        <Dumbbell className="h-4 w-4 mr-2" />
                        Treinos
                      </Button>
                      <StudentPortalManager student={student} />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => unarchiveStudent(student.id)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Desarquivar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trash" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {getFilteredStudents('trash').map((student) => {
              const daysLeft = getDaysLeftInTrash(student.deleted_at);
              const isExpired = daysLeft <= 0;
              return (
                <Card key={student.id} className="shadow-primary/10 border-primary/20 hover:shadow-primary/20 transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{student.name}</CardTitle>
                        <CardDescription>
                          {student.age} anos • {student.gender === "masculino" ? "M" : "F"}
                        </CardDescription>
                      </div>
                      <Badge variant="destructive" className="text-red-700 border-red-200">
                        <Trash2 className="h-3 w-3 mr-1" />
                        {isExpired ? 'Expirado' : `${daysLeft} dias restantes`}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="min-w-0 overflow-hidden">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="text-center p-3 bg-accent/50 rounded-lg">
                          <p className="text-xs sm:text-sm text-muted-foreground">Peso</p>
                          <p className="text-sm sm:text-base font-semibold text-primary">
                            {student.weight ? `${student.weight}kg` : '-'}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-accent/50 rounded-lg">
                          <p className="text-xs sm:text-sm text-muted-foreground">% Gordura</p>
                          <p className="text-xs sm:text-base font-semibold text-primary truncate">
                            {student.bodyFat ? `${student.bodyFat}%` : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Deletado em: {new Date(student.deleted_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => restoreFromTrash(student.id)}
                          disabled={isExpired}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Restaurar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" disabled={isExpired}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir Definitivo
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Permanentemente?</AlertDialogTitle>
                              <AlertDialogDescription>
                                "{student.name}" será removido permanentemente. Não há recuperação. Tem certeza?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => permanentDelete(student.id)}>
                                Excluir Definitivo
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {getFilteredStudents('trash').length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Trash2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Lixeira vazia</h3>
                <p className="text-muted-foreground">Alunos deletados ficam aqui por 90 dias antes de serem removidos permanentemente.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {filteredStudents.length === 0 && activeTab === 'active' && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum aluno encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Tente ajustar sua busca" : "Comece adicionando seu primeiro aluno"}
            </p>
            <Button className="gradient-primary" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Aluno
            </Button>
          </CardContent>
        </Card>
      )}

      <EditStudentDialog
        student={editingStudent}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onStudentUpdated={fetchStudents}
      />

      <StudentWorkoutManager
        student={managingWorkoutsFor}
        open={isWorkoutManagerOpen}
        onOpenChange={setIsWorkoutManagerOpen}
        onWorkoutsUpdated={fetchStudents}
      />

      <AnamnesisForm
        student={anamnesisStudent}
        open={isAnamnesisOpen}
        onOpenChange={setIsAnamnesisOpen}
      />
    </div>
  );
};

export default Students;