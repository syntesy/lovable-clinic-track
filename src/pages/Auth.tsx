import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import macLogo from "@/assets/logo-mac.png";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        // Update profile with additional data
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
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Left Column - Logo */}
      <div 
        className="flex items-center justify-center w-full md:w-[55%] h-[40vh] md:h-screen"
        style={{ 
          backgroundColor: "#DBDDE9" 
        }}
      >
        <img 
          src={macLogo} 
          alt="MAC Logo" 
          style={{ 
            width: "380px",
            height: "auto"
          }}
        />
      </div>

      {/* Right Column - Login and Signup Forms */}
      <div
        className="flex items-start justify-center w-full md:w-[45%] min-h-[60vh] md:h-screen overflow-y-auto"
        style={{ 
          backgroundColor: "#364A75",
          padding: "24px",
          paddingTop: "60px"
        }}
      >
        <div style={{ width: "280px" }}>
          {/* Login Form */}
          <div style={{ marginBottom: "40px" }}>
            <h2 
              style={{ 
                color: "#FFFFFF", 
                fontSize: "26px", 
                fontWeight: "600",
                marginBottom: "16px",
                fontFamily: "Inter, sans-serif",
                textAlign: "left"
              }}
            >
              Log in
            </h2>
            <form onSubmit={handleLogin}>
              <input
                id="login-email"
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                style={{ 
                  width: "280px",
                  height: "38px",
                  backgroundColor: "#F5F7FA", 
                  color: "#3A3A45",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "10px",
                  marginBottom: "10px",
                  display: "block"
                }}
              />

              <input
                id="login-password"
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                style={{ 
                  width: "280px",
                  height: "38px",
                  backgroundColor: "#F5F7FA", 
                  color: "#3A3A45",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "10px",
                  marginBottom: "10px",
                  display: "block"
                }}
              />

              <button
                type="submit"
                disabled={loading}
                style={{ 
                  width: "280px",
                  height: "42px",
                  backgroundColor: "#283A63", 
                  color: "#FFFFFF",
                  borderRadius: "12px",
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
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>

          {/* Signup Form */}
          <div>
            <h2 
              style={{ 
                color: "#FFFFFF", 
                fontSize: "26px", 
                fontWeight: "600",
                marginBottom: "16px",
                fontFamily: "Inter, sans-serif",
                textAlign: "left"
              }}
            >
              Cadastrar
            </h2>
            <form onSubmit={handleSignup}>
              <input
                id="signup-name"
                type="text"
                placeholder="Nome Completo"
                value={signupData.fullName}
                onChange={(e) =>
                  setSignupData({ ...signupData, fullName: e.target.value })
                }
                required
                style={{ 
                  width: "280px",
                  height: "38px",
                  backgroundColor: "#F5F7FA", 
                  color: "#3A3A45",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "10px",
                  marginBottom: "10px",
                  display: "block"
                }}
              />

              <input
                id="signup-email"
                type="email"
                placeholder="Email"
                value={signupData.email}
                onChange={(e) =>
                  setSignupData({ ...signupData, email: e.target.value })
                }
                required
                style={{ 
                  width: "280px",
                  height: "38px",
                  backgroundColor: "#F5F7FA", 
                  color: "#3A3A45",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "10px",
                  marginBottom: "10px",
                  display: "block"
                }}
              />

              <input
                id="signup-phone"
                type="tel"
                placeholder="Telefone"
                value={signupData.phone}
                onChange={(e) =>
                  setSignupData({ ...signupData, phone: e.target.value })
                }
                style={{ 
                  width: "280px",
                  height: "38px",
                  backgroundColor: "#F5F7FA", 
                  color: "#3A3A45",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "10px",
                  marginBottom: "10px",
                  display: "block"
                }}
              />

              <input
                id="signup-cpf"
                type="text"
                placeholder="CPF"
                value={signupData.cpf}
                onChange={(e) =>
                  setSignupData({ ...signupData, cpf: e.target.value })
                }
                style={{ 
                  width: "280px",
                  height: "38px",
                  backgroundColor: "#F5F7FA", 
                  color: "#3A3A45",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "10px",
                  marginBottom: "10px",
                  display: "block"
                }}
              />

              <input
                id="signup-address"
                type="text"
                placeholder="Endereço Completo"
                value={signupData.address}
                onChange={(e) =>
                  setSignupData({ ...signupData, address: e.target.value })
                }
                style={{ 
                  width: "280px",
                  height: "38px",
                  backgroundColor: "#F5F7FA", 
                  color: "#3A3A45",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "10px",
                  marginBottom: "10px",
                  display: "block"
                }}
              />

              <input
                id="signup-password"
                type="password"
                placeholder="Senha"
                value={signupData.password}
                onChange={(e) =>
                  setSignupData({ ...signupData, password: e.target.value })
                }
                required
                style={{ 
                  width: "280px",
                  height: "38px",
                  backgroundColor: "#F5F7FA", 
                  color: "#3A3A45",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "10px",
                  marginBottom: "10px",
                  display: "block"
                }}
              />

              <input
                id="signup-confirm-password"
                type="password"
                placeholder="Confirmar Senha"
                value={signupData.confirmPassword}
                onChange={(e) =>
                  setSignupData({ ...signupData, confirmPassword: e.target.value })
                }
                required
                style={{ 
                  width: "280px",
                  height: "38px",
                  backgroundColor: "#F5F7FA", 
                  color: "#3A3A45",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                  outline: "none",
                  padding: "10px",
                  marginBottom: "10px",
                  display: "block"
                }}
              />

              <button
                type="submit"
                disabled={loading}
                style={{ 
                  width: "280px",
                  height: "42px",
                  backgroundColor: "#283A63", 
                  color: "#FFFFFF",
                  borderRadius: "12px",
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
      </div>
    </div>
  );
}
