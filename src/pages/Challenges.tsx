import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Trophy, 
  Plus, 
  Clock, 
  Users,
  Target,
  Medal,
  Calendar,
  TrendingUp,
  Zap,
  Star,
  Play,
  Edit,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Gift
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  category: string;
  start_date: string;
  end_date: string;
  goal_value?: number;
  goal_unit?: string;
  prize_description?: string;
  is_active: boolean;
  created_at: string;
  trainer_id: string;
}

const Challenges = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'finished' | 'drafts'>('active');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Form state for creating challenges
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    challenge_type: '',
    category: '',
    start_date: '',
    end_date: '',
    goal_value: '',
    goal_unit: '',
    prize_description: ''
  });

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('trainer_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os desafios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createChallenge = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!profile) return;

      const { error } = await supabase
        .from('challenges')
        .insert({
          ...newChallenge,
          trainer_id: profile.id,
          goal_value: newChallenge.goal_value ? parseFloat(newChallenge.goal_value) : null,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Desafio criado com sucesso"
      });

      setIsCreateDialogOpen(false);
      setNewChallenge({
        title: '',
        description: '',
        challenge_type: '',
        category: '',
        start_date: '',
        end_date: '',
        goal_value: '',
        goal_unit: '',
        prize_description: ''
      });
      fetchChallenges();
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o desafio",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (isActive: boolean, endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    
    if (!isActive) return "bg-gray-100 text-gray-700";
    if (end < today) return "bg-blue-100 text-blue-700";
    return "bg-green-100 text-green-700";
  };

  const getStatus = (isActive: boolean, endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    
    if (!isActive) return "Rascunho";
    if (end < today) return "Finalizado";
    return "Ativo";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "individual": return <Target className="h-4 w-4" />;
      case "equipe": return <Users className="h-4 w-4" />;
      case "global": return <Trophy className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const filteredChallenges = challenges.filter(challenge => {
    const status = getStatus(challenge.is_active, challenge.end_date);
    switch (activeTab) {
      case 'active': return status === 'Ativo';
      case 'finished': return status === 'Finalizado';
      case 'drafts': return status === 'Rascunho';
      default: return true;
    }
  });

  const stats = [
    {
      title: "Desafios Ativos",
      value: challenges.filter(c => getStatus(c.is_active, c.end_date) === 'Ativo').length,
      change: "+2 este mês",
      icon: Zap,
      color: "text-orange-600"
    },
    {
      title: "Desafios Criados",
      value: challenges.length,
      change: "Total",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Taxa de Sucesso",
      value: "84%",
      change: "+12% vs anterior",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Prêmios Entregues",
      value: "15",
      change: "Este trimestre",
      icon: Gift,
      color: "text-purple-600"
    }
  ];

  if (loading) {
    return <div className="text-center py-8">Carregando desafios...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Central de Desafios
          </h1>
          <p className="text-muted-foreground mt-2">
            Crie desafios motivacionais para engajar e motivar seus alunos
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white">
                <Plus className="mr-2 h-4 w-4" />
                Novo Desafio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Desafio</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={newChallenge.title}
                      onChange={(e) => setNewChallenge({...newChallenge, title: e.target.value})}
                      placeholder="Ex: Desafio 30 Dias"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      value={newChallenge.category}
                      onChange={(e) => setNewChallenge({...newChallenge, category: e.target.value})}
                      placeholder="Ex: Força, Cardio, Mobilidade"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newChallenge.description}
                    onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})}
                    placeholder="Descreva os objetivos e regras do desafio"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="challenge_type">Tipo</Label>
                    <Select 
                      value={newChallenge.challenge_type} 
                      onValueChange={(value) => setNewChallenge({...newChallenge, challenge_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="equipe">Equipe</SelectItem>
                        <SelectItem value="global">Global</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal_value">Meta</Label>
                    <Input
                      id="goal_value"
                      type="number"
                      value={newChallenge.goal_value}
                      onChange={(e) => setNewChallenge({...newChallenge, goal_value: e.target.value})}
                      placeholder="Ex: 30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal_unit">Unidade</Label>
                    <Input
                      id="goal_unit"
                      value={newChallenge.goal_unit}
                      onChange={(e) => setNewChallenge({...newChallenge, goal_unit: e.target.value})}
                      placeholder="Ex: dias, kg, km"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Data de Início</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={newChallenge.start_date}
                      onChange={(e) => setNewChallenge({...newChallenge, start_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Data de Fim</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={newChallenge.end_date}
                      onChange={(e) => setNewChallenge({...newChallenge, end_date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prize_description">Prêmio</Label>
                  <Input
                    id="prize_description"
                    value={newChallenge.prize_description}
                    onChange={(e) => setNewChallenge({...newChallenge, prize_description: e.target.value})}
                    placeholder="Ex: Kit fitness + desconto 20%"
                  />
                </div>

                <Button onClick={createChallenge} className="gradient-primary text-white">
                  Criar Desafio
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Trophy className="mr-2 h-4 w-4" />
            Templates
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-primary/10 border-primary/20 hover:shadow-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="gradient-primary p-2 rounded-lg">
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {stat.change}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation Tabs */}
      <Card className="shadow-primary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'active' ? 'default' : 'outline'}
              onClick={() => setActiveTab('active')}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Ativos ({challenges.filter(c => getStatus(c.is_active, c.end_date) === 'Ativo').length})
            </Button>
            <Button
              variant={activeTab === 'finished' ? 'default' : 'outline'}
              onClick={() => setActiveTab('finished')}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Finalizados ({challenges.filter(c => getStatus(c.is_active, c.end_date) === 'Finalizado').length})
            </Button>
            <Button
              variant={activeTab === 'drafts' ? 'default' : 'outline'}
              onClick={() => setActiveTab('drafts')}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Rascunhos ({challenges.filter(c => getStatus(c.is_active, c.end_date) === 'Rascunho').length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Challenges Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChallenges.map((challenge) => {
          const status = getStatus(challenge.is_active, challenge.end_date);
          const daysRemaining = Math.ceil((new Date(challenge.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          
          return (
            <Card key={challenge.id} className="shadow-primary/10 border-primary/20 hover:shadow-primary/20 transition-all group overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary to-primary-glow" />
              
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🏆</div>
                    <div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {challenge.title}
                      </CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge className={getStatusColor(challenge.is_active, challenge.end_date)}>
                          {status}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getTypeIcon(challenge.challenge_type)}
                          {challenge.challenge_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="line-clamp-2 mt-2">
                  {challenge.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Challenge Info */}
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="flex items-center justify-center">
                        <Target className="h-4 w-4 text-muted-foreground mr-1" />
                        <span className="text-sm font-medium">
                          {challenge.goal_value} {challenge.goal_unit}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Meta</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center">
                        <Clock className="h-4 w-4 text-muted-foreground mr-1" />
                        <span className="text-sm font-medium">
                          {daysRemaining > 0 ? `${daysRemaining} dias` : 'Finalizado'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Restantes</p>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="flex justify-center">
                    <Badge variant="outline">
                      {challenge.category}
                    </Badge>
                  </div>

                  {/* Prize */}
                  {challenge.prize_description && (
                    <div className="bg-accent/30 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">Prêmio</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{challenge.prize_description}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {status === 'Ativo' && (
                      <Button size="sm" className="flex-1">
                        <Play className="mr-2 h-4 w-4" />
                        Acompanhar
                      </Button>
                    )}
                    {status === 'Rascunho' && (
                      <Button size="sm" className="flex-1">
                        <Play className="mr-2 h-4 w-4" />
                        Publicar
                      </Button>
                    )}
                    {status === 'Finalizado' && (
                      <Button size="sm" variant="outline" className="flex-1">
                        <Medal className="mr-2 h-4 w-4" />
                        Resultados
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Challenge Ideas */}
      <Card className="shadow-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Ideias de Desafios Populares
          </CardTitle>
          <CardDescription>
            Inspire-se com os desafios mais eficazes para motivar alunos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "7 Dias Detox", icon: "🥗", category: "Nutrição" },
              { title: "10.000 Passos", icon: "👟", category: "Cardio" },
              { title: "Flexão Challenge", icon: "💪", category: "Força" },
              { title: "Meditação Diária", icon: "🧘", category: "Mental" }
            ].map((idea, index) => (
              <div key={index} className="p-4 border border-primary/20 rounded-lg hover:bg-accent/30 transition-colors cursor-pointer">
                <div className="text-2xl mb-2">{idea.icon}</div>
                <h4 className="font-medium">{idea.title}</h4>
                <p className="text-sm text-muted-foreground">{idea.category}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Features */}
      <Card className="shadow-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle>🚀 Próximas Atualizações</CardTitle>
          <CardDescription>
            Recursos avançados chegando em breve
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border border-primary/20 rounded-lg opacity-60">
              <h4 className="font-medium mb-2">🏆 Sistema de Pontos</h4>
              <p className="text-sm text-muted-foreground">
                Gamificação completa com rankings e recompensas
              </p>
            </div>
            <div className="p-4 border border-primary/20 rounded-lg opacity-60">
              <h4 className="font-medium mb-2">📱 Notificações Push</h4>
              <p className="text-sm text-muted-foreground">
                Lembretes automáticos e atualizações em tempo real
              </p>
            </div>
            <div className="p-4 border border-primary/20 rounded-lg opacity-60">
              <h4 className="font-medium mb-2">🎯 IA Personalizada</h4>
              <p className="text-sm text-muted-foreground">
                Desafios automáticos baseados no perfil do aluno
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Challenges;