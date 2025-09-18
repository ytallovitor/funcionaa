import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ChatSystem from '@/components/ChatSystem'; // Ensure this is the default export
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Added Input for search
import { Avatar, AvatarFallback } from '@/components/ui/avatar'; // Added Avatar components
import { ScrollArea } from '@/components/ui/scroll-area'; // Added ScrollArea
import { Badge } from '@/components/ui/badge'; // Added Badge
import { Loader2, Search, Plus, Filter, MessageCircle, Users } from 'lucide-react'; // Added Users icon
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ConversationListItem {
  id: string;
  student_id: string;
  last_message_at: string | null;
  students: {
    id: string;
    name: string;
  } | null;
  lastMessageContent?: string;
  unreadCount?: number;
}

export const ChatPage = () => {
  const { id: conversationIdParam } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(conversationIdParam || null);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [trainerProfileId, setTrainerProfileId] = useState<string | null>(null); // Kept for consistency, though not directly used in render

  useEffect(() => {
    const initializeChat = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      // Fetch trainer's profile ID
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profileData) {
        console.error('Error fetching trainer profile ID:', profileError);
        toast.error('Erro ao carregar perfil do treinador.');
        setLoading(false);
        return;
      }
      setTrainerProfileId(profileData.id);

      if (conversationIdParam) {
        setConversationId(conversationIdParam);
        fetchStudentName(conversationIdParam);
      } else {
        fetchConversations(profileData.id);
      }
    };

    initializeChat();
  }, [user, conversationIdParam, navigate]);

  const fetchConversations = async (profileId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('conversations')
        .select(
          `
            id,
            last_message_at,
            student_id,
            students (
              id,
              name
            ),
            messages (
              content,
              created_at,
              is_read,
              sender_id
            )
          `
        )
        .eq('trainer_id', profileId)
        .order('last_message_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const processedConversations: ConversationListItem[] = (data || []).map(conv => {
        const lastMessage = conv.messages?.[0];
        const unreadCount = conv.messages?.filter((m: any) => !m.is_read && m.sender_id !== user?.id).length || 0;
        return {
          id: conv.id,
          student_id: conv.student_id,
          last_message_at: conv.last_message_at,
          students: conv.students as { id: string; name: string } | null, // Explicit cast
          lastMessageContent: lastMessage?.content || 'Sem mensagens',
          unreadCount: unreadCount,
        };
      });

      setConversations(processedConversations);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err?.message || 'Erro ao carregar conversas.');
      toast.error('Erro ao carregar conversas. Consulte o console para detalhes.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentName = async (convId: string) => {
    try {
      if (!convId) return;
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          students (
            name
          )
        `)
        .eq('id', convId)
        .single();

      if (convError) throw convError;

      if (conversation?.students && 'name' in conversation.students) { // Check if 'name' property exists
        setStudentName(conversation.students.name);
      } else {
        setStudentName('Aluno Desconhecido');
      }
    } catch (err: any) {
      console.error('Error fetching student name:', err);
      setStudentName('Erro ao carregar nome');
      toast.error('Erro ao carregar nome do aluno.');
    }
  };

  const handleSelectConversation = (convId: string, name: string) => {
    setConversationId(convId);
    setStudentName(name);
    navigate(`/chat/${convId}`);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.students?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4 text-center">
        <MessageCircle className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-xl font-bold text-destructive">Erro ao carregar o chat</h3>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => window.location.reload()} className="gradient-primary">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Conversations List Sidebar */}
      <div className="w-80 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Conversas</h2>
            <Button size="icon" variant="ghost" onClick={() => navigate('/students')}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
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

        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma conversa encontrada.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${
                    conversationId === conv.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => handleSelectConversation(conv.id, conv.students?.name || 'Aluno')}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-white">
                          {conv.students?.name?.charAt(0) || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      {/* Mock online status */}
                      {Math.random() > 0.5 && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm truncate">
                          {conv.students?.name || 'Aluno'}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                          {conv.unreadCount && conv.unreadCount > 0 && (
                            <Badge className="bg-primary text-white text-xs px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {conv.lastMessageContent}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {conversationId && studentName ? (
          <ChatSystem
            conversationId={conversationId}
            recipientName={studentName}
            recipientType="student" // Assuming trainer is chatting with a student
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