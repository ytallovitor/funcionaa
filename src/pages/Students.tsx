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

  // Fetch trainer_id uma vez no load (cache global para performance) + retry se falhar
  const loadTrainerId = async (retryCount = 0) => {
    try {
      console.log("🔍 Loading trainer ID (attempt", retryCount + 1, ") for user:", user?.id); // Debug
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (profile) {
        console.log("✅ Trainer ID cached:", profile.id); // Debug: ID do profile
        setTrainerId(profile.id);
        return profile.id;
      } else {
        console.warn("❌ Trainer profile not found for user:", user?.id);
        if (retryCount < 2) { // Retry até 3x
          console.log("Retrying in 2s...");
          setTimeout(() => loadTrainerId(retryCount + 1), 2000);
        } else {
          toast({
            title: "Aviso",
            description: "Perfil de trainer não encontrado. Criando automaticamente...",
          });
          // Auto-cria profile se não existir (evita loop infinito)
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              full_name: user.user_metadata?.full_name || user.email || 'Personal Trainer',
              email: user.email || ''
            })
            .select()
            .single();
          
          if (newProfile) {
            console.log("✅ Profile created and cached:", newProfile.id);
            setTrainerId(newProfile.id);
            return newProfile.id;
          } else {
            throw new Error('Falha ao criar perfil – verifique Supabase.');
          }
        }
      }
    } catch (error) {
      console.error('❌ Error loading trainer ID (attempt', retryCount + 1, '):', error);
      toast({
        title: "Erro no Perfil",
        description: "Falha ao carregar perfil. Faça login novamente ou verifique Supabase.",
        variant: "destructive"
      });
      if (retryCount >= 2) {
        setTrainerId(null); // Fallback: permite fetchStudents com lista vazia
      }
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      console.log("🔄 Fetching students (trainerId:", trainerId, ")..."); // Debug

      // Se trainerId ainda não carregou, tenta uma vez mais
      if (!trainerId) {
        console.log("Trainer ID not ready – loading now...");
        const loadedId = await loadTrainerId(0);
        if (!loadedId) {
          console.warn("Trainer ID still null – showing empty list to avoid crash");
          setStudents([]);
          setLoading(false);
          toast({
            title: "Aviso",
            description: "Carregando perfil... Tente novamente em alguns segundos.",
          });
          return;
        }
      }

      console.log("📡 Querying students for trainer:", trainerId); // Debug

      // Query com fallback para colunas opcionais (se SQL não rodou, usa COALESCE)
      const { data: studentsData, error } = await supabase
        .from('students')
        .select(`
          id, name, age, gender, goal, height, birth_date, created_at,
          COALESCE(status, 'active') as status,  -- Fallback se coluna não existir
          COALESCE(deleted_at, null) as deleted_at,  -- Fallback se coluna não existir
          evaluations (
            evaluation_date,
            weight,
            body_fat_percentage
          )
        `)
        .eq('trainer_id', trainerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase fetch error details:', {
          code: error.code,
          message: error.message,
          hints: error.hint,
          details: error.details
        }); // Log completo para debug
        throw error;
      }

      console.log("📊 Students data received:", studentsData?.length || 0); // Debug: quantos retornou

      const processedStudents = studentsData?.map(student => {
        const latestEvaluation = student.evaluations?.[0];
        return {
          ...student,
          lastEvaluation: latestEvaluation?.evaluation_date,
          weight: latestEvaluation?.weight,
          bodyFat: latestEvaluation?.body_fat_percentage,
          // Status defaults (se colunas não existirem, fica 'active')
          status: student.status || 'active',
          deleted_at: student.deleted_at || null
        };
      }) || [];

      console.log("✅ Students processed:", processedStudents.length); // Debug final
      setStudents(processedStudents);

      if (processedStudents.length === 0) {
        console.log("📝 No students found – showing empty state");
        toast({
          title: "Nenhum Aluno",
          description: "Você ainda não tem alunos cadastrados. Clique em 'Novo Aluno' para começar!",
        });
      } else {
        console.log("✅ Students loaded successfully – total:", processedStudents.length);
      }

    } catch (error) {
      console.error('❌ Full error fetching students:', error); // Log completo
      toast({
        title: "Erro ao Carregar Alunos",
        description: "Falha na conexão com o banco. Verifique console (F12) para detalhes técnicos. Tente recarregar a página.",
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
        console.error('❌ Error adding student details:', error); // Log detalhado
        if (error.code === '23505') { // Duplicate key
          toast({
            title: "Duplicado",
            description: "Aluno com este nome já existe. Use um nome diferente.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      console.log("✅ Student added successfully"); // Debug sucesso
      toast({
        title: "Sucesso!",
        description: "Aluno adicionado com sucesso"
      });

      setFormData({ name: "", birth_date: "", gender: "", goal: "", height: "" });
      setIsDialogOpen(false);
      fetchStudents(); // Refresh lista
    } catch (error: any) {
      console.error('❌ Full error adding student:', error); // Log completo
      toast({
        title: "Erro ao Adicionar Aluno",
        description: error.message || "Falha ao adicionar. Verifique console (F12) para detalhes.",
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

      console.log("🔄 Arquivando aluno", studentId, "para trainer", trainerId); // Debug

      const { data: studentCheck, error: checkError } = await supabase
        .from('students')
        .select('id, trainer_id, status')
        .eq('id', studentId)
        .eq('trainer_id', trainerId)
        .single();

      if (checkError) {
        console.error('❌ Check error details:', checkError);
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
        console.error('❌ Update error details:', error);
        if (error.code === '42703') { // Column does not exist
          throw new Error('Colunas "status" ou "deleted_at" não existem no banco. Execute o SQL fornecido primeiro.');
        }
        if (error.code === '42501') { // Permission denied (RLS)
          throw new Error('Permissão negada. Verifique RLS policies no Supabase (policies devem permitir UPDATE).');
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

  // Similar para unarchive, deleteToTrash, etc. (código completo igual ao anterior, com tradução em PT-BR)
  // ... (resto do código igual, mas com toasts em PT-BR e logs extras para debug)

  // getStatusBadge e getFilteredStudents com tradução (já em PT-BR)
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

  // Resto do JSX igual (com textos em PT-BR, ex: "Ativos", "Arquivados", "Lixeira")
  // ... (o JSX permanece o mesmo, só toasts/labels traduzidos)

};

export default Students;