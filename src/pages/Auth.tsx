import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Lock, Mail, Phone, FileText, MapPin, Eye, EyeOff } from "lucide-react";
import macLogo from "@/assets/mac-logo.png";

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
    <div className="min-h-screen flex">
      {/* Left Column - Logo and Branding */}
      <div 
        className="hidden lg:flex lg:w-1/2 items-center justify-center" 
        style={{ backgroundColor: "#DBDDE9", padding: "120px" }}
      >
        <div className="flex flex-col items-center justify-center">
          <img 
            src={macLogo} 
            alt="MAC Logo" 
            className="mb-6" 
            style={{ maxWidth: "280px", width: "100%", height: "auto" }}
          />
          <h1
            className="text-center uppercase"
            style={{ 
              color: "#3D4F7C",
              fontSize: "23px",
              fontWeight: "300",
              letterSpacing: "1px",
              lineHeight: "1.4"
            }}
          >
            MÉTODO DE ACELERAÇÃO CICATRICIAL
          </h1>
        </div>
      </div>

      {/* Right Column - Login and Signup Forms */}
      <div
        className="w-full lg:w-1/2 flex items-center"
        style={{ backgroundColor: "#3D4F7C", paddingLeft: "80px", paddingRight: "100px" }}
      >
        <div className="w-full" style={{ maxWidth: "480px" }}>
          {/* Login Form */}
          <div className="mb-12">
            <h2 
              className="mb-5"
              style={{ 
                color: "#FFFFFF", 
                fontSize: "32px", 
                fontWeight: "600",
                marginBottom: "18px"
              }}
            >
              Log in
            </h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <User 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  size={20}
                />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="Username"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="pl-12 border-0"
                  style={{ 
                    backgroundColor: "#F5F6FA", 
                    color: "#3A3A45",
                    height: "52px",
                    borderRadius: "12px",
                    fontSize: "15px"
                  }}
                />
              </div>

              <div className="relative">
                <Lock 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  size={20}
                />
                <Input
                  id="login-password"
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="pl-12 pr-12 border-0"
                  style={{ 
                    backgroundColor: "#F5F6FA", 
                    color: "#3A3A45",
                    height: "52px",
                    borderRadius: "12px",
                    fontSize: "15px"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="flex items-center justify-between" style={{ marginTop: "16px", marginBottom: "28px" }}>
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
                    Remember Me
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm hover:underline"
                  style={{ color: "#C5CADF" }}
                >
                  Forgot Password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full border-0"
                style={{ 
                  backgroundColor: "#2F3F6B", 
                  color: "#FFFFFF",
                  height: "52px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "600",
                  marginTop: "18px"
                }}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </div>

          {/* Signup Form */}
          <div style={{ marginTop: "48px" }}>
            <h2 
              style={{ 
                color: "#FFFFFF", 
                fontSize: "28px", 
                fontWeight: "600",
                marginBottom: "18px"
              }}
            >
              Cadastrar
            </h2>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="relative">
                <User 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  size={20}
                />
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Nome Completo"
                  value={signupData.fullName}
                  onChange={(e) =>
                    setSignupData({ ...signupData, fullName: e.target.value })
                  }
                  required
                  className="pl-12 border-0"
                  style={{ 
                    backgroundColor: "#F5F6FA", 
                    color: "#3A3A45",
                    height: "52px",
                    borderRadius: "12px",
                    fontSize: "15px"
                  }}
                />
              </div>

              <div className="relative">
                <Mail 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  size={20}
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
                  className="pl-12 border-0"
                  style={{ 
                    backgroundColor: "#F5F6FA", 
                    color: "#3A3A45",
                    height: "52px",
                    borderRadius: "12px",
                    fontSize: "15px"
                  }}
                />
              </div>

              <div className="relative">
                <Phone 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  size={20}
                />
                <Input
                  id="signup-phone"
                  type="tel"
                  placeholder="Telefone"
                  value={signupData.phone}
                  onChange={(e) =>
                    setSignupData({ ...signupData, phone: e.target.value })
                  }
                  className="pl-12 border-0"
                  style={{ 
                    backgroundColor: "#F5F6FA", 
                    color: "#3A3A45",
                    height: "52px",
                    borderRadius: "12px",
                    fontSize: "15px"
                  }}
                />
              </div>

              <div className="relative">
                <FileText 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  size={20}
                />
                <Input
                  id="signup-cpf"
                  type="text"
                  placeholder="CPF"
                  value={signupData.cpf}
                  onChange={(e) =>
                    setSignupData({ ...signupData, cpf: e.target.value })
                  }
                  className="pl-12 border-0"
                  style={{ 
                    backgroundColor: "#F5F6FA", 
                    color: "#3A3A45",
                    height: "52px",
                    borderRadius: "12px",
                    fontSize: "15px"
                  }}
                />
              </div>

              <div className="relative">
                <MapPin 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  size={20}
                />
                <Input
                  id="signup-address"
                  type="text"
                  placeholder="Endereço Completo"
                  value={signupData.address}
                  onChange={(e) =>
                    setSignupData({ ...signupData, address: e.target.value })
                  }
                  className="pl-12 border-0"
                  style={{ 
                    backgroundColor: "#F5F6FA", 
                    color: "#3A3A45",
                    height: "52px",
                    borderRadius: "12px",
                    fontSize: "15px"
                  }}
                />
              </div>

              <div className="relative">
                <Lock 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  size={20}
                />
                <Input
                  id="signup-password"
                  type={showSignupPassword ? "text" : "password"}
                  placeholder="Senha"
                  value={signupData.password}
                  onChange={(e) =>
                    setSignupData({ ...signupData, password: e.target.value })
                  }
                  required
                  className="pl-12 pr-12 border-0"
                  style={{ 
                    backgroundColor: "#F5F6FA", 
                    color: "#3A3A45",
                    height: "52px",
                    borderRadius: "12px",
                    fontSize: "15px"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showSignupPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="relative">
                <Lock 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  size={20}
                />
                <Input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmar Senha"
                  value={signupData.confirmPassword}
                  onChange={(e) =>
                    setSignupData({ ...signupData, confirmPassword: e.target.value })
                  }
                  required
                  className="pl-12 pr-12 border-0"
                  style={{ 
                    backgroundColor: "#F5F6FA", 
                    color: "#3A3A45",
                    height: "52px",
                    borderRadius: "12px",
                    fontSize: "15px"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full border-0"
                style={{ 
                  backgroundColor: "#2F3F6B", 
                  color: "#FFFFFF",
                  height: "52px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "600",
                  marginTop: "22px"
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
