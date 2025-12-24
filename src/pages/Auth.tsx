import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";
import { useAuditLog } from "@/hooks/useAuditLog";
import logoRegenapp from "@/assets/logo-regenapp.png";

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
        backgroundColor: "#1C2939",
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
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(27, 38, 54, 0.5) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Container do card */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        {/* Card glassmorphism */}
        <div
          style={{
            width: "min(520px, 90vw)",
            backgroundColor: "rgba(27, 38, 54, 0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "24px",
            padding: "40px 50px 40px 50px",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4)",
            border: "1px solid #253441",
          }}
        >
          {/* Logo dentro do card */}
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "30px",
            }}
          >
            <img
              src={logoRegenapp}
              alt="REGENAPP"
              style={{
                width: "280px",
                height: "auto",
                objectFit: "contain",
              }}
            />
          </div>

          {/* Título */}
          <h1
            style={{
              color: "#FEFEFE",
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
              backgroundColor: "#293E48",
              borderRadius: "20px",
              border: "1px solid #253441",
            }}
          >
            <Shield style={{ width: "14px", height: "14px", color: "#79B997" }} />
            <span
              style={{
                color: "#B7BBC0",
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
                    color: "#FEFEFE",
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
                    borderBottom: "1px solid #253441",
                    padding: "12px 0",
                    color: "#FEFEFE",
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
                  color: "#FEFEFE",
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
                  borderBottom: "1px solid #253441",
                  padding: "12px 0",
                  color: "#FEFEFE",
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
                  color: "#FEFEFE",
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
                  borderBottom: "1px solid #253441",
                  padding: "12px 0",
                  color: "#FEFEFE",
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
                backgroundColor: "#79B997",
                border: "none",
                borderRadius: "26px",
                color: "#FEFEFE",
                fontSize: "16px",
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "all 0.2s ease",
                fontFamily: "Inter, sans-serif",
                boxShadow: "0 4px 20px rgba(121, 185, 151, 0.3)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.filter = "brightness(1.1)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "brightness(1)";
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
                color: "#B7BBC0",
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
                backgroundColor: isSignUp ? "#253441" : "#B7BBC0",
              }}
            />
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: isSignUp ? "#B7BBC0" : "#253441",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
