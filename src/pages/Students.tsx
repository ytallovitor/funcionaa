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

  // Fetch trainer_id (simplificado, sem retry auto para evitar loops)
  const loadTrainerId = async () => {
    try {
      console.log("🔄 Loading trainer ID for user:", user?.id); // Debug
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (profile) {
        console.log("✅ Trainer ID loaded:", profile.id); // Debug
        setTrainerId(profile.id);
      } else {
        console.warn("❌ No trainer profile found – creating one...");
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
          console.log("✅ New profile created with ID:", newProfile.id);
          setTrainerId(newProfile.id);
        } else {
          console.error("Failed to create profile");
          toast({
            title: "Erro",
            description: "Não foi possível criar perfil. Verifique Supabase.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('❌ Error loading trainer ID:', error);
      toast({
        title: "Erro de Conexão",
        description: "Falha ao conectar com Supabase. Verifique .env e rede. Console: F12 para detalhes.",
        variant: "destructive"
      });
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      console.log("🔄 Fetching students (trainerId:", trainerId, ")..."); // Debug

      if (!trainerId) {
        console.warn("Trainer ID not ready – skipping fetch (will retry on next load)");
        setStudents([]); // Fallback: lista vazia
        setLoading(false);
        return;
      }

      console.log("📡 Executing query for trainer:", trainerId); // Debug

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
        console.error('❌ Supabase Error Details:', {
          code: error.code,
          message: error.message,
          hints: error.hint,
          details: error.details,
          status: error.status // Se for rede
        });
        
        // Fallback específico para conexão
        if (error.code === 'ECONNREFUSED' || error.message.includes('network')) {
          toast({
            title: "Erro de Rede",
            description: "Verifique sua internet ou firewall. Supabase precisa de conexão HTTPS.",
            variant: "destructive"
          });
        } else if (error.code === 'PGRST116' || error.message.includes('no rows')) {
          toast({
            title: "Nenhum Aluno",
            description: "Você ainda não tem alunos cadastrados. Clique em 'Novo Aluno' para começar!",
          });
        } else {
          toast({
            title: "Erro no Banco",
            description: "Falha na query. Verifique RLS policies ou execute SQL do Passo 1. Console: F12.",
            variant: "destructive"
          });
        }
        
        setStudents([]); // Lista vazia como fallback
        return;
      }

      console.log("📊 Raw students data:", studentsData); // Debug: dados crus da query

      const processedStudents = studentsData?.map(student => {
        const latestEvaluation = student.evaluations?.[0];
        return {
          ...student,
          lastEvaluation: latestEvaluation?.evaluation_date,
          weight: latestEvaluation?.weight,
          bodyFat: latestEvaluation?.body_fat_percentage,
          status: student.status || 'active', // Fallback se coluna não existir
          deleted_at: student.deleted_at || null
        };
      }) || [];

      console.log("✅ Processed students:", processedStudents.length); // Debug final
      setStudents(processedStudents);

      if (processedStudents.length === 0) {
        toast({
          title: "Nenhum Aluno",
          description: "Você ainda não tem alunos cadastrados. Clique em 'Novo Aluno' para começar!",
        });
      }

    } catch (error) {
      console.error('❌ Full error fetching students:', error); // Log completo para debug
      toast({
        title: "Falha na Conexão com o Banco",
        description: "Verifique .env (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) e sua rede. Console (F12) tem detalhes. Tente recarregar.",
        variant: "destructive"
      });
      setStudents([]); // Fallback: lista vazia
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

  // As outras funções (archiveStudent, unarchiveStudent, etc.) seguem o mesmo padrão – com tradução em PT-BR nos toasts e logs
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