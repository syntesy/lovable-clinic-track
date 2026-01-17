import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, User, AlertTriangle } from "lucide-react";
import { useAuditLog } from "@/hooks/useAuditLog";
import logoReghen from "@/assets/logo-reghen.png";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { validateSignup, loginSchema } from "@/lib/password-validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logLogin } = useAuditLog();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockoutMessage, setLockoutMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

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
        if (data.lockoutEndsAt) {
          setLockoutMessage(data.message);
        } else if (data.remainingAttempts !== undefined && data.remainingAttempts <= 2 && data.message !== 'OK') {
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

    if (lockoutMessage) {
      setError(lockoutMessage);
      setLoading(false);
      return;
    }

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
      // Always show environment selection after login
      navigate("/select-environment");
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">

      {/* Card container */}
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Glassmorphism Card */}
        <Card className="w-full bg-card border-border shadow-lg rounded-2xl">
          <CardContent className="p-10 sm:px-12">
            {/* Logo */}
            <div className="w-full flex items-center justify-center mb-8">
              <img 
                src={logoReghen} 
                alt="reghen" 
                className="w-[280px] h-auto object-contain"
              />
            </div>

            {/* Title */}
            <h1 className="text-foreground text-2xl font-semibold tracking-[3px] text-center mb-8">
              {isSignUp ? "CADASTRO" : "LOG-IN"}
            </h1>

            {/* LGPD Badge */}
            <div className="flex items-center justify-center mb-8">
              <Badge variant="secondary" className="gap-2 px-4 py-2 bg-accent border-border">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span className="text-muted-foreground text-xs">Conformidade LGPD</span>
              </Badge>
            </div>

            {/* Lockout Warning */}
            {lockoutMessage && (
              <Alert variant="destructive" className="mb-5 bg-destructive/10 border-destructive/30">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-destructive text-sm">
                  {lockoutMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Remaining Attempts Warning */}
            {!lockoutMessage && remainingAttempts !== null && remainingAttempts < 5 && (
              <Alert className="mb-5 bg-warning/10 border-warning/30">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-warning text-sm">
                  {remainingAttempts} tentativa(s) restante(s)
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-6">
              {/* Name Field (signup only) */}
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-foreground">
                    Nome Completo
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome completo"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    className={`bg-secondary/50 border-border rounded-full px-4 py-3 h-12 text-foreground placeholder:text-muted-foreground ${
                      fieldErrors.fullName ? 'border-destructive' : ''
                    }`}
                  />
                  {fieldErrors.fullName && (
                    <span className="text-destructive text-xs">
                      {fieldErrors.fullName[0]}
                    </span>
                  )}
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="username"
                  inputMode="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className={`bg-secondary/50 border-border rounded-full px-4 py-3 h-12 text-foreground placeholder:text-muted-foreground ${
                    fieldErrors.email ? 'border-destructive' : ''
                  }`}
                />
                {fieldErrors.email && (
                  <span className="text-destructive text-xs">
                    {fieldErrors.email[0]}
                  </span>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  placeholder={isSignUp ? "Mín. 8 caracteres, maiúscula, número e símbolo" : "Sua senha"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={isSignUp ? 8 : 1}
                  className={`bg-secondary/50 border-border rounded-full px-4 py-3 h-12 text-foreground placeholder:text-muted-foreground ${
                    fieldErrors.password ? 'border-destructive' : ''
                  }`}
                />
                {isSignUp && <PasswordStrengthIndicator password={password} />}
                {fieldErrors.password && (
                  <span className="text-destructive text-xs">
                    {fieldErrors.password[0]}
                  </span>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-destructive text-sm text-center">
                  {error}
                </p>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !!lockoutMessage}
                className="w-full h-13 rounded-full text-base font-medium shadow-lg disabled:opacity-70"
                style={{
                  backgroundColor: lockoutMessage ? 'hsl(var(--muted))' : 'hsl(var(--primary))',
                  boxShadow: lockoutMessage ? 'none' : '0 4px 20px hsl(var(--primary) / 0.3)'
                }}
              >
                {loading ? "Aguarde..." : lockoutMessage ? "Bloqueado" : isSignUp ? "Cadastrar" : "Entrar"}
              </Button>
            </form>

            {/* Toggle Login/Signup */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                  setFieldErrors({});
                }}
                className="text-muted-foreground text-sm hover:text-foreground transition-colors underline"
              >
                {isSignUp ? "Já tem conta? Faça login" : "Não tem conta? Cadastre-se"}
              </button>
            </div>

            {/* Page Indicator Dots */}
            <div className="flex justify-center gap-2 mt-6">
              <div className={`w-2 h-2 rounded-full transition-colors ${
                isSignUp ? 'bg-border' : 'bg-muted-foreground'
              }`} />
              <div className={`w-2 h-2 rounded-full transition-colors ${
                isSignUp ? 'bg-muted-foreground' : 'bg-border'
              }`} />
            </div>

            {/* Patient Portal Link */}
            <div className="mt-8 pt-6 border-t border-border text-center">
              <Link 
                to="/patient/login"
                className="inline-flex items-center gap-2 text-muted-foreground text-sm px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30 hover:bg-primary/20 hover:border-primary/50 transition-all"
              >
                <User className="w-4 h-4 text-primary" />
                <span>Sou Paciente</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
