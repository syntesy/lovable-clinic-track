import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Send, Bot, User, Plus, MessageSquare, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

const AgenteMAC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Buscar userId e conversas ao carregar
  useEffect(() => {
    const initializeChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadConversations(user.id);
      }
    };
    initializeChat();
  }, []);

  const loadConversations = async (uid: string) => {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('id, title, updated_at')
      .eq('user_id', uid)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar conversas:', error);
      return;
    }

    setConversations(data || []);
  };

  const loadConversationMessages = async (conversationId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico da conversa.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    setMessages(data as Message[]);
    setCurrentConversationId(conversationId);
    setIsLoading(false);
  };

  const createNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setInput("");
  };

  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      console.error('Erro ao deletar conversa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar a conversa.",
        variant: "destructive",
      });
      return;
    }

    if (currentConversationId === conversationId) {
      createNewConversation();
    }

    if (userId) {
      loadConversations(userId);
    }

    toast({
      title: "Sucesso",
      description: "Conversa deletada com sucesso.",
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !userId) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    const messageText = input;
    setInput("");
    setIsLoading(true);

    try {
      // Buscar threadId do banco se tiver conversationId
      let threadId: string | null = null;
      if (currentConversationId) {
        const { data: convData } = await supabase
          .from('chat_conversations')
          .select('thread_id')
          .eq('id', currentConversationId)
          .single();
        threadId = convData?.thread_id || null;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mac-agent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            message: messageText,
            threadId: threadId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao comunicar com o Agente MAC");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply ?? "Não foi possível obter resposta do Agente MAC.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Se é nova conversa, criar no banco
      let convId = currentConversationId;
      if (!currentConversationId && data.threadId) {
        const title = messageText.slice(0, 50) + (messageText.length > 50 ? "..." : "");
        const { data: newConv, error: convError } = await supabase
          .from('chat_conversations')
          .insert({
            user_id: userId,
            thread_id: data.threadId,
            title: title,
          })
          .select('id')
          .single();

        if (convError) {
          console.error('Erro ao criar conversa:', convError);
        } else {
          convId = newConv.id;
          setCurrentConversationId(convId);
        }
      }

      // Salvar mensagens no banco
      if (convId) {
        await supabase.from('chat_messages').insert([
          { conversation_id: convId, role: 'user', content: messageText },
          { conversation_id: convId, role: 'assistant', content: assistantMessage.content }
        ]);

        // Atualizar updated_at da conversa
        await supabase
          .from('chat_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', convId);

        // Recarregar lista de conversas
        loadConversations(userId);
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ 
      height: "calc(100vh - 80px)", 
      display: "flex",
      gap: "16px"
    }}>
      {/* Sidebar com conversas */}
      <div style={{
        width: "280px",
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        borderRadius: "16px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        overflowY: "auto"
      }}>
        <Button
          onClick={createNewConversation}
          style={{
            backgroundColor: "#2F3F6B",
            color: "white",
            borderRadius: "12px",
            padding: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            justifyContent: "center",
            width: "100%"
          }}
        >
          <Plus size={18} />
          Nova Conversa
        </Button>

        <div style={{
          fontSize: "12px",
          fontWeight: "600",
          color: "#A9AEC6",
          textTransform: "uppercase",
          marginTop: "8px"
        }}>
          Histórico
        </div>

        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => loadConversationMessages(conv.id)}
            style={{
              padding: "12px",
              backgroundColor: currentConversationId === conv.id ? "#3D4F7C" : "#F5F6FA",
              color: currentConversationId === conv.id ? "white" : "#3A3A45",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: "space-between"
            }}
            onMouseEnter={(e) => {
              if (currentConversationId !== conv.id) {
                e.currentTarget.style.backgroundColor = "#E5E5E6";
              }
            }}
            onMouseLeave={(e) => {
              if (currentConversationId !== conv.id) {
                e.currentTarget.style.backgroundColor = "#F5F6FA";
              }
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
              <MessageSquare size={16} style={{ flexShrink: 0 }} />
              <span style={{
                fontSize: "14px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}>
                {conv.title}
              </span>
            </div>
            <button
              onClick={(e) => deleteConversation(conv.id, e)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                opacity: 0.6
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "0.6";
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Área principal do chat */}
      <div style={{ 
        flex: 1,
        display: "flex", 
        flexDirection: "column",
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        borderRadius: "16px",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          padding: "24px",
          borderBottom: "2px solid #C5CADF",
          backgroundColor: "#F5F6FA"
        }}>
          <h1 style={{
            fontSize: "24px",
            fontWeight: "600",
            color: "#3A3A45",
            fontFamily: "Inter, sans-serif"
          }}>
            Agente MAC
          </h1>
          <p style={{
            fontSize: "14px",
            color: "#A9AEC6",
            marginTop: "4px"
          }}>
            Assistente especializado em fotobiomodulação
          </p>
        </div>

        {/* Messages Area */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          {messages.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: "48px 24px",
              color: "#A9AEC6"
            }}>
              <Bot size={48} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
              <p style={{ fontSize: "16px", fontWeight: "500" }}>
                Olá! Sou o Agente MAC.
              </p>
              <p style={{ fontSize: "14px", marginTop: "8px" }}>
                Como posso ajudá-lo com informações sobre protocolos de fotobiomodulação?
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
                flexDirection: message.role === "user" ? "row-reverse" : "row"
              }}
            >
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: message.role === "user" ? "#2F3F6B" : "#3D4F7C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                {message.role === "user" ? (
                  <User size={20} color="white" />
                ) : (
                  <Bot size={20} color="white" />
                )}
              </div>

              <div style={{
                backgroundColor: message.role === "user" ? "#3D4F7C" : "#F5F6FA",
                color: message.role === "user" ? "white" : "#3A3A45",
                padding: "12px 16px",
                borderRadius: "12px",
                maxWidth: "70%",
                wordWrap: "break-word",
                whiteSpace: "pre-wrap"
              }}>
                {message.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={{
              display: "flex",
              gap: "12px",
              alignItems: "flex-start"
            }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "#3D4F7C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Bot size={20} color="white" />
              </div>
              <div style={{
                backgroundColor: "#F5F6FA",
                padding: "12px 16px",
                borderRadius: "12px"
              }}>
                <div style={{ display: "flex", gap: "4px" }}>
                  <div className="animate-pulse" style={{ 
                    width: "8px", 
                    height: "8px", 
                    borderRadius: "50%", 
                    backgroundColor: "#A9AEC6" 
                  }} />
                  <div className="animate-pulse" style={{ 
                    width: "8px", 
                    height: "8px", 
                    borderRadius: "50%", 
                    backgroundColor: "#A9AEC6",
                    animationDelay: "0.2s"
                  }} />
                  <div className="animate-pulse" style={{ 
                    width: "8px", 
                    height: "8px", 
                    borderRadius: "50%", 
                    backgroundColor: "#A9AEC6",
                    animationDelay: "0.4s"
                  }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{
          padding: "24px",
          borderTop: "2px solid #C5CADF",
          backgroundColor: "#F5F6FA"
        }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
              disabled={isLoading}
              style={{
                minHeight: "60px",
                maxHeight: "120px",
                resize: "none",
                backgroundColor: "white",
                border: "2px solid #C5CADF",
                borderRadius: "12px",
                fontSize: "14px",
                fontFamily: "Inter, sans-serif"
              }}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              style={{
                backgroundColor: "#2F3F6B",
                color: "white",
                borderRadius: "12px",
                padding: "0 24px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <Send size={18} />
              Enviar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgenteMAC;
