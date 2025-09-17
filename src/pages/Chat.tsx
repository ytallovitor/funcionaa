import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MessageCircle, 
  Users, 
  Plus,
  Filter
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ChatSystem from "@/components/ChatSystem";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  name: string;
  type: 'trainer' | 'student';
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
}

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, navigate]);

  const fetchConversations = async () => {
    try {
      setLoading(true);

      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Usuário não logado. Redirecionando para login.",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast({
          title: "Perfil não encontrado",
          description: "Faça login novamente",
          variant: "destructive"
        });
        return;
      }

      // Fetch trainer's conversations with students
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select(`
          *,
          students (
            id,
            name
          ),
          profiles (
            id,
            full_name
          ),
          messages (
            content,
            created_at,
            is_read,
            sender_type,
            order by created_at desc limit 1
          )
        `)
        .eq('trainer_id', profile.id)
        .order('messages.created_at', { ascending: false, referencedTable: 'messages' });

      if (error) throw error;

      // Transform data with fallback (otimização para evitar crashes)
      const transformedConversations: Conversation[] = (conversationsData as any[])?.map(conv => {
        const lastMessage = conv.messages?.[0];
        return {
          id: conv.id,
          name: (conv.students as any)?.name || (conv.profiles as any)?.full_name || 'Conversa',
          type: conv.students ? 'student' : 'trainer',
          lastMessage: lastMessage?.content || 'Sem mensagens',
          timestamp: lastMessage?.created_at ? new Date(lastMessage.created_at).toLocaleString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit',
            month: 'short',
            day: 'numeric'
          }) : 'Sem mensagens',
          unread: conv.messages?.filter((m: any) => !m.is_read).length || 0,
          online: Math.random() > 0.5 // Mock online status; implement Presence for real-time
        } as Conversation;
      }) || [];

      setConversations(transformedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as conversas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  if (loading) {
    return (
      <div className="h-screen flex">
        <div className="w-80 border-r bg-card">
          <div className="p-4 border-b">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="space-y-4 p-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="h-12 w-80" />
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-muted/20">
        <div className="text-center space-y-4 max-w-md w-full">
          <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold">Nenhuma conversa iniciada</h3>
            <p className="text-muted-foreground">
              Comece conversando com seus alunos para acompanhar o progresso
            </p>
          </div>
          <Button className="gradient-primary text-white" onClick={() => navigate('/students')}>
            <Users className="mr-2 h-4 w-4" />
            Gerenciar Alunos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Conversations List */}
      <div className="w-80 border-r bg-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Conversas</h2>
            <Button size="icon" variant="ghost" onClick={() => navigate('/students')}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              Todos
            </Button>
            <Button variant="ghost" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${
                selectedConversation === conversation.id ? 'bg-accent' : ''
              }`}
              onClick={() => setSelectedConversation(conversation.id)}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-white">
                      {conversation.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.online && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm truncate">
                      {conversation.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {conversation.timestamp}
                      </span>
                      {conversation.unread > 0 && (
                        <Badge className="bg-primary text-white text-xs px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                          {conversation.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        conversation.type === 'trainer' 
                          ? 'border-blue-500 text-blue-700' 
                          : 'border-green-500 text-green-700'
                      }`}
                    >
                      {conversation.type === 'trainer' ? 'Trainer' : 'Aluno'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {conversation.lastMessage}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation && selectedConv ? (
          <ChatSystem
            conversationId={selectedConversation}
            recipientName={selectedConv.name}
            recipientType={selectedConv.type}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center space-y-4">
              <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">Selecione uma conversa</h3>
                <p className="text-muted-foreground">
                  Escolha uma conversa para começar a trocar mensagens
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;