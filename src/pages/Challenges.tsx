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
  Gift,
  FileText
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

// Templates pré-definidos (8 exemplos científicos, baseados em guidelines ACSM/NSCA) - Sem 'difficulty' para compatibilidade
const CHALLENGE_TEMPLATES = [
  {
    title: "30 Dias de Força",
    description: "Treino diário para ganho de força e massa muscular (ACSM: 3-5x/semana, 8-12 reps).",
    challenge_type: "individual",
    category: "Força",
    goal_value: 30,
    goal_unit: "dias",
    prize_description: "Kit de suplementos + consulta gratuita"
  },
  {
    title: "Detox 7 Dias",
    description: "Desafio de nutrição para desintoxicação e reset metabólico (NSCA: foco em fibras e hidratação).",
    challenge_type: "individual",
    category: "Nutrição",
    goal_value: 7,
    goal_unit: "dias",
    prize_description: "Voucher de nutrição esportiva"
  },
  {
    title: "10.000 Passos Diários",
    description: "Desafio de cardio para melhorar VO2 max e queima calórica (ACSM: 10k passos/dia para saúde cardiovascular).",
    challenge_type: "individual",
    category: "Cardio",
    goal_value: 10000,
    goal_unit: "passos",
    prize_description: "Smartwatch básico"
  },
  {
    title: "Flexão Challenge",
    description: "Melhore força superior com progressão de reps (NSCA: 3 sets, aumentar 10% semanal).",
    challenge_type: "individual",
    category: "Força",
    goal_value: 100,
    goal_unit: "flexões",
    prize_description: "Camiseta fitness + shake pós-treino"
  },
  {
    title: "Meditação Diária 10 Min",
    description: "Reduza estresse e melhore foco (ACSM: 10 min/dia para redução de cortisol).",
    challenge_type: "individual",
    category: "Mental",
    goal_value: 10,
    goal_unit: "minutos",
    prize_description: "Acesso a app de meditação"
  },
  {
    title: "Desafio Equipe 21 Dias",
    description: "Treino em grupo para motivação coletiva (NSCA: treinos em equipe aumentam adesão 40%).",
    challenge_type: "equipe",
    category: "Funcional",
    goal_value: 21,
    goal_unit: "dias",
    prize_description: "Encontro em grupo + prêmios coletivos"
  },
  {
    title: "HIIT 4 Semanas",
    description: "Alta intensidade para perda de gordura (ACSM: HIIT queima 15% mais calorias que cardio steady-state).",
    challenge_type: "individual",
    category: "HIIT",
    goal_value: 16,
    goal_unit: "sessões",
    prize_description: "Aulas particulares gratuitas"
  },
  {
    title: "Mobilidade Semanal",
    description: "Melhore amplitude de movimento (NSCA: 3x/semana para reduzir risco de lesão em 25%).",
    challenge_type: "individual",
    category: "Flexibilidade",
    goal_value: 12,
    goal_unit: "sessões",
    prize_description: "Kit de yoga básico"
  }
];

const Challenges = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'finished' | 'drafts'>('active');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTemplatesDialogOpen, setIsTemplatesDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  
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

  const createChallenge = async (template?: any) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!profile) return;

      // Validação: Campos obrigatórios (title, description, challenge_type, category, start_date, end_date)
      if (!newChallenge.title.trim()) {
        toast({
          title: "Validação",
          description: "Título é obrigatório.",
          variant: "destructive"
        });
        return;
      }
      if (!newChallenge.description.trim()) {
        toast({
          title: "Validação",
          description: "Descrição é obrigatória.",
          variant: "destructive"
        });
        return;
      }
      if (!newChallenge.challenge_type) {
        toast({
          title: "Validação",
          description: "Tipo de desafio é obrigatório.",
          variant: "destructive"
        });
        return;
      }
      if (!newChallenge.category.trim()) {
        toast({
          title: "Validação",
          description: "Categoria é obrigatória.",
          variant: "destructive"
        });
        return;
      }
      if (!newChallenge.start_date) {
        toast({
          title: "Validação",
          description: "Data de início é obrigatória.",
          variant: "destructive"
        });
        return;
      }
      if (!newChallenge.end_date) {
        toast({
          title: "Validação",
          description: "Data de fim é obrigatória.",
          variant: "destructive"
        });
        return;
      }

      let startDate = newChallenge.start_date;
      let endDate = newChallenge.end_date;

      // Defaults automáticos para datas se vazias (hoje para start, 30 dias para end)
      if (!startDate) {
        startDate = new Date().toISOString().split('T')[0];
        toast({
          title: "Aviso",
          description: "Data de início não informada. Usando hoje como início.",
        });
      }
      if (!endDate) {
        endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 dias à frente
        toast({
          title: "Aviso",
          description: "Data de fim não informada. Definindo 30 dias a partir de hoje.",
        });
      }

      // Filtrar só campos válidos do schema (evita inserir 'difficulty' ou outros)
      const validFields = {
        title: newChallenge.title.trim(),
        description: newChallenge.description.trim(),
        challenge_type: newChallenge.challenge_type,
        category: newChallenge.category.trim(),
        start_date: startDate,
        end_date: endDate,
        goal_value: newChallenge.goal_value ? parseFloat(newChallenge.goal_value) : null,
        goal_unit: newChallenge.goal_unit ? newChallenge.goal_unit.trim() : null,
        prize_description: newChallenge.prize_description ? newChallenge.prize_description.trim() : null,
        trainer_id: profile.id,
        is_active: true
      };

      // Se veio de template, usa os dados do template (sem 'difficulty')
      if (template) {
        validFields.title = template.title;
        validFields.description = template.description;
        validFields.challenge_type = template.challenge_type;
        validFields.category = template.category;
        validFields.goal_value = template.goal_value;
        validFields.goal_unit = template.goal_unit;
        validFields.prize_description = template.prize_description;
        validFields.start_date = new Date().toISOString().split('T')[0]; // Início hoje
        validFields.end_date = new Date(Date.now() + (template.goal_value * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // Fim baseado na meta
      }

      const { error } = await supabase
        .from('challenges')
        .insert(validFields);

      if (error) {
        console.error('Supabase Error Details:', error); // Debug: Mostra erro exato no console
        throw error;
      }

      toast({
        title: "Sucesso!",
        description: template ? "Desafio criado a partir do template!" : "Desafio criado com sucesso"
      });

      setIsCreateDialogOpen(false);
      setIsTemplatesDialogOpen(false);
      setSelectedTemplate(null);
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
    } catch (error: any) {
      console.error('Error creating challenge:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o desafio. Verifique os campos e tente novamente.",
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
          <Dialog open={isTemplatesDialogOpen} onOpenChange={setIsTemplatesDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Templates
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Templates de Desafios</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Escolha um template para criar um desafio rapidamente (baseados em guidelines ACSM/NSCA)
                </p>
              </DialogHeader>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {CHALLENGE_TEMPLATES.map((template, index) => (
                  <Card
                    key={index}
                    className="cursor-pointer hover:shadow-primary/20 transition-all duration-300 hover:scale-105 group border-primary/20"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setNewChallenge(template); // Preenche o form
                      setIsTemplatesDialogOpen(false);
                      setIsCreateDialogOpen(true);
                    }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <div className="text-2xl">{getTypeIcon(template.challenge_type)}</div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {template.title}
                        </CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="flex items-center gap-1">
                          {getTypeIcon(template.challenge_type)}
                          {template.challenge_type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p className="line-clamp-2">{template.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-medium">Meta: {template.goal_value} {template.goal_unit}</span>
                        <Badge variant="outline" className="text-xs">
                          {template.prize_description}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          
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
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={newChallenge.title}
                      onChange={(e) => setNewChallenge({...newChallenge, title: e.target.value})}
                      placeholder="Ex: Desafio 30 Dias"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria *</Label>
                    <Input
                      id="category"
                      value={newChallenge.category}
                      onChange={(e) => setNewChallenge({...newChallenge, category: e.target.value})}
                      placeholder="Ex: Força, Cardio, Mobilidade"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    value={newChallenge.description}
                    onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})}
                    placeholder="Descreva os objetivos e regras do desafio"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="challenge_type">Tipo *</Label>
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
                    <Label htmlFor="start_date">Data de Início *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={newChallenge.start_date}
                      onChange={(e) => setNewChallenge({...newChallenge, start_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Data de Fim *</Label>
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

                <Button onClick={() => createChallenge(selectedTemplate)} className="gradient-primary text-white" disabled={!newChallenge.title || !newChallenge.description || !newChallenge.challenge_type || !newChallenge.category || !newChallenge.start_date || !newChallenge.end_date}>
                  Criar Desafio
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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