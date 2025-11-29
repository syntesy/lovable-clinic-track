import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import macLogo from "@/assets/logo-mac.png";

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
        backgroundColor: "#364A75",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {/* Card Central */}
      <div 
        style={{ 
          width: "1100px",
          height: "650px",
          backgroundColor: "#E5E5E6",
          borderRadius: "36px",
          display: "flex",
          overflow: "hidden"
        }}
      >
        {/* Coluna Esquerda - Formulários */}
        <div 
          style={{ 
            width: "550px",
            height: "100%",
            backgroundColor: "#E5E5E6",
            padding: "48px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            overflowY: "auto"
          }}
        >
          {/* Logo MAC */}
          <img 
            src={macLogo} 
            alt="MAC Logo" 
            style={{ 
              width: "160px",
              marginBottom: "40px"
            }}
          />

          {/* Seção Login */}
          <div style={{ width: "380px", marginBottom: "30px" }}>
            <h2 
              style={{ 
                color: "#2E3350", 
                fontSize: "26px", 
                fontWeight: "600",
                marginBottom: "20px",
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
                  width: "100%",
                  height: "40px",
                  backgroundColor: "#DCE1EC", 
                  color: "#2E3350",
                  borderRadius: "20px",
                  fontSize: "15px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "0 20px",
                  marginBottom: "12px",
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
                  width: "100%",
                  height: "40px",
                  backgroundColor: "#DCE1EC", 
                  color: "#2E3350",
                  borderRadius: "20px",
                  fontSize: "15px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "0 20px",
                  marginBottom: "12px",
                  display: "block"
                }}
              />

              <button
                type="submit"
                disabled={loading}
                style={{ 
                  width: "100%",
                  height: "42px",
                  backgroundColor: "#283A63", 
                  color: "#FFFFFF",
                  borderRadius: "20px",
                  fontSize: "16px",
                  fontWeight: "600",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  marginTop: "8px",
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
          <div style={{ width: "380px" }}>
            <h2 
              style={{ 
                color: "#2E3350", 
                fontSize: "26px", 
                fontWeight: "600",
                marginBottom: "20px",
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
                  width: "100%",
                  height: "40px",
                  backgroundColor: "#DCE1EC", 
                  color: "#2E3350",
                  borderRadius: "20px",
                  fontSize: "15px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "0 20px",
                  marginBottom: "12px",
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
                  width: "100%",
                  height: "40px",
                  backgroundColor: "#DCE1EC", 
                  color: "#2E3350",
                  borderRadius: "20px",
                  fontSize: "15px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "0 20px",
                  marginBottom: "12px",
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
                  width: "100%",
                  height: "40px",
                  backgroundColor: "#DCE1EC", 
                  color: "#2E3350",
                  borderRadius: "20px",
                  fontSize: "15px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "0 20px",
                  marginBottom: "12px",
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
                  width: "100%",
                  height: "40px",
                  backgroundColor: "#DCE1EC", 
                  color: "#2E3350",
                  borderRadius: "20px",
                  fontSize: "15px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "0 20px",
                  marginBottom: "12px",
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
                  width: "100%",
                  height: "40px",
                  backgroundColor: "#DCE1EC", 
                  color: "#2E3350",
                  borderRadius: "20px",
                  fontSize: "15px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "0 20px",
                  marginBottom: "12px",
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
                  width: "100%",
                  height: "40px",
                  backgroundColor: "#DCE1EC", 
                  color: "#2E3350",
                  borderRadius: "20px",
                  fontSize: "15px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "0 20px",
                  marginBottom: "12px",
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
                  width: "100%",
                  height: "40px",
                  backgroundColor: "#DCE1EC", 
                  color: "#2E3350",
                  borderRadius: "20px",
                  fontSize: "15px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "0 20px",
                  marginBottom: "12px",
                  display: "block"
                }}
              />

              <button
                type="submit"
                disabled={loading}
                style={{ 
                  width: "100%",
                  height: "42px",
                  backgroundColor: "#283A63", 
                  color: "#FFFFFF",
                  borderRadius: "20px",
                  fontSize: "16px",
                  fontWeight: "600",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  marginTop: "8px",
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
            width: "550px",
            height: "100%",
            backgroundImage: "url(/images/auth-background.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            borderRadius: "0 36px 36px 0"
          }}
        />
      </div>
    </div>
  );
}
