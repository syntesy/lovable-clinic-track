import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Shield } from "lucide-react";
import { useAuditLog } from "@/hooks/useAuditLog";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logLogin } = useAuditLog();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      toast({
        title: "Falha no login",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Registrar log de login
      await logLogin();
      navigate("/pacientes");
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!fullName.trim()) {
      setError("Nome completo é obrigatório");
      setLoading(false);
      return;
    }

    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
      toast({
        title: "Falha no cadastro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu email para confirmar o cadastro.",
      });
      setIsSignUp(false);
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000",
        backgroundImage: "url('/images/dna-login-bg-clean.png?v=2')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        overflow: "hidden",
        zIndex: 9999,
      }}
    >
      {/* Overlay sutil para profundidade */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.3) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Container do card com avatar flutuante */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        {/* Avatar flutuante */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "-40px",
            zIndex: 20,
          }}
        >
          <User
            style={{
              width: "70px",
              height: "70px",
              color: "#63BC94",
            }}
            strokeWidth={1.5}
          />
        </div>

        {/* Card glassmorphism */}
        <div
          style={{
            width: "min(520px, 90vw)",
            backgroundColor: "rgba(20, 25, 40, 0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "24px",
            padding: "60px 50px 40px 50px",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          {/* Título */}
          <h1
            style={{
              color: "#FFFFFF",
              fontSize: "24px",
              fontWeight: 600,
              letterSpacing: "3px",
              textAlign: "center",
              marginBottom: "30px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {isSignUp ? "CADASTRO" : "LOG-IN"}
          </h1>

          {/* Badge de segurança */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "30px",
              padding: "8px 16px",
              backgroundColor: "rgba(99, 188, 148, 0.1)",
              borderRadius: "20px",
              border: "1px solid rgba(99, 188, 148, 0.2)",
            }}
          >
            <Shield style={{ width: "14px", height: "14px", color: "#63BC94" }} />
            <span
              style={{
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: "11px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Conformidade LGPD • Auditoria CFM
            </span>
          </div>

          <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
            {/* Campo Nome (apenas no cadastro) */}
            {isSignUp && (
              <div style={{ marginBottom: "25px" }}>
                <label
                  style={{
                    display: "block",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: 500,
                    marginBottom: "8px",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Nome Completo
                </label>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    border: "none",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
                    padding: "12px 0",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    outline: "none",
                    fontFamily: "Inter, sans-serif",
                  }}
                />
              </div>
            )}

            {/* Campo Email */}
            <div style={{ marginBottom: "25px" }}>
              <label
                style={{
                  display: "block",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 500,
                  marginBottom: "8px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Email
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
                  padding: "12px 0",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  outline: "none",
                  fontFamily: "Inter, sans-serif",
                }}
              />
            </div>

            {/* Campo Password */}
            <div style={{ marginBottom: "30px" }}>
              <label
                style={{
                  display: "block",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 500,
                  marginBottom: "8px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Senha
              </label>
              <input
                type="password"
                placeholder={isSignUp ? "Mínimo 6 caracteres" : "Sua senha"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: "100%",
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
                  padding: "12px 0",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  outline: "none",
                  fontFamily: "Inter, sans-serif",
                }}
              />
            </div>

            {/* Mensagem de erro */}
            {error && (
              <p
                style={{
                  color: "#FF6B6B",
                  fontSize: "12px",
                  textAlign: "center",
                  marginBottom: "15px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {error}
              </p>
            )}

            {/* Botão principal */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                height: "52px",
                backgroundColor: "#63BC94",
                border: "none",
                borderRadius: "26px",
                color: "#FFFFFF",
                fontSize: "16px",
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "all 0.2s ease",
                fontFamily: "Inter, sans-serif",
                boxShadow: "0 4px 20px rgba(99, 188, 148, 0.3)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = "#72C9A0";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#63BC94";
              }}
            >
              {loading ? "Aguarde..." : isSignUp ? "Cadastrar" : "Entrar"}
            </button>
          </form>

          {/* Link para alternar entre login e cadastro */}
          <div
            style={{
              marginTop: "25px",
              textAlign: "center",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: "13px",
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                textDecoration: "underline",
              }}
            >
              {isSignUp ? "Já tem conta? Faça login" : "Não tem conta? Cadastre-se"}
            </button>
          </div>

          {/* Indicador de página (3 dots) */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "8px",
              marginTop: "25px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: isSignUp ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.6)",
              }}
            />
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: isSignUp ? "rgba(255, 255, 255, 0.6)" : "rgba(255, 255, 255, 0.3)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
