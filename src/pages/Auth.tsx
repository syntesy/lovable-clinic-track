import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
    <div className="flex min-h-screen">
      {/* Left Column - Logo */}
      <div 
        className="flex items-center justify-center" 
        style={{ 
          width: "720px", 
          height: "100vh",
          backgroundColor: "#DBDDE9" 
        }}
      >
        <img 
          src={macLogo} 
          alt="MAC Logo" 
          style={{ 
            width: "480px",
            height: "auto"
          }}
        />
      </div>

      {/* Right Column - Login and Signup Forms */}
      <div
        className="flex items-center justify-center"
        style={{ 
          width: "720px", 
          height: "100vh",
          backgroundColor: "#3D4F7C"
        }}
      >
        <div style={{ width: "480px" }}>
          {/* Login Form */}
          <div className="mb-8">
            <h2 
              style={{ 
                color: "#FFFFFF", 
                fontSize: "28px", 
                fontWeight: "600",
                marginBottom: "18px"
              }}
            >
              Entrar
            </h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                id="login-email"
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="border-0"
                style={{ 
                  backgroundColor: "#F5F6FA", 
                  color: "#3A3A45",
                  height: "68px",
                  borderRadius: "16px",
                  fontSize: "16px",
                  width: "100%",
                  paddingLeft: "24px",
                  paddingRight: "24px"
                }}
              />

              <div className="relative">
                <Input
                  id="login-password"
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="Senha"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="border-0 pr-16"
                  style={{ 
                    backgroundColor: "#F5F6FA", 
                    color: "#3A3A45",
                    height: "68px",
                    borderRadius: "16px",
                    fontSize: "16px",
                    width: "100%",
                    paddingLeft: "24px"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2"
                  style={{ color: "#9CA3AF" }}
                >
                  {showLoginPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>

              <div className="flex items-center justify-between" style={{ marginTop: "12px", marginBottom: "12px" }}>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm cursor-pointer"
                    style={{ color: "#C5CADF" }}
                  >
                    Lembrar-me
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm hover:underline"
                  style={{ color: "#C5CADF" }}
                >
                  Esqueci minha senha
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full border-0"
                style={{ 
                  backgroundColor: "#2F3F6B", 
                  color: "#FFFFFF",
                  height: "64px",
                  borderRadius: "16px",
                  fontSize: "18px",
                  fontWeight: "600",
                  marginTop: "24px"
                }}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </div>

          {/* Signup Form */}
          <div style={{ marginTop: "32px" }}>
            <h2 
              style={{ 
                color: "#FFFFFF", 
                fontSize: "26px", 
                fontWeight: "600",
                marginBottom: "18px"
              }}
            >
              Cadastrar
            </h2>
            <form onSubmit={handleSignup} className="space-y-4">
              <Input
                id="signup-name"
                type="text"
                placeholder="Nome Completo"
                value={signupData.fullName}
                onChange={(e) =>
                  setSignupData({ ...signupData, fullName: e.target.value })
                }
                required
                className="border-0"
                style={{ 
                  backgroundColor: "#F5F6FA", 
                  color: "#3A3A45",
                  height: "68px",
                  borderRadius: "16px",
                  fontSize: "16px",
                  width: "100%",
                  paddingLeft: "24px",
                  paddingRight: "24px"
                }}
              />

              <Input
                id="signup-email"
                type="email"
                placeholder="Email"
                value={signupData.email}
                onChange={(e) =>
                  setSignupData({ ...signupData, email: e.target.value })
                }
                required
                className="border-0"
                style={{ 
                  backgroundColor: "#F5F6FA", 
                  color: "#3A3A45",
                  height: "68px",
                  borderRadius: "16px",
                  fontSize: "16px",
                  width: "100%",
                  paddingLeft: "24px",
                  paddingRight: "24px"
                }}
              />

              <Input
                id="signup-phone"
                type="tel"
                placeholder="Telefone"
                value={signupData.phone}
                onChange={(e) =>
                  setSignupData({ ...signupData, phone: e.target.value })
                }
                className="border-0"
                style={{ 
                  backgroundColor: "#F5F6FA", 
                  color: "#3A3A45",
                  height: "68px",
                  borderRadius: "16px",
                  fontSize: "16px",
                  width: "100%",
                  paddingLeft: "24px",
                  paddingRight: "24px"
                }}
              />

              <Input
                id="signup-cpf"
                type="text"
                placeholder="CPF"
                value={signupData.cpf}
                onChange={(e) =>
                  setSignupData({ ...signupData, cpf: e.target.value })
                }
                className="border-0"
                style={{ 
                  backgroundColor: "#F5F6FA", 
                  color: "#3A3A45",
                  height: "68px",
                  borderRadius: "16px",
                  fontSize: "16px",
                  width: "100%",
                  paddingLeft: "24px",
                  paddingRight: "24px"
                }}
              />

              <Input
                id="signup-address"
                type="text"
                placeholder="Endereço Completo"
                value={signupData.address}
                onChange={(e) =>
                  setSignupData({ ...signupData, address: e.target.value })
                }
                className="border-0"
                style={{ 
                  backgroundColor: "#F5F6FA", 
                  color: "#3A3A45",
                  height: "68px",
                  borderRadius: "16px",
                  fontSize: "16px",
                  width: "100%",
                  paddingLeft: "24px",
                  paddingRight: "24px"
                }}
              />

              <div className="relative">
                <Input
                  id="signup-password"
                  type={showSignupPassword ? "text" : "password"}
                  placeholder="Senha"
                  value={signupData.password}
                  onChange={(e) =>
                    setSignupData({ ...signupData, password: e.target.value })
                  }
                  required
                  className="border-0 pr-16"
                  style={{ 
                    backgroundColor: "#F5F6FA", 
                    color: "#3A3A45",
                    height: "68px",
                    borderRadius: "16px",
                    fontSize: "16px",
                    width: "100%",
                    paddingLeft: "24px"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2"
                  style={{ color: "#9CA3AF" }}
                >
                  {showSignupPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>

              <div className="relative">
                <Input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmar Senha"
                  value={signupData.confirmPassword}
                  onChange={(e) =>
                    setSignupData({ ...signupData, confirmPassword: e.target.value })
                  }
                  required
                  className="border-0 pr-16"
                  style={{ 
                    backgroundColor: "#F5F6FA", 
                    color: "#3A3A45",
                    height: "68px",
                    borderRadius: "16px",
                    fontSize: "16px",
                    width: "100%",
                    paddingLeft: "24px"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2"
                  style={{ color: "#9CA3AF" }}
                >
                  {showConfirmPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full border-0"
                style={{ 
                  backgroundColor: "#2F3F6B", 
                  color: "#FFFFFF",
                  height: "64px",
                  borderRadius: "16px",
                  fontSize: "18px",
                  fontWeight: "600",
                  marginTop: "24px"
                }}
              >
                {loading ? "Criando conta..." : "Criar Conta"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
