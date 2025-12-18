import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Lock, Plus } from "lucide-react";
import badgeImage from "@/assets/fisioterapia-regenerativa-badge.png";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);

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
        background: "linear-gradient(135deg, #1E2A5E 0%, #283A63 50%, #364A75 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Container Principal - Layout Horizontal */}
      <div 
        style={{ 
          width: "100%",
          maxWidth: "1100px",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "40px"
        }}
      >
        {/* Card de Login/Cadastro - Esquerda */}
        <div 
          style={{ 
            width: "340px",
            minWidth: "340px",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: "24px",
            padding: "32px 28px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}
        >
          {/* Logo Header */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "10px",
            marginBottom: "24px"
          }}>
            <div style={{
              width: "28px",
              height: "28px",
              backgroundColor: "#283A63",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Plus size={18} color="#FFFFFF" strokeWidth={3} />
            </div>
            <div>
              <span style={{ 
                color: "#283A63", 
                fontSize: "14px", 
                fontWeight: "700",
                fontFamily: "Inter, sans-serif",
                letterSpacing: "0.5px"
              }}>
                FISIOTERAPIA
              </span>
              <br />
              <span style={{ 
                color: "#5A6A8A", 
                fontSize: "10px", 
                fontWeight: "500",
                fontFamily: "Inter, sans-serif",
                letterSpacing: "1px"
              }}>
                REGENERATIVA
              </span>
            </div>
          </div>

          {isLoginView ? (
            <>
              {/* Avatar Icon */}
              <div style={{
                width: "80px",
                height: "80px",
                backgroundColor: "#3A4A6A",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "24px"
              }}>
                <User size={44} color="#8A9ABB" strokeWidth={1.5} />
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} style={{ width: "100%" }}>
                {/* Email Input */}
                <div style={{
                  position: "relative",
                  marginBottom: "12px"
                }}>
                  <div style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#7A8AAA"
                  }}>
                    <User size={16} />
                  </div>
                  <input
                    type="email"
                    placeholder="USUÁRIO"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    style={{ 
                      width: "100%",
                      height: "44px",
                      backgroundColor: "#E8EBF2", 
                      color: "#2E3350",
                      borderRadius: "22px",
                      fontSize: "12px",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: "500",
                      letterSpacing: "0.5px",
                      border: "none",
                      outline: "none",
                      padding: "0 16px 0 42px",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                {/* Password Input */}
                <div style={{
                  position: "relative",
                  marginBottom: "16px"
                }}>
                  <div style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#7A8AAA"
                  }}>
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    style={{ 
                      width: "100%",
                      height: "44px",
                      backgroundColor: "#E8EBF2", 
                      color: "#2E3350",
                      borderRadius: "22px",
                      fontSize: "12px",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: "500",
                      letterSpacing: "2px",
                      border: "none",
                      outline: "none",
                      padding: "0 16px 0 42px",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{ 
                    width: "100%",
                    height: "44px",
                    backgroundColor: "#283A63", 
                    color: "#FFFFFF",
                    borderRadius: "22px",
                    fontSize: "13px",
                    fontWeight: "700",
                    fontFamily: "Inter, sans-serif",
                    letterSpacing: "1px",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    opacity: loading ? 0.6 : 1,
                    marginBottom: "16px"
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = "#1E2A4E")}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = "#283A63")}
                >
                  {loading ? "ENTRANDO..." : "LOGIN"}
                </button>
              </form>

              {/* Footer Links */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                fontSize: "10px",
                color: "#5A6A8A",
                fontFamily: "Inter, sans-serif"
              }}>
                <label style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "5px",
                  cursor: "pointer"
                }}>
                  <input type="checkbox" style={{ accentColor: "#283A63", width: "12px", height: "12px" }} />
                  Lembrar-me
                </label>
                <span style={{ cursor: "pointer", textDecoration: "underline" }}>
                  Esqueceu sua senha?
                </span>
              </div>

              {/* Pagination Dots */}
              <div style={{
                display: "flex",
                gap: "6px",
                marginTop: "20px"
              }}>
                <div style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "#283A63"
                }} />
                <div style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "#C5CADF"
                }} />
                <div style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "#C5CADF"
                }} />
              </div>
            </>
          ) : (
            <>
              {/* Signup Form */}
              <h2 style={{
                color: "#283A63",
                fontSize: "20px",
                fontWeight: "700",
                fontFamily: "Inter, sans-serif",
                marginBottom: "20px"
              }}>
                Cadastrar
              </h2>
              <form onSubmit={handleSignup} style={{ width: "100%" }}>
                <input
                  type="text"
                  placeholder="Nome Completo"
                  value={signupData.fullName}
                  onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                  required
                  style={{ 
                    width: "100%",
                    height: "42px",
                    backgroundColor: "#E8EBF2", 
                    color: "#2E3350",
                    borderRadius: "21px",
                    fontSize: "12px",
                    fontFamily: "Inter, sans-serif",
                    border: "none",
                    outline: "none",
                    padding: "0 16px",
                    marginBottom: "8px",
                    boxSizing: "border-box"
                  }}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  required
                  style={{ 
                    width: "100%",
                    height: "42px",
                    backgroundColor: "#E8EBF2", 
                    color: "#2E3350",
                    borderRadius: "21px",
                    fontSize: "12px",
                    fontFamily: "Inter, sans-serif",
                    border: "none",
                    outline: "none",
                    padding: "0 16px",
                    marginBottom: "8px",
                    boxSizing: "border-box"
                  }}
                />
                <input
                  type="tel"
                  placeholder="Telefone"
                  value={signupData.phone}
                  onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                  style={{ 
                    width: "100%",
                    height: "42px",
                    backgroundColor: "#E8EBF2", 
                    color: "#2E3350",
                    borderRadius: "21px",
                    fontSize: "12px",
                    fontFamily: "Inter, sans-serif",
                    border: "none",
                    outline: "none",
                    padding: "0 16px",
                    marginBottom: "8px",
                    boxSizing: "border-box"
                  }}
                />
                <input
                  type="text"
                  placeholder="CPF"
                  value={signupData.cpf}
                  onChange={(e) => setSignupData({ ...signupData, cpf: e.target.value })}
                  style={{ 
                    width: "100%",
                    height: "42px",
                    backgroundColor: "#E8EBF2", 
                    color: "#2E3350",
                    borderRadius: "21px",
                    fontSize: "12px",
                    fontFamily: "Inter, sans-serif",
                    border: "none",
                    outline: "none",
                    padding: "0 16px",
                    marginBottom: "8px",
                    boxSizing: "border-box"
                  }}
                />
                <input
                  type="text"
                  placeholder="Endereço"
                  value={signupData.address}
                  onChange={(e) => setSignupData({ ...signupData, address: e.target.value })}
                  style={{ 
                    width: "100%",
                    height: "42px",
                    backgroundColor: "#E8EBF2", 
                    color: "#2E3350",
                    borderRadius: "21px",
                    fontSize: "12px",
                    fontFamily: "Inter, sans-serif",
                    border: "none",
                    outline: "none",
                    padding: "0 16px",
                    marginBottom: "8px",
                    boxSizing: "border-box"
                  }}
                />
                <input
                  type="password"
                  placeholder="Senha"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  required
                  style={{ 
                    width: "100%",
                    height: "42px",
                    backgroundColor: "#E8EBF2", 
                    color: "#2E3350",
                    borderRadius: "21px",
                    fontSize: "12px",
                    fontFamily: "Inter, sans-serif",
                    border: "none",
                    outline: "none",
                    padding: "0 16px",
                    marginBottom: "8px",
                    boxSizing: "border-box"
                  }}
                />
                <input
                  type="password"
                  placeholder="Confirmar Senha"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                  required
                  style={{ 
                    width: "100%",
                    height: "42px",
                    backgroundColor: "#E8EBF2", 
                    color: "#2E3350",
                    borderRadius: "21px",
                    fontSize: "12px",
                    fontFamily: "Inter, sans-serif",
                    border: "none",
                    outline: "none",
                    padding: "0 16px",
                    marginBottom: "14px",
                    boxSizing: "border-box"
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{ 
                    width: "100%",
                    height: "44px",
                    backgroundColor: "#283A63", 
                    color: "#FFFFFF",
                    borderRadius: "22px",
                    fontSize: "13px",
                    fontWeight: "700",
                    fontFamily: "Inter, sans-serif",
                    letterSpacing: "1px",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    opacity: loading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = "#1E2A4E")}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = "#283A63")}
                >
                  {loading ? "CRIANDO..." : "CRIAR CONTA"}
                </button>
              </form>

              {/* Back to Login Link */}
              <p style={{
                color: "#5A6A8A",
                fontSize: "11px",
                fontFamily: "Inter, sans-serif",
                marginTop: "16px",
                cursor: "pointer"
              }} onClick={() => setIsLoginView(true)}>
                Já tem conta? <span style={{ textDecoration: "underline", fontWeight: "600" }}>Fazer login</span>
              </p>
            </>
          )}
        </div>

        {/* Seção Direita - Bem-vindo + Badge */}
        <div 
          style={{ 
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            paddingLeft: "40px"
          }}
        >
          {/* Texto Bem-vindo */}
          <h1 style={{
            color: "#FFFFFF",
            fontSize: "52px",
            fontWeight: "700",
            fontFamily: "Inter, sans-serif",
            marginBottom: "16px",
            marginTop: "0"
          }}>
            Bem-vindo.
          </h1>
          <p style={{
            color: "rgba(255, 255, 255, 0.75)",
            fontSize: "15px",
            fontFamily: "Inter, sans-serif",
            lineHeight: "1.6",
            marginBottom: "20px",
            maxWidth: "380px"
          }}>
            Por favor, faça login para acessar o sistema<br />
            da Fisioterapia Regenerativa.
          </p>

          {/* Link Primeiro Acesso */}
          <p style={{
            color: "rgba(255, 255, 255, 0.65)",
            fontSize: "13px",
            fontFamily: "Inter, sans-serif",
            marginBottom: "40px"
          }}>
            Primeiro acesso?{" "}
            <span 
              onClick={() => setIsLoginView(false)}
              style={{ 
                color: "#FFFFFF", 
                textDecoration: "underline",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              Registre-se agora
            </span>
          </p>

          {/* Badge Image */}
          <img 
            src={badgeImage} 
            alt="Fisioterapia Regenerativa Badge" 
            style={{
              width: "280px",
              height: "auto",
              filter: "drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3))",
              marginLeft: "40px"
            }}
          />
        </div>
      </div>
    </div>
  );
}
