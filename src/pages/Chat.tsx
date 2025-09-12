import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import ChatSystem from "@/components/ChatSystem";
import { useAuth } from "@/hooks/useAuth";

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
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock conversations - would come from database
  const conversations: Conversation[] = [
    {
      id: "1",
      name: "Carlos Silva",
      type: "trainer",
      lastMessage: "Vamos ajustar o treino da próxima semana então. 💪",
      timestamp: "2 min",
      unread: 1,
      online: true
    },
    {
      id: "2", 
      name: "Maria Santos",
      type: "student",
      lastMessage: "Terminei o treino de hoje! 🔥",
      timestamp: "15 min",
      unread: 0,
      online: true
    },
    {
      id: "3",
      name: "João Pedro",
      type: "student", 
      lastMessage: "Qual exercício posso fazer no lugar do agachamento?",
      timestamp: "1 h",
      unread: 2,
      online: false
    },
    {
      id: "4",
      name: "Ana Costa",
      type: "student",
      lastMessage: "Obrigada pelas dicas de alimentação!",
      timestamp: "3 h", 
      unread: 0,
      online: false
    }
  ];

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="h-screen flex">
      {/* Conversations List */}
      <div className="w-80 border-r bg-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Conversas</h2>
            <Button size="icon" variant="ghost">
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