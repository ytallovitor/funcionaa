import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Copy, Save, User, Bell, Shield, CreditCard, HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ProfileData {
  full_name: string;
  email: string;
  phone?: string;
  cref?: string;
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone: '',
    cref: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    emailNewStudents: true,
    evaluationReminders: true,
    weeklyReports: false,
    marketingEmails: false
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: '', // Add these fields to profiles table if needed
          cref: ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          email: profile.email
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyPortalLink = () => {
    const link = `${window.location.origin}/student-portal`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado",
      description: "Link do portal copiado para a área de transferência",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          Configurações
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas preferências e configurações da conta
        </p>
      </div>
      
      <div className="grid gap-6">
        <Card className="shadow-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Perfil do Personal
            </CardTitle>
            <CardDescription>
              Gerencie suas informações pessoais e preferências
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input 
                    id="name" 
                    placeholder="Seu nome completo"
                    value={profile.full_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="seu@email.com"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input 
                    id="phone" 
                    placeholder="(11) 99999-9999"
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="cref">CREF</Label>
                  <Input 
                    id="cref" 
                    placeholder="123456-G/SP"
                    value={profile.cref}
                    onChange={(e) => setProfile(prev => ({ ...prev, cref: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={fetchProfile}>
                  Cancelar
                </Button>
                <Button onClick={handleProfileUpdate} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Portal do Aluno
            </CardTitle>
            <CardDescription>
              Configure o acesso dos seus alunos aos treinos e avaliações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Portal Ativo</h4>
                  <p className="text-sm text-muted-foreground">
                    Permite que alunos acessem seus dados
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Ativo
                  </Badge>
                  <Switch defaultChecked />
                </div>
              </div>
              <Separator />
              <div>
                <Label htmlFor="portal-url">Link do Portal</Label>
                <div className="flex space-x-2 mt-1">
                  <Input 
                    id="portal-url" 
                    value={`${window.location.origin}/student-portal`}
                    readOnly 
                  />
                  <Button variant="outline" size="sm" onClick={copyPortalLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Compartilhe este link com seus alunos para acesso ao portal
                </p>
              </div>
              <div className="bg-accent/30 p-4 rounded-lg">
                <h4 className="font-medium text-sm mb-2">💡 Dica</h4>
                <p className="text-sm text-muted-foreground">
                  Cada aluno terá credenciais únicas criadas por você na seção "Alunos"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure como deseja receber notificações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">E-mail de Novos Alunos</h4>
                  <p className="text-sm text-muted-foreground">
                    Receba quando um novo aluno se cadastrar
                  </p>
                </div>
                <Switch 
                  checked={notifications.emailNewStudents}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailNewStudents: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Lembrete de Avaliações</h4>
                  <p className="text-sm text-muted-foreground">
                    Notificação para avaliações agendadas
                  </p>
                </div>
                <Switch 
                  checked={notifications.evaluationReminders}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, evaluationReminders: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Relatórios Semanais</h4>
                  <p className="text-sm text-muted-foreground">
                    Resumo semanal do progresso dos alunos
                  </p>
                </div>
                <Switch 
                  checked={notifications.weeklyReports}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weeklyReports: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">E-mails de Marketing</h4>
                  <p className="text-sm text-muted-foreground">
                    Dicas, novidades e atualizações da plataforma
                  </p>
                </div>
                <Switch 
                  checked={notifications.marketingEmails}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, marketingEmails: checked }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Plano & Cobrança
              </CardTitle>
              <CardDescription>
                Gerencie sua assinatura e métodos de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Plano Atual</h4>
                    <p className="text-sm text-muted-foreground">YFit Pro - Completo</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">
                    Ativo
                  </Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Próxima cobrança:</span>
                    <span className="font-medium">15/03/2024</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Valor:</span>
                    <span className="font-medium">R$ 97,00/mês</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Gerenciar Cobrança
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Suporte & Ajuda
              </CardTitle>
              <CardDescription>
                Precisa de ajuda? Estamos aqui para apoiar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  📚 Central de Ajuda
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  💬 Chat com Suporte
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  📞 Agendar Demonstração
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  🚀 Solicitar Funcionalidade
                </Button>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground text-center">
                    Versão 2.0.1 • Última atualização: Hoje
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;