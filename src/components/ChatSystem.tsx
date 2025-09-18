import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Camera, 
  Mic, 
  Video,
  Phone,
  MoreVertical
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner"; // Import toast from sonner

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_type: 'trainer' | 'student';
  timestamp: string;
  message_type: 'text' | 'image' | 'voice' | 'video';
  is_read: boolean;
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
  compact = false 
}: ChatSystemProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<{ id: string; full_name: string; } | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('user_id', user.id)
          .single();
        if (error) {
          console.error("Error fetching user profile for chat:", error);
        } else {
          setCurrentUserProfile(profile);
        }
      }
    };
    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    if (!conversationId || !user) return;

    // Fetch initial messages
    fetchMessages();

    // Realtime subscription
    const channel = supabase.channel('messages', {
      config: {
        broadcast: {
          ack: true,
        },
      },
    });

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]); // Add new message to the end
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev => 
            prev.map(m => m.id === (payload.new as Message).id ? { ...m, is_read: (payload.new as Message).is_read } : m)
          );
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime subscribed to messages');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  const fetchMessages = async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles (full_name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const transformedMessages: Message[] = data?.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_id: msg.sender_id,
        sender_name: (msg.profiles as { full_name: string } | null)?.full_name || 'Usuário',
        sender_type: msg.sender_type as 'trainer' | 'student',
        timestamp: msg.created_at,
        message_type: msg.message_type as 'text' | 'image' | 'voice' | 'video',
        is_read: msg.is_read || false
      })) || [];

      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error("Não foi possível carregar as mensagens"); // Using sonner toast
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !conversationId || !currentUserProfile) return;

    const messageToSend: Omit<Message, 'id' | 'timestamp' | 'is_read'> = {
      content: newMessage,
      sender_id: user.id,
      sender_name: currentUserProfile.full_name || user.email?.split("@")[0] || "Você", // Use full_name from profile
      sender_type: "trainer", // Assuming trainer view; adjust based on user role
      message_type: "text" as 'text',
    };

    try {
      const { data: newMsg, error } = await supabase
        .from('messages')
        .insert({ ...messageToSend, conversation_id: conversationId })
        .select()
        .single();

      if (error) throw error;

      if (newMsg) {
          const fullMessage: Message = {
              ...messageToSend,
              id: newMsg.id,
              is_read: false,
              timestamp: newMsg.created_at
          };
          setMessages(prev => [...prev, fullMessage]);
          setNewMessage("");

          // Mark as read for current user (optional: mark only after sending)
          await supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMsg.id);

          toast.success("Sua mensagem foi enviada com sucesso"); // Using sonner toast
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Não foi possível enviar a mensagem"); // Using sonner toast
    }
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
                <div className="h-3 w-3 bg-green-500 rounded-full" />
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
                  className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`} {/* Use user.id for sender check */}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-2 break-words ${
                      message.sender_id === user?.id
                        ? 'gradient-primary text-white'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender_id === user?.id ? 'text-white/70' : 'text-muted-foreground'
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
                <div className="h-4 w-4 bg-green-500 rounded-full" />
                <span className="text-sm text-muted-foreground">
                  Online agora
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
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`} {/* Use user.id for sender check */}
            >
              <div className="flex items-end gap-2 max-w-[70%]">
                {message.sender_id !== user?.id && ( {/* Only show avatar for recipient */}
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-muted">
                      {message.sender_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg p-3 max-w-[80%] break-words ${
                    message.sender_id === user?.id
                      ? 'gradient-primary text-white'
                      : 'bg-muted'
                  }`}
                >
                  <p>{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender_id === user?.id ? 'text-white/70' : 'text-muted-foreground'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
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