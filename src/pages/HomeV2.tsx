import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  TrendingUp, 
  Target, 
  Smartphone, 
  Shield, 
  Zap,
  Play,
  Star,
  ArrowRight,
  CheckCircle,
  MessageCircle,
  Calendar,
  BarChart3
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const HomeV2 = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const benefits = [
    {
      icon: Target,
      title: "Acompanhamento Preciso",
      description: "Medidas corporais, % gordura, massa magra e TMB calculados automaticamente"
    },
    {
      icon: TrendingUp,
      title: "Evolução Visual",
      description: "Gráficos interativos e comparação de fotos de progresso lado a lado"
    },
    {
      icon: Users,
      title: "Gestão de Alunos",
      description: "Para personal trainers gerenciarem múltiplos alunos em uma plataforma"
    },
    {
      icon: Smartphone,
      title: "PWA Mobile",
      description: "Aplicativo instalável no celular com sincronização em tempo real"
    },
    {
      icon: MessageCircle,
      title: "Chat Integrado",
      description: "Comunicação direta entre aluno e personal trainer com fotos e vídeos"
    },
    {
      icon: BarChart3,
      title: "Relatórios Avançados",
      description: "Exportação em PDF/CSV e integração com Google Fit, Apple Health"
    }
  ];

  const plans = [
    {
      name: "Básico",
      price: "R$ 29,90",
      period: "/mês",
      description: "Para alunos individuais",
      features: [
        "Registro ilimitado de medidas",
        "Cálculos automáticos de composição corporal",
        "Histórico com gráficos",
        "Chat com personal trainer",
        "Aplicativo mobile (PWA)"
      ],
      popular: false
    },
    {
      name: "Premium",
      price: "R$ 79,90",
      period: "/mês",
      description: "Para personal trainers",
      features: [
        "Até 50 alunos",
        "Gestão completa de treinos",
        "Relatórios e exportações",
        "Integração com wearables",
        "Suporte prioritário",
        "Sistema de desafios"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "R$ 199,90",
      period: "/mês",
      description: "Para academias",
      features: [
        "Alunos ilimitados",
        "Multi-trainer",
        "API personalizada",
        "White label",
        "Analytics avançado",
        "Suporte dedicado"
      ],
      popular: false
    }
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      role: "Personal Trainer",
      avatar: "👩‍💼",
      content: "Revolucionou meu trabalho! Agora consigo acompanhar todos os meus alunos de forma profissional e visual.",
      rating: 5
    },
    {
      name: "João Santos",
      role: "Atleta",
      avatar: "💪",
      content: "Finalmente uma plataforma que calcula tudo automaticamente. Vejo minha evolução claramente!",
      rating: 5
    },
    {
      name: "Academia FitLife",
      role: "Estabelecimento",
      avatar: "🏢",
      content: "Nossos personal trainers adoraram. Sistema completo e fácil de usar para toda a equipe.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-90"></div>
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="text-center space-y-8">
            <Badge className="mx-auto bg-white/20 text-white border-white/30 hover:bg-white/30">
              ✨ Nova Versão 2.0 - Plataforma Completa
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Transforme seu
              <span className="block text-gradient">Acompanhamento Fitness</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              A plataforma integrada para personal trainers, academias e alunos. 
              Registre medidas, acompanhe evolução e gerencie treinos em tempo real.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              {user ? (
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90 shadow-hero"
                  onClick={() => navigate('/dashboard')}
                >
                  Acessar Painel
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90 shadow-hero"
                    onClick={() => navigate('/auth')}
                  >
                    Comece sua Transformação
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg px-8 py-6 bg-white/10 text-white border-white/30 hover:bg-white/20"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Ver Demo
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gradient">
              Por que escolher nossa plataforma?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Tecnologia avançada para resultados reais no seu acompanhamento fitness
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center p-6 shadow-primary/10 border-primary/20 hover:shadow-primary/20 transition-all duration-300 group">
                <CardHeader>
                  <div className="gradient-primary p-3 rounded-xl shadow-glow mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <benefit.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {benefit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gradient">
              Planos que se adaptam ao seu objetivo
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Do aluno individual às grandes academias, temos o plano perfeito para você
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative p-6 ${plan.popular ? 'ring-2 ring-primary shadow-hero scale-105' : 'shadow-primary/10'} transition-all duration-300 hover:shadow-primary/20 group border-primary/20`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white">
                    Mais Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-primary">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <CardDescription className="text-base">{plan.description}</CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full mt-6 ${plan.popular ? 'gradient-primary text-white shadow-hero' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    {plan.popular ? 'Começar Agora' : 'Escolher Plano'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gradient">
              O que nossos usuários dizem
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Histórias reais de transformação e sucesso
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 shadow-primary/10 border-primary/20 hover:shadow-primary/20 transition-all duration-300">
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{testimonial.avatar}</div>
                    <div>
                      <h4 className="font-medium">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-5 w-5 fill-current ${i < testimonial.rating ? 'text-yellow-400' : 'text-yellow-200'}`} />
                    ))}
                  </div>
                  
                  <p className="text-base leading-relaxed italic">
                    "{testimonial.content}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 text-center">
          <div className="space-y-8 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Pronto para revolucionar seu fitness?
            </h2>
            <p className="text-xl text-white/90">
              Junte-se a milhares de pessoas que já transformaram sua rotina de exercícios
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90 shadow-hero"
                onClick={() => navigate('/auth')}
              >
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeV2;