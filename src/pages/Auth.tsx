import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import macLogo from "@/assets/mac-logo-new.png";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    phone: "",
    cpf: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      toast({
        title: "Login realizado com sucesso",
        description: "Redirecionando...",
      });

      navigate("/pacientes");
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (signupData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            full_name: signupData.fullName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from("user_profiles")
          .update({
            phone: signupData.phone,
            cpf: signupData.cpf,
            address: signupData.address,
          })
          .eq("user_id", authData.user.id);

        if (profileError) throw profileError;

        toast({
          title: "Cadastro realizado com sucesso",
          description: "Redirecionando...",
        });

        navigate("/pacientes");
      }
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{ 
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#3F5085",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0"
      }}
    >
      {/* Card Central */}
      <div 
        style={{ 
          width: "70vw",
          height: "78vh",
          backgroundColor: "#E5E5E6",
          borderRadius: "32px",
          display: "flex",
          overflow: "hidden"
        }}
      >
        {/* Coluna Esquerda - Formulários */}
        <div 
          style={{ 
            width: "50%",
            backgroundColor: "#E5E5E6",
            padding: "40px 60px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            overflow: "hidden"
          }}
        >
          {/* Logo MAC */}
          <img 
            src={macLogo} 
            alt="MAC Logo" 
            style={{ 
              width: "260px",
              height: "auto",
              marginBottom: "24px"
            }}
          />

          {/* Seção Login */}
          <div style={{ width: "320px", marginBottom: "20px" }}>
            <h2 
              style={{ 
                color: "#283A63", 
                fontSize: "22px", 
                fontWeight: "600",
                marginTop: "8px",
                marginBottom: "12px",
                fontFamily: "Inter, sans-serif",
                textAlign: "left"
              }}
            >
              Log in
            </h2>
            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Username"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                style={{ 
                  width: "320px",
                  height: "36px",
                  backgroundColor: "#EEF1F8", 
                  color: "#2E3350",
                  borderRadius: "14px",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "0 20px",
                  marginBottom: "10px",
                  display: "block"
                }}
              />

              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                style={{ 
                  width: "320px",
                  height: "36px",
                  backgroundColor: "#EEF1F8", 
                  color: "#2E3350",
                  borderRadius: "14px",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "0 20px",
                  marginBottom: "10px",
                  display: "block"
                }}
              />

              <button
                type="submit"
                disabled={loading}
                style={{ 
                  width: "320px",
                  height: "40px",
                  backgroundColor: "#283A63", 
                  color: "#FFFFFF",
                  borderRadius: "18px",
                  fontSize: "15px",
                  fontWeight: "600",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  marginTop: "6px",
                  display: "block",
                  transition: "opacity 0.2s ease",
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.opacity = "1")}
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>

          {/* Seção Cadastrar */}
          <div style={{ width: "320px" }}>
            <h2 
              style={{ 
                color: "#283A63", 
                fontSize: "22px", 
                fontWeight: "600",
                marginBottom: "8px",
                fontFamily: "Inter, sans-serif",
                textAlign: "left"
              }}
            >
              Cadastrar
            </h2>
            <form onSubmit={handleSignup}>
              <input
                type="text"
                placeholder="Nome Completo"
                value={signupData.fullName}
                onChange={(e) =>
                  setSignupData({ ...signupData, fullName: e.target.value })
                }
                required
                style={{ 
                  width: "320px",
                  height: "36px",
                  backgroundColor: "#EEF1F8", 
                  color: "#2E3350",
                  borderRadius: "14px",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "0 20px",
                  marginBottom: "10px",
                  display: "block"
                }}
              />

              <input
                type="email"
                placeholder="email"
                value={signupData.email}
                onChange={(e) =>
                  setSignupData({ ...signupData, email: e.target.value })
                }
                required
                style={{ 
                  width: "320px",
                  height: "36px",
                  backgroundColor: "#EEF1F8", 
                  color: "#2E3350",
                  borderRadius: "14px",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "0 20px",
                  marginBottom: "10px",
                  display: "block"
                }}
              />

              <input
                type="tel"
                placeholder="Telefone"
                value={signupData.phone}
                onChange={(e) =>
                  setSignupData({ ...signupData, phone: e.target.value })
                }
                style={{ 
                  width: "320px",
                  height: "36px",
                  backgroundColor: "#EEF1F8", 
                  color: "#2E3350",
                  borderRadius: "14px",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "0 20px",
                  marginBottom: "10px",
                  display: "block"
                }}
              />

              <input
                type="text"
                placeholder="CPF"
                value={signupData.cpf}
                onChange={(e) =>
                  setSignupData({ ...signupData, cpf: e.target.value })
                }
                style={{ 
                  width: "320px",
                  height: "36px",
                  backgroundColor: "#EEF1F8", 
                  color: "#2E3350",
                  borderRadius: "14px",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "0 20px",
                  marginBottom: "10px",
                  display: "block"
                }}
              />

              <input
                type="text"
                placeholder="Endereço Completo"
                value={signupData.address}
                onChange={(e) =>
                  setSignupData({ ...signupData, address: e.target.value })
                }
                style={{ 
                  width: "320px",
                  height: "36px",
                  backgroundColor: "#EEF1F8", 
                  color: "#2E3350",
                  borderRadius: "14px",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "0 20px",
                  marginBottom: "10px",
                  display: "block"
                }}
              />

              <input
                type="password"
                placeholder="Senha"
                value={signupData.password}
                onChange={(e) =>
                  setSignupData({ ...signupData, password: e.target.value })
                }
                required
                style={{ 
                  width: "320px",
                  height: "36px",
                  backgroundColor: "#EEF1F8", 
                  color: "#2E3350",
                  borderRadius: "14px",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "0 20px",
                  marginBottom: "10px",
                  display: "block"
                }}
              />

              <input
                type="password"
                placeholder="Confirmar Senha"
                value={signupData.confirmPassword}
                onChange={(e) =>
                  setSignupData({ ...signupData, confirmPassword: e.target.value })
                }
                required
                style={{ 
                  width: "320px",
                  height: "36px",
                  backgroundColor: "#EEF1F8", 
                  color: "#2E3350",
                  borderRadius: "14px",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "0 20px",
                  marginBottom: "10px",
                  display: "block"
                }}
              />

              <button
                type="submit"
                disabled={loading}
                style={{ 
                  width: "320px",
                  height: "40px",
                  backgroundColor: "#283A63", 
                  color: "#FFFFFF",
                  borderRadius: "18px",
                  fontSize: "15px",
                  fontWeight: "600",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  marginTop: "14px",
                  display: "block",
                  transition: "opacity 0.2s ease",
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.opacity = "1")}
              >
                {loading ? "Criando conta..." : "Criar Conta"}
              </button>
            </form>
          </div>
        </div>

        {/* Coluna Direita - Imagem */}
        <div 
          style={{ 
            width: "50%",
            backgroundImage: "url(/images/auth-background.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            borderRadius: "0 32px 32px 0"
          }}
        />
      </div>
    </div>
  );
}
