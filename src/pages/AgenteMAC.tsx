import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Send, Bot, User, Plus, MessageSquare, Trash2, ArrowLeft } from "lucide-react";
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("paciente");
  
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

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mac-agent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
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
    <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-96px)] flex flex-col md:flex-row gap-3 md:gap-4">
      {/* Sidebar com conversas - escondido em mobile, pode ser exibido com botão */}
      <div className="hidden md:flex w-[280px] bg-card/85 rounded-2xl p-4 flex-col gap-3 overflow-y-auto flex-shrink-0">
        <Button
          onClick={createNewConversation}
          className="bg-[#2F3F6B] hover:bg-[#2F3F6B]/90 rounded-xl py-3 flex items-center gap-2 justify-center w-full"
        >
          <Plus size={18} />
          Nova Conversa
        </Button>

        <div className="text-xs font-semibold text-muted-foreground uppercase mt-2">
          Histórico
        </div>

        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => loadConversationMessages(conv.id)}
            className={`p-3 rounded-lg cursor-pointer transition-all flex items-center gap-2 justify-between ${
              currentConversationId === conv.id 
                ? "bg-[#3D4F7C] text-white" 
                : "bg-[#F5F6FA] text-foreground hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <MessageSquare size={16} className="flex-shrink-0" />
              <span className="text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                {conv.title}
              </span>
            </div>
            <button
              onClick={(e) => deleteConversation(conv.id, e)}
              className="bg-transparent border-none cursor-pointer p-1 flex items-center opacity-60 hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Mobile header for new conversation */}
      <div className="flex md:hidden gap-2">
        <Button
          onClick={createNewConversation}
          className="bg-[#2F3F6B] hover:bg-[#2F3F6B]/90 rounded-xl flex-1"
        >
          <Plus size={18} className="mr-2" />
          Nova Conversa
        </Button>
      </div>

      {/* Área principal do chat */}
      <div className="flex-1 flex flex-col bg-card/85 rounded-2xl overflow-hidden min-h-0">
        {/* Header */}
        <div className="p-4 md:p-6 border-b-2 border-border bg-[#F5F6FA]">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(patientId ? `/pacientes/${patientId}` : "/pacientes")}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg md:text-2xl font-semibold text-foreground font-inter">
                Agente Fisioterapia Regenerativa
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Assistente especializado em terapias regenerativas e fotobiomodulação
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 min-h-0">
          {messages.length === 0 && (
            <div className="text-center py-8 md:py-12">
              <Bot size={40} className="mx-auto mb-4 text-[#3A3A45] md:w-12 md:h-12" />
              <p className="text-sm md:text-base font-medium text-[#3A3A45]">
                Olá! Sou o Agente Fisioterapia Regenerativa.
              </p>
              <p className="text-xs md:text-sm mt-2 text-[#5A6080]">
                Como posso ajudá-lo com informações sobre terapias regenerativas e protocolos de fotobiomodulação?
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-2 md:gap-3 items-start ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === "user" ? "bg-[#2F3F6B]" : "bg-[#3D4F7C]"
              }`}>
                {message.role === "user" ? (
                  <User size={18} color="white" />
                ) : (
                  <Bot size={18} color="white" />
                )}
              </div>

              <div className={`p-3 md:p-4 rounded-xl max-w-[85%] md:max-w-[70%] break-words whitespace-pre-wrap text-sm md:text-base ${
                message.role === "user" 
                  ? "bg-[#3D4F7C] text-white" 
                  : "bg-[#F5F6FA] text-foreground"
              }`}>
                {message.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#3D4F7C] flex items-center justify-center">
                <Bot size={18} color="white" />
              </div>
              <div className="bg-[#F5F6FA] p-3 md:p-4 rounded-xl">
                <div className="flex gap-1">
                  <div className="animate-pulse w-2 h-2 rounded-full bg-muted-foreground" />
                  <div className="animate-pulse w-2 h-2 rounded-full bg-muted-foreground" style={{ animationDelay: "0.2s" }} />
                  <div className="animate-pulse w-2 h-2 rounded-full bg-muted-foreground" style={{ animationDelay: "0.4s" }} />
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
