import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Plus, Activity, Calendar, Loader2, Edit, Dumbbell, FileText, Archive, Trash2, MoreVertical, Check, MessageCircle, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
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
import { Skeleton } from "@/components/ui/skeleton";
import StudentPortalManager from "@/components/StudentPortalManager";
import AnamnesisForm from "@/components/AnamnesisForm";
import { SetWeeklyGoalsDialog } from "@/components/SetWeeklyGoalsDialog";
import EmptyState from "@/components/EmptyState"; // Importar o novo componente EmptyState

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
  status?: 'active' | 'archived' | 'deleted';
  deleted_at?: string;
  trainer_id: string; // Ensure trainer_id is part of Student interface
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
  const [formData, setFormData] = useState({
    name: "",
    birth_date: "",
    gender: "",
    goal: "",
    height: ""
  });
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<string | null>(null);
  const [managingWorkoutsFor, setManagingWorkoutsFor] = useState<Student | null>(null);
  const [isWorkoutManagerOpen, setIsWorkoutManagerOpen] = useState(false);
  const [anamnesisStudent, setAnamnesisStudent] = useState<Student | null>(null);
  const [isAnamnesisOpen, setIsAnamnesisOpen] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [settingGoalsForStudent, setSettingGoalsForStudent] = useState<Student | null>(null); // New state for goals dialog
  const [isSetGoalsDialogOpen, setIsSetGoalsDialogOpen] = useState(false); // New state for goals dialog open/close
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const initializeTrainerAndStudents = async () => {
        const id = await loadTrainerId();
        if (id) {
          setTrainerId(id);
          await fetchStudents(id);
        }
      };
      initializeTrainerAndStudents();
    }
  }, [user]);

  const loadTrainerId = async (retryCount = 0): Promise<string | null> => {
    try {
      console.log(`🔄 Tentativa ${retryCount + 1}: Carregando ID do trainer para user: ${user?.id}`);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error(`❌ Erro ao carregar profile (tentativa ${retryCount + 1}):`, error);
        if (retryCount < 2) {
          setTimeout(() => loadTrainerId(retryCount + 1), 1000);
          return null;
        }
        toast({
          title: "Erro de Perfil",
          description: "Falha ao carregar perfil. Faça login novamente.",
          variant: "destructive"
        });
        return null;
      }

      if (profile) {
        console.log(`✅ ID do trainer carregado: ${profile.id}`);
        return profile.id;
      } else {
        console.warn(`❌ Profile não encontrado – criando automaticamente (tentativa ${retryCount + 1})...`);
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user!.id,
            full_name: user!.user_metadata?.full_name || user!.email || 'Personal Trainer',
            email: user!.email || ''
          })
          .select()
          .single();
        
        if (createError) {
          console.error(`❌ Erro ao criar profile (tentativa ${retryCount + 1}):`, createError);
          if (retryCount < 2) {
            setTimeout(() => loadTrainerId(retryCount + 1), 1000);
            return null;
          }
          toast({
            title: "Erro",
            description: "Não foi possível criar perfil. Verifique Supabase.",
            variant: "destructive"
          });
          return null;
        }

        console.log(`✅ Profile criado e ID carregado: ${newProfile.id}`);
        return newProfile.id;
      }
    } catch (error) {
      console.error(`❌ Erro detalhado ao carregar ID do trainer (tentativa ${retryCount + 1}):`, error);
      toast({
        title: "Erro de Conexão",
        description: "Falha ao conectar com Supabase. Verifique .env (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) e rede. Console: F12 para detalhes.",
        variant: "destructive"
      });
      setStudents([]);
      return null;
    }
  };

  const fetchStudents = async (currentTrainerId: string) => {
    try {
      setLoading(true);
      
      console.log(`🔄 Carregando alunos (trainerId: ${currentTrainerId})...`);

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
        .eq('trainer_id', currentTrainerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Detalhes do erro Supabase na query de alunos:', {
          code: error.code,
          message: error.message,
          hints: error.hint,
          details: error.details,
          status: (error as any).status 
        });
        
        if (error.code === 'ECONNREFUSED' || error.message.includes('network') || (error as any).status === 0) {
          toast({
            title: "Erro de Rede",
            description: "Verifique sua internet, firewall ou VPN. Supabase precisa de conexão HTTPS estável. Tente novamente em 10s.",
            variant: "destructive"
          });
          setTimeout(() => fetchStudents(currentTrainerId), 10000);
        } else if (error.code === 'PGRST116' || error.message.includes('no rows')) {
          toast({
            title: "Nenhum Aluno",
            description: "Você ainda não tem alunos cadastrados. Clique em 'Novo Aluno' para começar!",
          });
        } else if (error.code === '42501') {
          toast({
            title: "Permissão Negada",
            description: "Verifique RLS policies no Supabase (policies de 'students' devem permitir SELECT para trainer_id). Rode o SQL do Passo 1 novamente.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erro no Banco",
            description: "Falha na query. Verifique RLS policies ou execute SQL do Passo 1. Console: F12 para detalhes. Tente recarregar a página.",
            variant: "destructive"
          });
        }
        
        setStudents([]);
        return;
      }

      console.log("📊 Dados brutos de alunos recebidos:", studentsData?.length || 0);

      const processedStudents = studentsData?.map(student => {
        const latestEvaluation = student.evaluations?.[0];
        return {
          ...student,
          lastEvaluation: latestEvaluation?.evaluation_date,
          weight: latestEvaluation?.weight,
          bodyFat: latestEvaluation?.body_fat_percentage,
          status: student.status || 'active',
          deleted_at: student.deleted_at || null
        };
      }) || [];

      console.log("✅ Alunos processados:", processedStudents.length);
      setStudents(processedStudents);

      if (processedStudents.length === 0) {
        console.log("📝 Nenhum aluno encontrado – mostrando estado vazio");
        toast({
          title: "Nenhum Aluno",
          description: "Você ainda não tem alunos cadastrados. Clique em 'Novo Aluno' para começar!",
        });
      }

    } catch (error) {
      console.error('❌ Erro completo ao carregar alunos:', error);
      toast({
        title: "Falha na Conexão com o Banco",
        description: "Verifique .env (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) e sua rede. Console (F12) tem detalhes. Tente recarregar a página.",
        variant: "destructive"
      });
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!trainerId) {
        toast({
          title: "Erro",
          description: "ID do trainer não encontrado. Recarregue a página e tente novamente.",
          variant: "destructive"
        });
        return;
      }

      const age = formData.birth_date ? 
        new Date().getFullYear() - new Date(formData.birth_date).getFullYear() : 0;

      console.log("Adicionando aluno:", formData.name, "para trainer:", trainerId);

      const { data: quickTest } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (!quickTest || quickTest.length === 0) {
        throw new Error('Conexão falhou antes de salvar – verifique .env.');
      }

      const { error } = await supabase
        .from('students')
        .insert({
          name: formData.name.trim(),
          age: age,
          birth_date: formData.birth_date || null,
          gender: formData.gender,
          goal: formData.goal,
          height: parseFloat(formData.height),
          trainer_id: trainerId,
          status: 'active',
          deleted_at: null
        });

      if (error) {
        console.error('❌ Detalhes do erro ao adicionar aluno:', error);
        if (error.code === '23505') {
          toast({
            title: "Duplicado",
            description: "Aluno com este nome já existe. Use um nome diferente.",
            variant: "destructive"
          });
        } else if (error.code === '42501') {
          toast({
            title: "Permissão Negada",
            description: "Verifique RLS policies no Supabase (policies de 'students' devem permitir INSERT para trainer_id).",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      console.log("✅ Aluno adicionado com sucesso");
      toast({
        title: "Sucesso!",
        description: "Aluno adicionado com sucesso"
      });

      setFormData({ name: "", birth_date: "", gender: "", goal: "", height: "" });
      setIsDialogOpen(false);
      fetchStudents(trainerId);
    } catch (error: any) {
      console.error('❌ Erro completo ao adicionar aluno:', error);
      toast({
        title: "Erro ao Adicionar Aluno",
        description: error.message || "Falha ao adicionar. Verifique console (F12) para detalhes.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return { variant: "outline" as const, color: "", icon: null, label: "Ativo" };
    switch (status) {
      case 'active': return { variant: "default" as const, color: "bg-green-100 text-green-700", icon: <Check className="h-3 w-3" />, label: "Ativo" };
      case 'archived': return { variant: "secondary" as const, color: "bg-yellow-100 text-yellow-700", icon: <Archive className="h-3 w-3" />, label: "Arquivado" };
      case 'deleted': return { variant: "destructive" as const, color: "bg-red-100 text-red-700", icon: <Trash2 className="h-3 w-3" />, label: "Lixeira" };
      default: return { variant: "outline" as const, color: "", icon: null, label: "Ativo" };
    }
  };

  const getFilteredStudents = (tab: 'active' | 'archived' | 'trash') => {
    return students.filter(student => {
      const status = student.status || 'active';
      if (tab === 'active') return status === 'active';
      if (tab === 'archived') return status === 'archived';
      if (tab === 'trash') return status === 'deleted';
      return true;
    }).filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const archiveStudent = async (studentId: string) => {
    console.log(`Attempting to archive student: ${studentId}`);
    try {
      const { error } = await supabase
        .from('students')
        .update({ status: 'archived' })
        .eq('id', studentId);

      if (error) {
        console.error('Error archiving student:', error);
        throw error;
      }
      console.log(`Student ${studentId} archived successfully.`);
      toast({ title: "Sucesso!", description: "Aluno arquivado" });
      await fetchStudents(trainerId!); // Re-fetch to update UI
    } catch (error: any) {
      toast({ title: "Erro", description: `Falha ao arquivar aluno: ${error.message}`, variant: "destructive" });
    }
  };

  const unarchiveStudent = async (studentId: string) => {
    console.log(`Attempting to unarchive student: ${studentId}`);
    try {
      const { error } = await supabase
        .from('students')
        .update({ status: 'active' })
        .eq('id', studentId);

      if (error) {
        console.error('Error unarchiving student:', error);
        throw error;
      }
      console.log(`Student ${studentId} unarchived successfully.`);
      toast({ title: "Sucesso!", description: "Aluno restaurado" });
      await fetchStudents(trainerId!); // Re-fetch to update UI
    } catch (error: any) {
      toast({ title: "Erro", description: `Falha ao restaurar aluno: ${error.message}`, variant: "destructive" });
    }
  };

  const handleStartChat = async (studentId: string, studentName: string) => {
    if (!trainerId || !user?.id) {
      toast({
        title: "Erro",
        description: "Dados do treinador ou usuário não disponíveis.",
        variant: "destructive"
      });
      return;
    }

    setIsStartingChat(true);
    try {
      // 1. Check if conversation already exists
      const { data: existingConversation, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('trainer_id', trainerId)
        .eq('student_id', studentId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means "no rows found"
        throw fetchError;
      }

      let conversationIdToNavigate = existingConversation?.id;

      if (!conversationIdToNavigate) {
        // 2. If not, create a new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            trainer_id: trainerId,
            student_id: studentId,
            last_message_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (createError) throw createError;
        conversationIdToNavigate = newConversation.id;
        toast({
          title: "Conversa Criada!",
          description: `Nova conversa iniciada com ${studentName}.`
        });
      } else {
        toast({
          title: "Conversa Existente",
          description: `Continuando conversa com ${studentName}.`
        });
      }

      // 3. Navigate to the chat page
      navigate(`/chat/${conversationIdToNavigate}`);

    } catch (error: any) {
      console.error('Error starting chat:', error);
      toast({
        title: "Erro ao Iniciar Chat",
        description: error.message || "Não foi possível iniciar a conversa.",
        variant: "destructive"
      });
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleSetGoals = (student: Student) => {
    setSettingGoalsForStudent(student);
    setIsSetGoalsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Carregando Alunos...</h1>
          </div>
          <div>
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" />
              Novo Aluno
            </Button>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-24 mt-2" />
                <Skeleton className="h-4 w-16 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const studentToDelete = students.find(s => s.id === deletingStudent);
  const isPermanentlyDeleting = studentToDelete?.status === 'deleted';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Alunos
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus alunos e acompanhe o progresso de cada um
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white">
                <Plus className="mr-2 h-4 w-4" />
                Novo Aluno
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Aluno</DialogTitle>
                <DialogDescription>
                  Crie um novo perfil de aluno para começar o acompanhamento
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: João Silva"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                      placeholder="Ex: 175.5"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gênero</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o gênero" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal">Objetivo</Label>
                    <Select value={formData.goal} onValueChange={(value) => setFormData(prev => ({ ...prev, goal: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o objetivo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="perder_gordura">Perder Gordura</SelectItem>
                        <SelectItem value="ganhar_massa">Ganhar Massa</SelectItem>
                        <SelectItem value="manter_peso">Manter Peso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full gradient-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Aluno
                    </>
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'archived' | 'trash')} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="text-sm">
            Ativos ({getFilteredStudents('active').length})
          </TabsTrigger>
          <TabsTrigger value="archived" className="text-sm">
            Arquivados ({getFilteredStudents('archived').length})
          </TabsTrigger>
          <TabsTrigger value="trash" className="text-sm">
            Lixeira ({getFilteredStudents('trash').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar alunos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full max-w-md"
              />
            </div>
          </div>

          {getFilteredStudents('active').length > 0 ? (
            <div className="grid gap-4">
              {getFilteredStudents('active').map((student) => {
                const statusBadge = getStatusBadge(student.status);
                const hasEvaluation = student.lastEvaluation;
                const daysSinceLastEval = hasEvaluation ? Math.floor((new Date().getTime() - new Date(student.lastEvaluation as string).getTime()) / (1000 * 60 * 60 * 24)) : null;

                return (
                  <Card key={student.id} className="shadow-primary/10 border-primary/20 hover:shadow-primary/20 transition-all">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <span className="text-lg">{student.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-medium">{student.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={statusBadge.variant} className={statusBadge.color}>
                              {statusBadge.icon}
                              {statusBadge.label}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {student.age} anos • {student.gender} • {student.goal.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => {
                            setEditingStudent(student);
                            setFormData({
                              name: student.name,
                              birth_date: student.birth_date || "",
                              gender: student.gender,
                              goal: student.goal,
                              height: student.height.toString()
                            });
                            setIsEditDialogOpen(true);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setAnamnesisStudent(student);
                            setIsAnamnesisOpen(true);
                          }}>
                            <FileText className="mr-2 h-4 w-4" />
                            Anamnese
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setManagingWorkoutsFor(student);
                            setIsWorkoutManagerOpen(true);
                          }}>
                            <Dumbbell className="mr-2 h-4 w-4" />
                            Gerenciar Treinos
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStartChat(student.id, student.name)}
                            disabled={isStartingChat}
                          >
                            {isStartingChat ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <MessageCircle className="mr-2 h-4 w-4" />
                            )}
                            Iniciar Chat
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSetGoals(student)}>
                            <Target className="mr-2 h-4 w-4" />
                            Metas Semanais
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {student.status === 'active' ? (
                            <DropdownMenuItem onClick={() => archiveStudent(student.id)}>
                              <Archive className="mr-2 h-4 w-4" />
                              Arquivar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => unarchiveStudent(student.id)}>
                              <Activity className="mr-2 h-4 w-4" />
                              Desarquivar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeletingStudent(student.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-medium">Altura:</span> {student.height} cm
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Última Avaliação:</span>
                          {hasEvaluation ? (
                            <span className="text-green-600">
                              {Math.floor((new Date().getTime() - new Date(student.lastEvaluation as string).getTime()) / (1000 * 60 * 60 * 24))} dias atrás
                            </span>
                          ) : (
                            <span className="text-red-600">Sem avaliação</span>
                          )}
                        </div>
                      </div>
                      <StudentPortalManager student={student} onPortalCreated={() => fetchStudents(trainerId!)} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="Nenhum aluno cadastrado"
              description="Comece adicionando seu primeiro aluno para gerenciar o acompanhamento."
              buttonText="Adicionar Primeiro Aluno"
              onButtonClick={() => setIsDialogOpen(true)}
            />
          )}
        </TabsContent>

        <TabsContent value="archived" className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar alunos arquivados..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full max-w-md"
              />
            </div>
          </div>

          {getFilteredStudents('archived').length > 0 ? (
            <div className="grid gap-4">
              {getFilteredStudents('archived').map((student) => (
                <Card key={student.id} className="shadow-primary/10 border-primary/20">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-lg text-yellow-700">{student.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-medium">{student.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                            <Archive className="h-3 w-3" />
                            Arquivado
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {student.age} anos • {student.goal.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => {
                            setEditingStudent(student);
                            setFormData({
                              name: student.name,
                              birth_date: student.birth_date || "",
                              gender: student.gender,
                              goal: student.goal,
                              height: student.height.toString()
                            });
                            setIsEditDialogOpen(true);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => unarchiveStudent(student.id)}>
                            <Activity className="mr-2 h-4 w-4" />
                            Desarquivar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeletingStudent(student.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">Altura:</span> {student.height} cm
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Última Avaliação:</span>
                        {student.lastEvaluation ? (
                          <span className="text-green-600">
                            {Math.floor((new Date().getTime() - new Date(student.lastEvaluation as string).getTime()) / (1000 * 60 * 60 * 24))} dias atrás
                          </span>
                        ) : (
                          <span className="text-red-600">Sem avaliação</span>
                        )}
                      </div>
                    </div>
                    <StudentPortalManager student={student} onPortalCreated={() => fetchStudents(trainerId!)} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Archive}
              title="Nenhum aluno arquivado"
              description="Alunos arquivados aparecem aqui quando você arquivar um ativo."
              buttonText="Ver Alunos Ativos"
              onButtonClick={() => setActiveTab('active')}
            />
          )}
        </TabsContent>

        <TabsContent value="trash" className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar na lixeira..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full max-w-md"
              />
            </div>
          </div>

          {getFilteredStudents('trash').length > 0 ? (
            <div className="grid gap-4">
              {getFilteredStudents('trash').map((student) => (
                <Card key={student.id} className="shadow-primary/10 border-destructive/20">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-lg text-red-700">{student.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-medium">{student.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="bg-red-100 text-red-700">
                            <Trash2 className="h-3 w-3" />
                            Lixeira
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {student.age} anos • {student.goal.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => unarchiveStudent(student.id)}>
                            <Activity className="mr-2 h-4 w-4" />
                            Restaurar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeletingStudent(student.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir Definitivamente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">Altura:</span> {student.height} cm
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Removido em:</span>
                        {student.deleted_at ? (
                          <span className="text-red-600">
                            {new Date(student.deleted_at).toLocaleDateString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-red-600">Sem data</span>
                        )}
                      </div>
                    </div>
                    <StudentPortalManager student={student} onPortalCreated={() => fetchStudents(trainerId!)} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Trash2}
              title="Lixeira vazia"
              description="Alunos na lixeira aparecem aqui. Eles podem ser restaurados ou excluídos definitivamente."
              buttonText="Ver Alunos Ativos"
              onButtonClick={() => setActiveTab('active')}
            />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Aluno</DialogTitle>
            <DialogDescription>
              Atualize as informações de {editingStudent?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (editingStudent) {
              const age = formData.birth_date ? 
                new Date().getFullYear() - new Date(formData.birth_date).getFullYear() : editingStudent.age;
              
              supabase
                .from('students')
                .update({
                  name: formData.name,
                  birth_date: formData.birth_date || editingStudent.birth_date,
                  gender: formData.gender,
                  goal: formData.goal,
                  height: parseFloat(formData.height),
                  age: age
                })
                .eq('id', editingStudent.id)
                .then(({ error }) => {
                  if (error) {
                    toast({
                      title: "Erro",
                      description: "Falha ao atualizar aluno",
                      variant: "destructive"
                    });
                  } else {
                    toast({
                      title: "Sucesso!",
                      description: "Aluno atualizado com sucesso"
                    });
                    setIsEditDialogOpen(false);
                    fetchStudents(trainerId!);
                  }
                });
            }
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gênero</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o gênero" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Objetivo</Label>
                <Select value={formData.goal} onValueChange={(value) => setFormData(prev => ({ ...prev, goal: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="perder_gordura">Perder Gordura</SelectItem>
                    <SelectItem value="ganhar_massa">Ganhar Massa</SelectItem>
                    <SelectItem value="manter_peso">Manter Peso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 gradient-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  "Atualizar"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AnamnesisForm student={anamnesisStudent} open={isAnamnesisOpen} onOpenChange={setIsAnamnesisOpen} />

      <SetWeeklyGoalsDialog
        student={settingGoalsForStudent}
        open={isSetGoalsDialogOpen}
        onOpenChange={setIsSetGoalsDialogOpen}
        onGoalsUpdated={() => fetchStudents(trainerId!)} // Re-fetch students to update UI
      />

      <AlertDialog open={!!deletingStudent} onOpenChange={() => setDeletingStudent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar {isPermanentlyDeleting ? "Exclusão Definitiva" : "Exclusão"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isPermanentlyDeleting
                ? `Esta ação é irreversível. O aluno "${studentToDelete?.name}" será removido permanentemente do banco de dados.`
                : `Esta ação moverá o aluno "${studentToDelete?.name}" para a lixeira. Você poderá restaurá-lo depois.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (deletingStudent) {
                try {
                  if (isPermanentlyDeleting) {
                    console.log(`Attempting permanent delete for student: ${deletingStudent}`);
                    const { error } = await supabase
                      .from('students')
                      .delete()
                      .eq('id', deletingStudent);
                    if (error) {
                      console.error('Error during permanent delete:', error);
                      throw error;
                    }
                    console.log(`Student ${deletingStudent} permanently deleted.`);
                    toast({
                      title: "Sucesso!",
                      description: "Aluno excluído permanentemente."
                    });
                  } else {
                    console.log(`Attempting soft delete (move to trash) for student: ${deletingStudent}`);
                    const { error } = await supabase
                      .from('students')
                      .update({ status: 'deleted', deleted_at: new Date().toISOString() })
                      .eq('id', deletingStudent);
                    if (error) {
                      console.error('Error during soft delete:', error);
                      throw error;
                    }
                    console.log(`Student ${deletingStudent} moved to trash.`);
                    toast({
                      title: "Sucesso!",
                      description: "Aluno movido para a lixeira."
                    });
                  }
                  setDeletingStudent(null);
                  await fetchStudents(trainerId!); // Re-fetch to update UI
                } catch (error: any) {
                  console.error('Error handling student deletion:', error);
                  toast({
                    title: "Erro",
                    description: error.message || "Falha ao processar exclusão do aluno.",
                    variant: "destructive"
                  });
                }
              }
            }}>
              {isPermanentlyDeleting ? "Excluir Definitivamente" : "Mover para Lixeira"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Students;