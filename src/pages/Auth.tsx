import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Lock } from "lucide-react";
import badgeImage from "@/assets/fisioterapia-regenerativa-badge.png";
export default function Auth() {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
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
    confirmPassword: ""
  });
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });
      if (error) throw error;
      toast({
        title: "Login realizado com sucesso",
        description: "Redirecionando..."
      });
      navigate("/pacientes");
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive"
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
        variant: "destructive"
      });
      return;
    }
    if (signupData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const {
        data: authData,
        error: authError
      } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            full_name: signupData.fullName
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      if (authError) throw authError;
      if (authData.user) {
        const {
          error: profileError
        } = await supabase.from("user_profiles").update({
          phone: signupData.phone,
          cpf: signupData.cpf,
          address: signupData.address
        }).eq("user_id", authData.user.id);
        if (profileError) throw profileError;
        toast({
          title: "Cadastro realizado com sucesso",
          description: "Redirecionando..."
        });
        navigate("/pacientes");
      }
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div style={{
    minHeight: "100vh",
    width: "100%",
    background: "linear-gradient(180deg, #1a2550 0%, #243058 40%, #2d3a68 100%)",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden"
  }}>
      {/* Conteúdo Principal */}
      <div style={{
      flex: 1,
      display: "flex",
      alignItems: "center",
      padding: "40px 60px",
      gap: "60px"
    }}>
        {/* Card de Login - Esquerda */}
        <div style={{
        width: "320px",
        backgroundColor: "rgba(245, 247, 252, 0.97)",
        borderRadius: "20px",
        padding: "28px 24px",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flexShrink: 0
      }}>
          {/* Logo Header */}
          <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "20px",
          alignSelf: "flex-start"
        }}>
            
            <div style={{
            lineHeight: "1.1"
          }}>
              
              
            </div>
          </div>

          {isLoginView ? <>
              {/* Avatar Icon */}
              <div style={{
            width: "72px",
            height: "72px",
            backgroundColor: "#2A3A5E",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px"
          }}>
                <User size={38} color="#7A8EBB" strokeWidth={1.5} />
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} style={{
            width: "100%"
          }}>
                {/* Email Input */}
                <div style={{
              position: "relative",
              marginBottom: "10px"
            }}>
                  <div style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#8A9BB8"
              }}>
                    <User size={15} />
                  </div>
                  <input type="email" placeholder="USUÁRIO" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required style={{
                width: "100%",
                height: "40px",
                backgroundColor: "#E4E8F0",
                color: "#2E3350",
                borderRadius: "20px",
                fontSize: "11px",
                fontFamily: "Inter, sans-serif",
                fontWeight: "500",
                letterSpacing: "0.5px",
                border: "none",
                outline: "none",
                padding: "0 14px 0 38px",
                boxSizing: "border-box"
              }} />
                </div>

                {/* Password Input */}
                <div style={{
              position: "relative",
              marginBottom: "14px"
            }}>
                  <div style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#8A9BB8"
              }}>
                    <Lock size={15} />
                  </div>
                  <input type="password" placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required style={{
                width: "100%",
                height: "40px",
                backgroundColor: "#E4E8F0",
                color: "#2E3350",
                borderRadius: "20px",
                fontSize: "11px",
                fontFamily: "Inter, sans-serif",
                fontWeight: "500",
                letterSpacing: "2px",
                border: "none",
                outline: "none",
                padding: "0 14px 0 38px",
                boxSizing: "border-box"
              }} />
                </div>

                {/* Login Button */}
                <button type="submit" disabled={loading} style={{
              width: "100%",
              height: "40px",
              backgroundColor: "#1E2A5E",
              color: "#FFFFFF",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "700",
              fontFamily: "Inter, sans-serif",
              letterSpacing: "1px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              opacity: loading ? 0.6 : 1,
              marginBottom: "14px"
            }} onMouseEnter={e => !loading && (e.currentTarget.style.opacity = "0.9")} onMouseLeave={e => !loading && (e.currentTarget.style.opacity = "1")}>
                  {loading ? "ENTRANDO..." : "LOGIN"}
                </button>
              </form>

              {/* Footer Links */}
              <div style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            fontSize: "9px",
            color: "#6B7A99",
            fontFamily: "Inter, sans-serif"
          }}>
                <label style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer"
            }}>
                  <div style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#1E2A5E"
              }} />
                  Lembrar-me
                </label>
                <span style={{
              cursor: "pointer"
            }}>
                  Esqueceu sua senha?
                </span>
              </div>

              {/* Pagination Dots */}
              <div style={{
            display: "flex",
            gap: "6px",
            marginTop: "18px"
          }}>
                <div style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#1E2A5E"
            }} />
                <div style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#C0C8D8"
            }} />
                <div style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#C0C8D8"
            }} />
              </div>
            </> : <>
              {/* Signup Form */}
              <h2 style={{
            color: "#1E2A5E",
            fontSize: "18px",
            fontWeight: "700",
            fontFamily: "Inter, sans-serif",
            marginBottom: "16px"
          }}>
                Cadastrar
              </h2>
              <form onSubmit={handleSignup} style={{
            width: "100%"
          }}>
                {[{
              placeholder: "Nome Completo",
              value: signupData.fullName,
              key: "fullName",
              required: true
            }, {
              placeholder: "Email",
              value: signupData.email,
              key: "email",
              type: "email",
              required: true
            }, {
              placeholder: "Telefone",
              value: signupData.phone,
              key: "phone",
              type: "tel"
            }, {
              placeholder: "CPF",
              value: signupData.cpf,
              key: "cpf"
            }, {
              placeholder: "Endereço",
              value: signupData.address,
              key: "address"
            }, {
              placeholder: "Senha",
              value: signupData.password,
              key: "password",
              type: "password",
              required: true
            }, {
              placeholder: "Confirmar Senha",
              value: signupData.confirmPassword,
              key: "confirmPassword",
              type: "password",
              required: true
            }].map(field => <input key={field.key} type={field.type || "text"} placeholder={field.placeholder} value={field.value} onChange={e => setSignupData({
              ...signupData,
              [field.key]: e.target.value
            })} required={field.required} style={{
              width: "100%",
              height: "38px",
              backgroundColor: "#E4E8F0",
              color: "#2E3350",
              borderRadius: "19px",
              fontSize: "11px",
              fontFamily: "Inter, sans-serif",
              border: "none",
              outline: "none",
              padding: "0 14px",
              marginBottom: "7px",
              boxSizing: "border-box"
            }} />)}
                <button type="submit" disabled={loading} style={{
              width: "100%",
              height: "40px",
              backgroundColor: "#1E2A5E",
              color: "#FFFFFF",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "700",
              fontFamily: "Inter, sans-serif",
              letterSpacing: "1px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "6px"
            }}>
                  {loading ? "CRIANDO..." : "CRIAR CONTA"}
                </button>
              </form>
              <p style={{
            color: "#6B7A99",
            fontSize: "10px",
            fontFamily: "Inter, sans-serif",
            marginTop: "12px",
            cursor: "pointer"
          }} onClick={() => setIsLoginView(true)}>
                Já tem conta? <span style={{
              textDecoration: "underline",
              fontWeight: "600"
            }}>Fazer login</span>
              </p>
            </>}
        </div>

        {/* Seção Central - Texto de Boas Vindas */}
        <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        marginTop: "-40px"
      }}>
          <h1 style={{
          color: "#FFFFFF",
          fontSize: "42px",
          fontWeight: "600",
          fontFamily: "Inter, sans-serif",
          marginBottom: "12px",
          marginTop: "0"
        }}>
            Bem-vindo.
          </h1>
          <p style={{
          color: "rgba(255, 255, 255, 0.7)",
          fontSize: "14px",
          fontFamily: "Inter, sans-serif",
          lineHeight: "1.5",
          marginBottom: "20px"
        }}>
            Por favor, faça login para acessar o sistema<br />
            da Fisioterapia Regenerativa.
          </p>

          <p style={{
          color: "rgba(255, 255, 255, 0.6)",
          fontSize: "12px",
          fontFamily: "Inter, sans-serif"
        }}>
            Primeiro acesso?{" "}
            <span onClick={() => setIsLoginView(false)} style={{
            color: "#FFFFFF",
            textDecoration: "underline",
            cursor: "pointer",
            fontWeight: "500"
          }}>
              Registre-se agora
            </span>
          </p>
        </div>

        {/* Seção Direita - Badge com fundo */}
        <div style={{
        position: "relative",
        marginLeft: "auto"
      }}>
          {/* Card de fundo arredondado */}
          <div style={{
          position: "absolute",
          top: "-20px",
          right: "-30px",
          width: "340px",
          height: "380px",
          backgroundColor: "rgba(35, 50, 90, 0.6)",
          borderRadius: "24px",
          zIndex: 0
        }} />
          
          {/* Badge Image */}
          <img src={badgeImage} alt="Fisioterapia Regenerativa Badge" style={{
          width: "260px",
          height: "auto",
          position: "relative",
          zIndex: 1,
          filter: "drop-shadow(0 10px 30px rgba(0, 0, 0, 0.2))"
        }} />
        </div>
      </div>
    </div>;
}