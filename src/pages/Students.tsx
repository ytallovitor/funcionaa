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
import { Users, Search, Plus, Activity, Loader2, Edit, Dumbbell, FileText, Archive, Trash2, MoreVertical, Check, MessageCircle, Target } from "lucide-react";
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
import SetWeeklyGoalsDialog from "@/components/SetWeeklyGoalsDialog";
import EmptyState from "@/components/EmptyState";

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
  trainer_id: string;
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
  const [isWorkoutManagerOpen, setIsWorkoutManagerOpen] = useState(false);
  const [anamnesisStudent, setAnamnesisStudent] = useState<Student | null>(null);
  const [isAnamnesisOpen, setIsAnamnesisOpen] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [settingGoalsForStudent, setSettingGoalsForStudent] = useState<Student | null>(null);
  const [isSetGoalsDialogOpen, setIsSetGoalsDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();