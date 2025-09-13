import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Copy, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  name: string;
  age: number;
  gender: string;
  goal: string;
  height: number;
}

interface StudentPortalManagerProps {
  student: Student;
  onPortalCreated?: () => void;
}

const normalizeString = (str: string) => {
  return str
    .normalize("NFD") // Separa acentos das letras
    .replace(/[\u0300-\u036f]/g, "") // Remove os acentos
    .toLowerCase()
    .replace(/\s+/g, ''); // Remove espaços
};

const StudentPortalManager = ({ student, onPortalCreated }: StudentPortalManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [portalData, setPortalData] = useState<{username: string, password: string, trainerId: string} | null>(null);
  const [hasExistingPortal, setHasExistingPortal] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  const generateCredentials = () => {
    const username = normalizeString(student.name) + Math.random().toString(36).substr(2, 4);
    const password = Math.random().toString(36).substr(2, 8) + Math.random().toString(36).substr(2, 2).toUpperCase();
    
    setFormData({
      username,
      password
    });
  };

  const loadExistingPortal = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get trainer profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Perfil do trainer não encontrado');

      // Check for existing portal
      const { data: existingPortal } = await supabase
        .from('student_portals')
        .select('*')
        .eq('student_id', student.id)
        .maybeSingle();

      if (existingPortal) {
        // Decode password for display
        const decodedPassword = atob(existingPortal.password_hash);
        setPortalData({
          username: existingPortal.username,
          password: decodedPassword,
          trainerId: profile.id
        });
        setFormData({
          username: existingPortal.username,
          password: decodedPassword
        });
        setHasExistingPortal(true);
      } else {
        setHasExistingPortal(false);
      }
    } catch (error: any) {
      console.error('Error loading portal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrUpdatePortal = async () => {
    if (!user || !formData.username || !formData.password) return;

    setIsCreating(true);

    try {
      // Get trainer profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Perfil do trainer não encontrado');

      // Hash password
      const passwordHash = btoa(formData.password);

      if (hasExistingPortal) {
        // Update existing portal
        const { error } = await supabase
          .from('student_portals')
          .update({
            username: formData.username,
            password_hash: passwordHash
          })
          .eq('student_id', student.id);

        if (error) throw error;

        toast({
          title: "Portal atualizado!",
          description: "Credenciais do aluno atualizadas com sucesso"
        });
      } else {
        // Create new portal
        const { error } = await supabase
          .from('student_portals')
          .insert({
            student_id: student.id,
            username: formData.username,
            password_hash: passwordHash
          });

        if (error) throw error;

        toast({
          title: "Portal criado!",
          description: "Acesso do aluno criado com sucesso"
        });
        setHasExistingPortal(true);
      }

      setPortalData({
        username: formData.username,
        password: formData.password,
        trainerId: profile.id
      });

      setIsEditing(false);
      onPortalCreated?.();
    } catch (error: any) {
      console.error('Error creating/updating portal:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao salvar acesso do aluno",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência"
    });
  };

  const getPortalUrl = () => {
    if (!portalData) return "";
    return `${window.location.origin}/portal/${portalData.trainerId}`;
  };

  return (
    <Dialog onOpenChange={(open) => {
      if (open) {
        loadExistingPortal();
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <KeyRound className="h-4 w-4 mr-2" />
          {hasExistingPortal ? "Gerenciar Acesso" : "Criar Acesso"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Portal do Aluno
          </DialogTitle>
          <DialogDescription>
            Criar acesso para {student.name} visualizar seus dados
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !portalData || isEditing ? (
          <div className="space-y-4">
            {hasExistingPortal && !isEditing && (
              <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                <h3 className="font-semibold text-primary mb-2">Portal já existe!</h3>
                <p className="text-sm text-muted-foreground">
                  Clique em "Editar Credenciais" para alterar as informações
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Nome de usuário</Label>
              <div className="flex gap-2">
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Ex: joaosilva123"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateCredentials}
                >
                  Gerar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Senha do aluno"
              />
            </div>

            <div className="flex gap-2">
              {hasExistingPortal && isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </Button>
              )}
              <Button
                onClick={handleCreateOrUpdatePortal}
                disabled={isCreating || !formData.username || !formData.password}
                className="flex-1 gradient-primary"
              >
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {hasExistingPortal ? "Salvar Alterações" : "Criar Portal"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
              <h3 className="font-semibold text-primary mb-2">Portal criado com sucesso!</h3>
              <p className="text-sm text-muted-foreground">
                Compartilhe essas informações com {student.name}
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">URL do Portal</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={getPortalUrl()}
                    readOnly
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(getPortalUrl())}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Usuário</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={portalData.username}
                    readOnly
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(portalData.username)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Senha</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={portalData.password}
                    readOnly
                    type="text"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(portalData.password)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="flex-1"
              >
                Editar Credenciais
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex-1"
              >
                <a href={getPortalUrl()} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Testar
                </a>
              </Button>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <strong>Instruções para o aluno:</strong><br/>
              1. Acesse o link do portal<br/>
              2. Digite o nome de usuário e senha<br/>
              3. Visualize suas avaliações e progresso
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StudentPortalManager;