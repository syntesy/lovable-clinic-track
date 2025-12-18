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
      const { data, error } = await supabase.auth.signInWithPassword({
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
            full_name: signupData.fullName
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8" style={{ backgroundColor: 'hsl(220, 30%, 22%)' }}>
      {/* Main Container - Two Columns */}
      <div className="flex flex-col lg:flex-row w-full max-w-6xl gap-8 lg:gap-16 items-center justify-center">
        
        {/* LEFT COLUMN - Login Card */}
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center">
          {isLoginView ? (
            <>
              {/* User Avatar Icon */}
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: 'hsl(220, 30%, 26%)' }}
              >
                <User size={40} color="hsl(220, 30%, 60%)" strokeWidth={1.5} />
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="w-full space-y-4">
                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Usuário
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <User size={16} />
                    </div>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="w-full h-11 rounded-full text-sm font-medium pl-11 pr-4 outline-none transition-all focus:ring-2 focus:ring-primary/30"
                      style={{ backgroundColor: 'hsl(220, 20%, 90%)', color: 'hsl(220, 20%, 25%)' }}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Senha
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock size={16} />
                    </div>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full h-11 rounded-full text-sm font-medium pl-11 pr-4 outline-none transition-all focus:ring-2 focus:ring-primary/30"
                      style={{ backgroundColor: 'hsl(220, 20%, 90%)', color: 'hsl(220, 20%, 25%)' }}
                    />
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-full text-sm font-bold uppercase tracking-wider text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                  style={{ backgroundColor: 'hsl(220, 38%, 25%)' }}
                >
                  {loading ? "Entrando..." : "LOGIN"}
                </button>
              </form>

              {/* Footer Links */}
              <div className="flex items-center justify-between w-full mt-5 text-xs text-gray-500">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-primary"
                  />
                  <span>Lembrar-me</span>
                </label>
                <span className="cursor-pointer hover:underline">
                  Esqueceu sua senha?
                </span>
              </div>

              {/* Pagination Dots */}
              <div className="flex gap-2 mt-6">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(220, 38%, 25%)' }} />
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <div className="w-2 h-2 rounded-full bg-gray-300" />
              </div>
            </>
          ) : (
            <>
              {/* Signup Form */}
              <h2 className="text-xl font-bold mb-5" style={{ color: 'hsl(220, 38%, 25%)' }}>
                Cadastrar
              </h2>
              <form onSubmit={handleSignup} className="w-full space-y-2.5">
                {[
                  { placeholder: "Nome Completo", value: signupData.fullName, key: "fullName", required: true },
                  { placeholder: "Email", value: signupData.email, key: "email", type: "email", required: true },
                  { placeholder: "Telefone", value: signupData.phone, key: "phone", type: "tel" },
                  { placeholder: "CPF", value: signupData.cpf, key: "cpf" },
                  { placeholder: "Endereço", value: signupData.address, key: "address" },
                  { placeholder: "Senha", value: signupData.password, key: "password", type: "password", required: true },
                  { placeholder: "Confirmar Senha", value: signupData.confirmPassword, key: "confirmPassword", type: "password", required: true }
                ].map((field) => (
                  <input
                    key={field.key}
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={(e) => setSignupData({ ...signupData, [field.key]: e.target.value })}
                    required={field.required}
                    className="w-full h-10 rounded-full text-sm px-4 outline-none"
                    style={{ backgroundColor: 'hsl(220, 20%, 90%)', color: 'hsl(220, 20%, 25%)' }}
                  />
                ))}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-full text-sm font-bold uppercase tracking-wider text-white transition-all hover:opacity-90 mt-2"
                  style={{ backgroundColor: 'hsl(220, 38%, 25%)' }}
                >
                  {loading ? "Criando..." : "CRIAR CONTA"}
                </button>
              </form>
              <p
                className="text-xs text-gray-500 mt-4 cursor-pointer"
                onClick={() => setIsLoginView(true)}
              >
                Já tem conta?{" "}
                <span className="underline font-semibold">Fazer login</span>
              </p>
            </>
          )}
        </div>

        {/* RIGHT COLUMN - Welcome & Branding */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
          {/* Welcome Text */}
          <h1 className="text-4xl md:text-5xl font-semibold text-white mb-4">
            Bem-vindo.
          </h1>
          <p className="text-white/70 text-sm md:text-base leading-relaxed mb-6 max-w-md">
            Por favor, faça login para acessar o sistema<br className="hidden md:block" />
            da Fisioterapia Regenerativa.
          </p>

          {/* Register Link */}
          <p className="text-white/60 text-sm mb-10">
            Primeiro acesso?{" "}
            <span
              onClick={() => setIsLoginView(false)}
              className="text-white underline cursor-pointer font-medium hover:text-white/90"
            >
              Registre-se agora
            </span>
          </p>

          {/* Badge Image */}
          <div className="relative">
            <img
              src={badgeImage}
              alt="Fisioterapia Regenerativa Badge"
              className="w-48 md:w-64 h-auto drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
