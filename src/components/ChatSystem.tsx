import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Camera, 
  Mic, 
  Video,
  Phone,
  MoreVertical,
  Circle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_type: 'trainer' | 'student';
  timestamp: string;
  message_type: 'text' | 'image' | 'voice' | 'video';
  read: boolean;
}

interface ChatSystemProps {
  conversationId?: string;
  recipientName?: string;
  recipientType?: 'trainer' | 'student';
  compact?: boolean;
}

const ChatSystem = ({ 
  conversationId, 
  recipientName = "Personal Trainer",
  recipientType = "trainer",
  compact = false 
}: ChatSystemProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Mock messages for demo
  useEffect(() => {
    const mockMessages: Message[] = [
      {
        id: "1",
        content: "Olá! Como foi o treino de hoje?",
        sender_id: "trainer-1",
        sender_name: "Carlos Silva",
        sender_type: "trainer",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        message_type: "text",
        read: true
      },
      {
        id: "2", 
        content: "Foi excelente! Consegui aumentar a carga no supino.",
        sender_id: "student-1",
        sender_name: "João",
        sender_type: "student", 
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        message_type: "text",
        read: true
      },
      {
        id: "3",
        content: "Perfeito! Vamos ajustar o treino da próxima semana então. 💪",
        sender_id: "trainer-1", 
        sender_name: "Carlos Silva",
        sender_type: "trainer",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        message_type: "text",
        read: false
      }
    ];
    setMessages(mockMessages);
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const message: Message = {
      id: Math.random().toString(),
      content: newMessage,
      sender_id: user.id,
      sender_name: user.email?.split("@")[0] || "Você",
      sender_type: "student", // This would be determined by user role
      timestamp: new Date().toISOString(),
      message_type: "text",
      read: false
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");
    
    // Simulate trainer response
    setTimeout(() => {
      const response: Message = {
        id: Math.random().toString(),
        content: "Recebido! Vou analisar e te responder em breve.",
        sender_id: "trainer-1",
        sender_name: recipientName,
        sender_type: "trainer",
        timestamp: new Date().toISOString(),
        message_type: "text",
        read: false
      };
      setMessages(prev => [...prev, response]);
    }, 2000);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (compact) {
    return (
      <Card className="h-96 flex flex-col">
        <CardHeader className="p-3 border-b">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-primary text-white">
                {recipientName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="text-sm font-semibold">{recipientName}</h4>
              <div className="flex items-center gap-1">
                <Circle className="h-3 w-3 text-green-500 fill-current" />
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 flex flex-col">
          <ScrollArea className="flex-1 p-3" ref={scrollAreaRef}>
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_type === 'student' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-2 ${
                      message.sender_type === 'student'
                        ? 'gradient-primary text-white'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender_type === 'student' ? 'text-white/70' : 'text-muted-foreground'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1"
              />
              <Button size="icon" onClick={sendMessage} className="gradient-primary text-white">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-white">
                {recipientName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{recipientName}</h3>
              <div className="flex items-center gap-2">
                <Circle className="h-4 w-4 text-green-500 fill-current" />
                <span className="text-sm text-muted-foreground">
                  {isOnline ? "Online agora" : "Última vez há 5 min"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_type === 'student' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-end gap-2 max-w-[70%]">
                {message.sender_type === 'trainer' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-muted">
                      {message.sender_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg p-3 ${
                    message.sender_type === 'student'
                      ? 'gradient-primary text-white'
                      : 'bg-muted'
                  }`}
                >
                  <p>{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender_type === 'student' ? 'text-white/70' : 'text-muted-foreground'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-muted">
                  {recipientName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Camera className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Mic className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1"
          />
          <Button onClick={sendMessage} className="gradient-primary text-white">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatSystem;