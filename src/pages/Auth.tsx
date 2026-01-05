import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, User, AlertTriangle } from "lucide-react";
import { useAuditLog } from "@/hooks/useAuditLog";
import logoRegenapp from "@/assets/logo-regenapp-new.png";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { validateSignup, loginSchema } from "@/lib/password-validation";
export default function Auth() {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    logLogin
  } = useAuditLog();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockoutMessage, setLockoutMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Verificar rate limit ao carregar
  useEffect(() => {
    checkRateLimit();
  }, []);

  const checkRateLimit = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('auth-rate-limit', {
        body: { action: 'check', email: email || undefined }
      });
      
      if (data && !data.allowed) {
        setLockoutMessage(data.message);
        setRemainingAttempts(0);
      } else if (data) {
        setLockoutMessage(null);
        if (data.remainingAttempts < 5) {
          setRemainingAttempts(data.remainingAttempts);
        }
      }
    } catch (err) {
      console.error('Erro ao verificar rate limit:', err);
    }
  };

  const recordFailedAttempt = async () => {
    try {
      const { data } = await supabase.functions.invoke('auth-rate-limit', {
        body: { action: 'record-failure', email }
      });
      
      if (data) {
        setRemainingAttempts(data.remainingAttempts);
        if (!data.allowed || data.lockoutEndsAt) {
          setLockoutMessage(data.message);
        } else if (data.message !== 'OK') {
          toast({
            title: "Atenção",
            description: data.message,
            variant: "destructive"
          });
        }
      }
    } catch (err) {
      console.error('Erro ao registrar tentativa:', err);
    }
  };

  const recordSuccessfulLogin = async () => {
    try {
      await supabase.functions.invoke('auth-rate-limit', {
        body: { action: 'record-success', email }
      });
      setRemainingAttempts(null);
      setLockoutMessage(null);
    } catch (err) {
      console.error('Erro ao registrar sucesso:', err);
    }
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    // Verificar se está bloqueado
    if (lockoutMessage) {
      setError(lockoutMessage);
      setLoading(false);
      return;
    }

    // Validar campos
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const errors: Record<string, string[]> = {};
      validation.error.errors.forEach(e => {
        const field = e.path[0] as string;
        if (!errors[field]) errors[field] = [];
        errors[field].push(e.message);
      });
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      await recordFailedAttempt();
      setError(error.message);
      toast({
        title: "Falha no login",
        description: error.message,
        variant: "destructive"
      });
    } else {
      await recordSuccessfulLogin();
      await logLogin();
      navigate("/pacientes");
    }
    setLoading(false);
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    // Validar todos os campos com schema forte
    const validation = validateSignup({ email, password, fullName });
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0]?.[0];
      if (firstError) setError(firstError);
      setLoading(false);
      return;
    }

    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });
    
    if (error) {
      setError(error.message);
      toast({
        title: "Falha no cadastro",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu email para confirmar o cadastro."
      });
      setIsSignUp(false);
    }
    setLoading(false);
  };
  return <div style={{
    position: "fixed",
    inset: 0,
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1C2939",
    backgroundImage: "url('/images/dna-login-bg-clean.png?v=2')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    overflow: "hidden",
    zIndex: 9999
  }}>
      {/* Overlay sutil para profundidade */}
      <div style={{
      position: "absolute",
      inset: 0,
      background: "radial-gradient(ellipse at center, transparent 30%, rgba(27, 38, 54, 0.5) 100%)",
      pointerEvents: "none"
    }} />

      {/* Container do card */}
      <div style={{
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      zIndex: 10
    }}>
        {/* Card glassmorphism */}
        <div style={{
        width: "min(520px, 90vw)",
        backgroundColor: "rgba(27, 38, 54, 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: "24px",
        padding: "40px 50px 40px 50px",
        boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4)",
        border: "1px solid #253441"
      }}>
          {/* Logo dentro do card */}
          <div style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "30px"
        }}>
            <img src={logoRegenapp} alt="REGENAPP" style={{
            width: "280px",
            height: "auto",
            objectFit: "contain"
          }} />
          </div>

          {/* Título */}
          <h1 style={{
          color: "#FEFEFE",
          fontSize: "24px",
          fontWeight: 600,
          letterSpacing: "3px",
          textAlign: "center",
          marginBottom: "30px",
          fontFamily: "Inter, sans-serif"
        }}>
            {isSignUp ? "CADASTRO" : "LOG-IN"}
          </h1>

          {/* Badge de segurança */}
          <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "30px",
          padding: "8px 16px",
          backgroundColor: "#293E48",
          borderRadius: "20px",
          border: "1px solid #253441"
        }}>
            <Shield style={{
            width: "14px",
            height: "14px",
            color: "#79B997"
          }} />
            <span style={{
            color: "#B7BBC0",
            fontSize: "11px",
            fontFamily: "Inter, sans-serif"
          }}>Conformidade LGPD </span>
          </div>

          {/* Aviso de bloqueio */}
          {lockoutMessage && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 16px",
              backgroundColor: "rgba(255, 77, 77, 0.1)",
              border: "1px solid rgba(255, 77, 77, 0.3)",
              borderRadius: "12px",
              marginBottom: "20px"
            }}>
              <AlertTriangle style={{ width: "16px", height: "16px", color: "#FF4D4D" }} />
              <span style={{ color: "#FF6B6B", fontSize: "12px", fontFamily: "Inter, sans-serif" }}>
                {lockoutMessage}
              </span>
            </div>
          )}

          {/* Aviso de tentativas restantes */}
          {!lockoutMessage && remainingAttempts !== null && remainingAttempts < 5 && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              backgroundColor: "rgba(255, 140, 66, 0.1)",
              border: "1px solid rgba(255, 140, 66, 0.3)",
              borderRadius: "12px",
              marginBottom: "20px"
            }}>
              <AlertTriangle style={{ width: "14px", height: "14px", color: "#FF8C42" }} />
              <span style={{ color: "#FF8C42", fontSize: "11px", fontFamily: "Inter, sans-serif" }}>
                {remainingAttempts} tentativa(s) restante(s)
              </span>
            </div>
          )}

          <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
            {/* Campo Nome (apenas no cadastro) */}
            {isSignUp && <div style={{
            marginBottom: "25px"
          }}>
                <label style={{
              display: "block",
              color: "#FEFEFE",
              fontSize: "14px",
              fontWeight: 500,
              marginBottom: "8px",
              fontFamily: "Inter, sans-serif"
            }}>
                  Nome Completo
                </label>
                <input type="text" placeholder="Seu nome completo" value={fullName} onChange={e => setFullName(e.target.value)} required style={{
              width: "100%",
              backgroundColor: "transparent",
              border: "none",
              borderBottom: fieldErrors.fullName ? "1px solid #FF6B6B" : "1px solid #253441",
              padding: "12px 0",
              color: "#FEFEFE",
              fontSize: "14px",
              outline: "none",
              fontFamily: "Inter, sans-serif"
            }} />
                {fieldErrors.fullName && (
                  <span style={{ color: "#FF6B6B", fontSize: "11px", fontFamily: "Inter, sans-serif", marginTop: "4px", display: "block" }}>
                    {fieldErrors.fullName[0]}
                  </span>
                )}
              </div>}

            {/* Campo Email */}
            <div style={{
            marginBottom: "25px"
          }}>
              <label style={{
              display: "block",
              color: "#FEFEFE",
              fontSize: "14px",
              fontWeight: 500,
              marginBottom: "8px",
              fontFamily: "Inter, sans-serif"
            }}>
                Email
              </label>
              <input 
                type="email" 
                name="email"
                autoComplete="username"
                inputMode="email"
                placeholder="seu@email.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                style={{
                  width: "100%",
                  backgroundColor: "rgba(37, 52, 65, 0.5)",
                  border: fieldErrors.email ? "1px solid #FF6B6B" : "1px solid #253441",
                  borderRadius: "26px",
                  padding: "12px 16px",
                  color: "#FEFEFE",
                  fontSize: "14px",
                  outline: "none",
                  fontFamily: "Inter, sans-serif"
                }} 
              />
              {fieldErrors.email && (
                <span style={{ color: "#FF6B6B", fontSize: "11px", fontFamily: "Inter, sans-serif", marginTop: "4px", display: "block" }}>
                  {fieldErrors.email[0]}
                </span>
              )}
            </div>

            {/* Campo Password */}
            <div style={{
            marginBottom: "30px"
          }}>
              <label style={{
              display: "block",
              color: "#FEFEFE",
              fontSize: "14px",
              fontWeight: 500,
              marginBottom: "8px",
              fontFamily: "Inter, sans-serif"
            }}>
                Senha
              </label>
              <input 
                type="password" 
                name="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                placeholder={isSignUp ? "Mín. 8 caracteres, maiúscula, número e símbolo" : "Sua senha"} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                minLength={isSignUp ? 8 : 1} 
                style={{
                  width: "100%",
                  backgroundColor: "rgba(37, 52, 65, 0.5)",
                  border: fieldErrors.password ? "1px solid #FF6B6B" : "1px solid #253441",
                  borderRadius: "26px",
                  padding: "12px 16px",
                  color: "#FEFEFE",
                  fontSize: "14px",
                  outline: "none",
                  fontFamily: "Inter, sans-serif"
                }} 
              />
              {isSignUp && <PasswordStrengthIndicator password={password} />}
              {fieldErrors.password && (
                <span style={{ color: "#FF6B6B", fontSize: "11px", fontFamily: "Inter, sans-serif", marginTop: "4px", display: "block" }}>
                  {fieldErrors.password[0]}
                </span>
              )}
            </div>

            {/* Mensagem de erro */}
            {error && <p style={{
            color: "#FF6B6B",
            fontSize: "12px",
            textAlign: "center",
            marginBottom: "15px",
            fontFamily: "Inter, sans-serif"
          }}>
                {error}
              </p>}

            {/* Botão principal */}
            <button type="submit" disabled={loading || !!lockoutMessage} style={{
            width: "100%",
            height: "52px",
            backgroundColor: lockoutMessage ? "#555" : "#79B997",
            border: "none",
            borderRadius: "26px",
            color: "#FEFEFE",
            fontSize: "16px",
            fontWeight: 500,
            cursor: (loading || lockoutMessage) ? "not-allowed" : "pointer",
            opacity: (loading || lockoutMessage) ? 0.7 : 1,
            transition: "all 0.2s ease",
            fontFamily: "Inter, sans-serif",
            boxShadow: lockoutMessage ? "none" : "0 4px 20px rgba(121, 185, 151, 0.3)"
          }} onMouseEnter={e => {
            if (!loading && !lockoutMessage) {
              e.currentTarget.style.filter = "brightness(1.1)";
            }
          }} onMouseLeave={e => {
            e.currentTarget.style.filter = "brightness(1)";
          }}>
              {loading ? "Aguarde..." : lockoutMessage ? "Bloqueado" : isSignUp ? "Cadastrar" : "Entrar"}
            </button>
          </form>

          {/* Link para alternar entre login e cadastro */}
          <div style={{
          marginTop: "25px",
          textAlign: "center"
        }}>
            <button type="button" onClick={() => {
            setIsSignUp(!isSignUp);
            setError("");
            setFieldErrors({});
          }} style={{
            background: "none",
            border: "none",
            color: "#B7BBC0",
            fontSize: "13px",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            textDecoration: "underline"
          }}>
              {isSignUp ? "Já tem conta? Faça login" : "Não tem conta? Cadastre-se"}
            </button>
          </div>

          {/* Indicador de página (3 dots) */}
          <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginTop: "25px"
        }}>
            <div style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: isSignUp ? "#253441" : "#B7BBC0"
          }} />
            <div style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: isSignUp ? "#B7BBC0" : "#253441"
          }} />
          </div>

          {/* Link para área do paciente */}
          <div style={{
            marginTop: "30px",
            paddingTop: "20px",
            borderTop: "1px solid #253441",
            textAlign: "center"
          }}>
            <Link 
              to="/patient/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#B7BBC0",
                fontSize: "13px",
                fontFamily: "Inter, sans-serif",
                textDecoration: "none",
                padding: "10px 20px",
                borderRadius: "20px",
                backgroundColor: "rgba(121, 185, 151, 0.1)",
                border: "1px solid rgba(121, 185, 151, 0.3)",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "rgba(121, 185, 151, 0.2)";
                e.currentTarget.style.borderColor = "rgba(121, 185, 151, 0.5)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "rgba(121, 185, 151, 0.1)";
                e.currentTarget.style.borderColor = "rgba(121, 185, 151, 0.3)";
              }}
            >
              <User style={{ width: "16px", height: "16px", color: "#79B997" }} />
              <span>Sou Paciente</span>
            </Link>
          </div>
        </div>
      </div>
    </div>;
}