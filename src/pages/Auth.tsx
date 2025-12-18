import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Lock } from "lucide-react";
import badgeImage from "@/assets/fisioterapia-regenerativa-badge.png";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    phone: "",
    cpf: "",
    crefito: "",
    address: "",
    password: "",
    confirmPassword: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            full_name: signupData.fullName,
            crefito: signupData.crefito
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      if (authError) throw authError;
      if (authData.user) {
        const { error: profileError } = await supabase
          .from("user_profiles")
          .update({
            phone: signupData.phone,
            cpf: signupData.cpf,
            address: signupData.address
          })
          .eq("user_id", authData.user.id);
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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* COLUNA ESQUERDA - LOGIN */}
      <div
        style={{
          width: "450px",
          minWidth: "450px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#E8EAF0",
        }}
      >
        {/* CARD DE LOGIN */}
        <div
          style={{
            width: "360px",
            backgroundColor: "#FFFFFF",
            borderRadius: "24px",
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
            padding: "40px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {isLoginView ? (
            <>
              {/* 1. LOGO DO APP */}
              <h1
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#2F3F6B",
                  textAlign: "center",
                  marginBottom: "24px",
                  fontFamily: "Inter, sans-serif",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                Fisioterapia Regenerativa
              </h1>

              {/* 2. ÍCONE DE USUÁRIO */}
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  backgroundColor: "#2F3F6B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "32px",
                }}
              >
                <User size={40} color="#FFFFFF" strokeWidth={1.5} />
              </div>

              {/* FORMULÁRIO DE LOGIN */}
              <form onSubmit={handleLogin} style={{ width: "100%" }}>
                {/* 3. CAMPO USUÁRIO */}
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#2F3F6B",
                      marginBottom: "6px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Usuário
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#F0F2F7",
                      borderRadius: "12px",
                      padding: "0 16px",
                      height: "46px",
                    }}
                  >
                    <User size={18} color="#9CA3AF" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      autoComplete="off"
                      style={{
                        flex: 1,
                        border: "none",
                        background: "transparent",
                        marginLeft: "12px",
                        fontSize: "14px",
                        color: "#1F2937",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* 4. CAMPO SENHA */}
                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#2F3F6B",
                      marginBottom: "6px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Senha
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#F0F2F7",
                      borderRadius: "12px",
                      padding: "0 16px",
                      height: "46px",
                    }}
                  >
                    <Lock size={18} color="#9CA3AF" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      style={{
                        flex: 1,
                        border: "none",
                        background: "transparent",
                        marginLeft: "12px",
                        fontSize: "14px",
                        color: "#1F2937",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* 5. BOTÃO LOGIN */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    height: "46px",
                    backgroundColor: "#2F3F6B",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    transition: "opacity 0.2s",
                  }}
                >
                  {loading ? "Entrando..." : "LOGIN"}
                </button>
              </form>

              {/* 6. OPÇÕES ABAIXO DO BOTÃO */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  marginTop: "16px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    color: "#6B7280",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{
                      width: "14px",
                      height: "14px",
                      accentColor: "#2F3F6B",
                    }}
                  />
                  Lembrar-me
                </label>
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "12px",
                    color: "#6B7280",
                    cursor: "pointer",
                  }}
                >
                  Esqueceu sua senha?
                </button>
              </div>

              {/* 7. INDICADOR DE PÁGINA */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "32px",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#2F3F6B",
                  }}
                />
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#D1D5DB",
                  }}
                />
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#D1D5DB",
                  }}
                />
              </div>
            </>
          ) : (
            <>
              {/* FORMULÁRIO DE CADASTRO */}
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#2F3F6B",
                  marginBottom: "24px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Cadastrar
              </h2>
              <form onSubmit={handleSignup} style={{ width: "100%" }}>
                {[
                  { label: "Nome Completo", value: signupData.fullName, key: "fullName", required: true },
                  { label: "Email", value: signupData.email, key: "email", type: "email", required: true },
                  { label: "Registro CREFITO", value: signupData.crefito, key: "crefito", required: true },
                  { label: "Telefone", value: signupData.phone, key: "phone", type: "tel" },
                  { label: "CPF", value: signupData.cpf, key: "cpf" },
                  { label: "Senha", value: signupData.password, key: "password", type: "password", required: true },
                  { label: "Confirmar Senha", value: signupData.confirmPassword, key: "confirmPassword", type: "password", required: true }
                ].map((field) => (
                  <div key={field.key} style={{ marginBottom: "12px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#2F3F6B",
                        marginBottom: "4px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {field.label}
                    </label>
                    <input
                      type={field.type || "text"}
                      value={field.value}
                      onChange={(e) => setSignupData({ ...signupData, [field.key]: e.target.value })}
                      required={field.required}
                      autoComplete="off"
                      style={{
                        width: "100%",
                        height: "42px",
                        backgroundColor: "#F0F2F7",
                        borderRadius: "12px",
                        border: "none",
                        padding: "0 16px",
                        fontSize: "14px",
                        color: "#1F2937",
                        outline: "none",
                      }}
                    />
                  </div>
                ))}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    height: "46px",
                    backgroundColor: "#2F3F6B",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    marginTop: "8px",
                  }}
                >
                  {loading ? "Criando..." : "CRIAR CONTA"}
                </button>
              </form>
              <p
                style={{
                  fontSize: "12px",
                  color: "#6B7280",
                  marginTop: "16px",
                  cursor: "pointer",
                }}
                onClick={() => setIsLoginView(true)}
              >
                Já tem conta?{" "}
                <span style={{ textDecoration: "underline", fontWeight: 600 }}>
                  Fazer login
                </span>
              </p>
            </>
          )}
        </div>
      </div>

      {/* COLUNA DIREITA - BRANDING */}
      <div
        style={{
          flex: 1,
          height: "100%",
          backgroundColor: "#2F3F6B",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 80px",
        }}
      >
        {/* TEXTOS - ALINHADOS À ESQUERDA */}
        <div style={{ maxWidth: "380px" }}>
          <h2
            style={{
              fontSize: "48px",
              fontWeight: 700,
              color: "#FFFFFF",
              marginBottom: "16px",
              fontFamily: "Inter, sans-serif",
              lineHeight: 1.1,
            }}
          >
            Bem-vindo.
          </h2>
          <p
            style={{
              fontSize: "15px",
              color: "rgba(255, 255, 255, 0.75)",
              lineHeight: 1.6,
              marginBottom: "24px",
            }}
          >
            Por favor, faça login para acessar o sistema da Fisioterapia Regenerativa.
          </p>
          <button
            type="button"
            onClick={() => setIsLoginView(!isLoginView)}
            style={{
              background: "none",
              border: "none",
              fontSize: "14px",
              color: "#FFFFFF",
              cursor: "pointer",
              textDecoration: "underline",
              padding: 0,
            }}
          >
            {isLoginView ? "Primeiro acesso? Registre-se agora" : "Já tem conta? Faça login"}
          </button>
        </div>

        {/* SÍMBOLO DA FISIOTERAPIA REGENERATIVA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={badgeImage}
            alt="Fisioterapia Regenerativa"
            style={{
              width: "300px",
              height: "auto",
              objectFit: "contain",
            }}
          />
        </div>
      </div>
    </div>
  );
}
