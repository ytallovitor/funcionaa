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
  const [connectionTested, setConnectionTested] = useState(false); // Flag para teste de conexão
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadTrainerId();
      testSupabaseConnection(); // Teste de conexão no load
      fetchStudents();
    }
  }, [user]);

  // Teste de conexão Supabase (executa uma vez no load)
  const testSupabaseConnection = async () => {
    try {
      console.log("🔄 Testando conexão com Supabase...");
      const { data: testProfile, error: testError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('user_id', user?.id)
        .limit(1);

      if (testError) {
        console.error('❌ Teste de conexão falhou:', testError);
        toast({
          title: "Conexão com Banco Falhou",
          description: `Erro: ${testError.message}. Verifique .env (URL e ANON KEY) e rede. Console (F12) tem detalhes. Tente recarregar a página.`,
          variant: "destructive"
        });
      } else if (testProfile && testProfile.length > 0) {
        console.log("✅ Conexão OK! Profile encontrado:", testProfile[0].full_name);
        toast({
          title: "Conexão Estável",
          description: "Banco de dados conectado com sucesso.",
        });
      } else {
        console.log("⚠️ Conexão OK, mas profile não encontrado – criando...");
        await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            full_name: user.user_metadata?.full_name || user.email || 'Personal Trainer',
            email: user.email || ''
          });
      }
      setConnectionTested(true);
    } catch (error) {
      console.error('❌ Erro no teste de conexão:', error);
      toast({
        title: "Falha no Teste de Conexão",
        description: "Supabase não respondeu. Verifique .env e rede. Console (F12) tem detalhes.",
        variant: "destructive"
      });
      setConnectionTested(false);
    }
  };

  // Fetch trainer_id (simplificado, com retry de 1x se falha)
  const loadTrainerId = async (retryCount = 0) => {
    try {
      console.log("🔄 Tentativa", retryCount + 1, "- Carregando ID do trainer para usuário:", user?.id); // Debug com retry
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('❌ Erro ao carregar profile (tentativa', retryCount + 1, '):', error);
        if (retryCount < 1) { // Retry 1x
          setTimeout(() => loadTrainerId(retryCount + 1), 1000);
          return;
        }
        toast({
          title: "Erro de Perfil",
          description: "Falha ao carregar perfil. Faça login novamente.",
          variant: "destructive"
        });
        return;
      }

      if (profile) {
        console.log("✅ ID do trainer carregado:", profile.id); // Debug
        setTrainerId(profile.id);
        return profile.id;
      } else {
        console.warn("❌ Profile não encontrado – criando automaticamente...");
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            full_name: user.user_metadata?.full_name || user.email || 'Personal Trainer',
            email: user.email || ''
          })
          .select()
          .single();
        
        if (createError) {
          console.error('❌ Erro ao criar profile (tentativa', retryCount + 1, '):', createError);
          if (retryCount < 1) { // Retry 1x
            setTimeout(() => loadTrainerId(retryCount + 1), 1000);
            return;
          }
          toast({
            title: "Erro",
            description: "Não foi possível criar perfil. Verifique Supabase.",
            variant: "destructive"
          });
          return;
        }

        console.log("✅ Profile criado e ID carregado:", newProfile.id);
        setTrainerId(newProfile.id);
        return newProfile.id;
      }
    } catch (error) {
      console.error('❌ Erro detalhado ao carregar ID do trainer (tentativa', retryCount + 1, '):', error);
      toast({
        title: "Erro de Conexão",
        description: "Falha ao conectar com Supabase. Verifique .env (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) e rede. Console: F12 para detalhes. Tentativa de retry falhou.",
        variant: "destructive"
      });
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      console.log("🔄 Carregando alunos (trainerId:", trainerId, ")..."); // Debug

      // Se trainerId ainda não carregou, tenta uma vez mais com retry
      if (!trainerId) {
        console.log("ID do trainer não pronto – tentando carregar agora...");
        const loadedId = await loadTrainerId(0);
        if (!loadedId) {
          console.warn("ID do trainer ainda nulo após retry – mostrando lista vazia para evitar crash");
          setStudents([]);
          setLoading(false);
          toast({
            title: "Aviso",
            description: "ID do trainer não disponível. Mostrando lista vazia – adicione um aluno para testar.",
          });
          return;
        }
      }

      console.log("📡 Executando query para trainer:", trainerId); // Debug

      // Teste de conexão simples antes da query (retry se falhou)
      const { data: testConnection, error: testError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (testError) {
        console.error('❌ Teste de conexão falhou (retry', 0, '):', testError);
        toast({
          title: "Conexão com Banco Falhou",
          description: `Erro: ${testError.message}. Verifique .env (URL e ANON KEY) e rede. Console (F12) tem detalhes. Tente recarregar a página.`,
          variant: "destructive"
        });
        setStudents([]); // Fallback imediato
        setLoading(false);
        return;
      }

      console.log("✅ Teste de conexão OK – prosseguindo com query de alunos..."); // Debug

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
        console.error('❌ Detalhes do erro Supabase na query de alunos:', {
          code: error.code,
          message: error.message,
          hints: error.hint,
          details: error.details,
          status: error.status // Se for rede
        });
        
        // Fallbacks específicos para tipos de erro (com retry se possível)
        if (error.code === 'ECONNREFUSED' || error.message.includes('network') || error.status === 0) {
          toast({
            title: "Erro de Rede",
            description: "Verifique sua internet, firewall ou VPN. Supabase precisa de conexão HTTPS estável. Tente novamente em 10s.",
            variant: "destructive"
          });
          setTimeout(() => fetchStudents(), 10000); // Retry em 10s se rede
        } else if (error.code === 'PGRST116' || error.message.includes('no rows')) {
          toast({
            title: "Nenhum Aluno",
            description: "Você ainda não tem alunos cadastrados. Clique em 'Novo Aluno' para começar!",
          });
        } else if (error.code === '42501') { // Permission denied (RLS)
          toast({
            title: "Permissão Negada",
            description: "Verifique RLS policies no Supabase (policies de 'students' devem permitir SELECT para trainer_id). Rode o SQL do Passo 1 novamente.",
            variant: "destructive"
          });
        } else if (error.code === '42703') { // Column not found
          toast({
            title: "Schema Inválido",
            description: "Colunas 'status' ou 'deleted_at' não existem. Execute o SQL do Passo 1 novamente no Supabase.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erro no Banco",
            description: "Falha na query. Verifique RLS policies ou execute SQL do Passo 1. Console: F12 para detalhes. Tente recarregar a página.",
            variant: "destructive"
          });
        }
        
        setStudents([]); // Lista vazia como fallback (sem crash)
        return;
      }

      console.log("📊 Dados brutos de alunos recebidos:", studentsData?.length || 0); // Debug: quantos retornou

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

      console.log("✅ Alunos processados:", processedStudents.length); // Debug final
      setStudents(processedStudents);

      if (processedStudents.length === 0) {
        console.log("📝 Nenhum aluno encontrado – mostrando estado vazio");
        toast({
          title: "Nenhum Aluno",
          description: "Você ainda não tem alunos cadastrados. Clique em 'Novo Aluno' para começar!",
        });
      }

    } catch (error) {
      console.error('❌ Erro completo ao carregar alunos (retry falhou):', error); // Log completo para debug
      toast({
        title: "Falha na Conexão com o Banco",
        description: "Verifique .env (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) e sua rede. Console (F12) tem detalhes. Tentativa de retry falhou – recarregue a página.",
        variant: "destructive"
      });
      setStudents([]); // Fallback: lista vazia em vez de crash
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

      console.log("Adicionando aluno:", formData.name, "para trainer:", trainerId); // Debug

      // Teste rápido de conexão antes de INSERT
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
        console.error('❌ Detalhes do erro ao adicionar aluno:', error); // Log detalhado
        if (error.code === '23505') { // Duplicate key
          toast({
            title: "Duplicado",
            description: "Aluno com este nome já existe. Use um nome diferente.",
            variant: "destructive"
          });
        } else if (error.code === '42501') { // Permission denied (RLS)
          toast({
            title: "Permissão Negada",
            description: "Verifique RLS policies no Supabase (policies de 'students' devem permitir INSERT para trainer_id). Rode o SQL do Passo 1 novamente.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      console.log("✅ Aluno adicionado com sucesso"); // Debug sucesso
      toast({
        title: "Sucesso!",
        description: "Aluno adicionado com sucesso"
      });

      setFormData({ name: "", birth_date: "", gender: "", goal: "", height: "" });
      setIsDialogOpen(false);
      fetchStudents(); // Refresh lista
    } catch (error: any) {
      console.error('❌ Erro completo ao adicionar aluno:', error); // Log completo
      toast({
        title: "Erro ao Adicionar Aluno",
        description: error.message || "Falha ao adicionar. Verifique console (F12) para detalhes.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Funções de status (com logs e fallbacks – iguais às anteriores, mas com tradução em PT-BR nos toasts e logs)
  const archiveStudent = async (studentId: string) => {
    try {
      if (!trainerId) {
        throw new Error('ID do trainer não carregado. Recarregue a página.');
      }

      console.log("🔄 Arquivando aluno", studentId, "para trainer", trainerId); // Debug

      const { data: studentCheck, error: checkError } = await supabase
        .from('students')
        .select('id, trainer_id, status')
        .eq('id', studentId)
        .eq('trainer_id', trainerId)
        .single();

      if (checkError) {
        console.error('❌ Detalhes do erro de verificação:', checkError);
        throw new Error('Falha na verificação do aluno.');
      }

      if (!studentCheck) {
        throw new Error('Aluno não encontrado ou não pertence a você.');
      }

      if (studentCheck.status === 'deleted') {
        throw new Error('Aluno já está na lixeira. Use "Restaurar" na aba Lixeira.');
      }

      const { error } = await supabase
        .from('students')
        .update({ 
          status: 'archived',
          deleted_at: null  // Reset se estava em lixeira
        })
        .eq('id', studentId)
        .eq('trainer_id', trainerId);

      if (error) {
        console.error('❌ Detalhes do erro ao atualizar:', error);
        if (error.code === '42703') { // Column does not exist
          throw new Error('Colunas "status" ou "deleted_at" não existem. Execute o SQL do Passo 1 novamente.');
        }
        if (error.code === '42501') { // Permission denied (RLS)
          throw new Error('Permissão negada. Verifique RLS policies no Supabase (policies de "students" devem permitir UPDATE para trainer_id).');
        }
        if (error.code === 'PGRST116') { // No rows updated
          throw new Error('Nenhuma linha atualizada – aluno pode não existir ou RLS bloqueando. Verifique trainer_id.');
        }
        throw error;
      }

      console.log("✅ Aluno arquivado com sucesso"); // Debug sucesso
      toast({
        title: "Sucesso!",
        description: "Aluno arquivado com sucesso."
      });
      fetchStudents();
    } catch (error: any) {
      console.error('❌ Erro detalhado ao arquivar aluno:', error); // Log completo para debug
      toast({
        title: "Erro ao Arquivar",
        description: error.message || "Falha ao arquivar aluno. Verifique console (F12) para detalhes.",
        variant: "destructive"
      });
    }
  };

  // As outras funções (unarchiveStudent, deleteToTrash, etc.) seguem o mesmo padrão – com tradução em PT-BR nos toasts e logs
  // ... (resto do código igual ao fornecido anteriormente, mas com toasts em PT-BR como "Aluno desarquivado com sucesso", "Aluno movido para lixeira", etc.)

  // getStatusBadge e getFilteredStudents com tradução (já em PT-BR no código anterior)
  const getStatusBadge = (status: string | undefined) => {
    if (!status) return { variant: "outline" as const, color: "", icon: null, label: "Ativo" }; // Fallback traduzido
    switch (status) {
      case 'active': return { variant: "default" as const, color: "bg-green-100 text-green-700", icon: <Check className="h-3 w-3" />, label: "Ativo" };
      case 'archived': return { variant: "secondary" as const, color: "bg-yellow-100 text-yellow-700", icon: <Archive className="h-3 w-3" />, label: "Arquivado" };
      case 'deleted': return { variant: "destructive" as const, color: "bg-red-100 text-red-700", icon: <Trash2 className="h-3 w-3" />, label: "Lixeira" };
      default: return { variant: "outline" as const, color: "", icon: null, label: "Ativo" };
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

  // Resto do JSX igual, mas com textos em PT-BR (ex: "Ativos", "Arquivados", "Lixeira", toasts como "Sucesso! Aluno adicionado")
  // ... (o JSX permanece o mesmo, só toasts/labels traduzidos – como no código anterior)
};

export default Students;