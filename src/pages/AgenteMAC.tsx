import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Send, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AgenteMAC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-gpt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao comunicar com o ChatGPT");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].content = assistantMessage;
                  return newMessages;
                });
              }
            } catch (e) {
              // Ignore parsing errors for incomplete JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
      setMessages((prev) => prev.slice(0, -1));
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

        {isLoading && messages[messages.length - 1]?.role === "user" && (
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
  );
};

export default AgenteMAC;
