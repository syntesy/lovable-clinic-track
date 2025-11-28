import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import macLogo from "@/assets/mac-logo.png";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center" style={{ backgroundColor: "#DBDDE9" }}>
        <div className="text-center">
          <img src={macLogo} alt="MAC Logo" className="h-32 mx-auto mb-6" />
          <h1
            className="text-2xl font-light tracking-[0.3em] uppercase"
            style={{ color: "#3D4F7C" }}
          >
            MÉTODO DE ACELERAÇÃO CICATRICIAL
          </h1>
        </div>
      </div>

      {/* Right Column - Login and Signup Forms */}
      <div
        className="w-full lg:w-1/2 flex items-center justify-center p-8"
        style={{ backgroundColor: "#3D4F7C" }}
      >
        <div className="w-full max-w-md space-y-8">
          {/* Login Form */}
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold" style={{ color: "#FFFFFF" }}>
              Entrar
            </h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" style={{ color: "#C5CADF" }}>
                  Email
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="Email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  style={{ backgroundColor: "#F5F6FA", color: "#3A3A45" }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" style={{ color: "#C5CADF" }}>
                  Senha
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Senha"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  style={{ backgroundColor: "#F5F6FA", color: "#3A3A45" }}
                />
              </div>

              <div className="flex items-center justify-between">
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
                className="w-full"
                style={{ backgroundColor: "#2F3F6B", color: "#FFFFFF" }}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </div>

          {/* Signup Form */}
          <div className="space-y-6 pt-8 border-t" style={{ borderColor: "#5A6B8F" }}>
            <h2 className="text-3xl font-semibold" style={{ color: "#FFFFFF" }}>
              Criar nova conta
            </h2>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name" style={{ color: "#C5CADF" }}>
                  Nome Completo
                </Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Nome Completo"
                  value={signupData.fullName}
                  onChange={(e) =>
                    setSignupData({ ...signupData, fullName: e.target.value })
                  }
                  required
                  style={{ backgroundColor: "#F5F6FA", color: "#3A3A45" }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" style={{ color: "#C5CADF" }}>
                  Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Email"
                  value={signupData.email}
                  onChange={(e) =>
                    setSignupData({ ...signupData, email: e.target.value })
                  }
                  required
                  style={{ backgroundColor: "#F5F6FA", color: "#3A3A45" }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-phone" style={{ color: "#C5CADF" }}>
                  Telefone
                </Label>
                <Input
                  id="signup-phone"
                  type="tel"
                  placeholder="Telefone"
                  value={signupData.phone}
                  onChange={(e) =>
                    setSignupData({ ...signupData, phone: e.target.value })
                  }
                  style={{ backgroundColor: "#F5F6FA", color: "#3A3A45" }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-cpf" style={{ color: "#C5CADF" }}>
                  CPF
                </Label>
                <Input
                  id="signup-cpf"
                  type="text"
                  placeholder="CPF"
                  value={signupData.cpf}
                  onChange={(e) =>
                    setSignupData({ ...signupData, cpf: e.target.value })
                  }
                  style={{ backgroundColor: "#F5F6FA", color: "#3A3A45" }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-address" style={{ color: "#C5CADF" }}>
                  Endereço Completo
                </Label>
                <Input
                  id="signup-address"
                  type="text"
                  placeholder="Endereço Completo"
                  value={signupData.address}
                  onChange={(e) =>
                    setSignupData({ ...signupData, address: e.target.value })
                  }
                  style={{ backgroundColor: "#F5F6FA", color: "#3A3A45" }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" style={{ color: "#C5CADF" }}>
                  Senha
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Senha"
                  value={signupData.password}
                  onChange={(e) =>
                    setSignupData({ ...signupData, password: e.target.value })
                  }
                  required
                  style={{ backgroundColor: "#F5F6FA", color: "#3A3A45" }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password" style={{ color: "#C5CADF" }}>
                  Confirmar Senha
                </Label>
                <Input
                  id="signup-confirm-password"
                  type="password"
                  placeholder="Confirmar Senha"
                  value={signupData.confirmPassword}
                  onChange={(e) =>
                    setSignupData({ ...signupData, confirmPassword: e.target.value })
                  }
                  required
                  style={{ backgroundColor: "#F5F6FA", color: "#3A3A45" }}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                style={{ backgroundColor: "#2F3F6B", color: "#FFFFFF" }}
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
