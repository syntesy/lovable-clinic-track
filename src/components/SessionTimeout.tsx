import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuditLog } from "@/hooks/useAuditLog";

interface SessionTimeoutProps {
  timeoutMinutes?: number;
  warningMinutes?: number;
  children: React.ReactNode;
}

export default function SessionTimeout({
  timeoutMinutes = 30,
  warningMinutes = 5,
  children,
}: SessionTimeoutProps) {
  const navigate = useNavigate();
  const { logLogout, logSessionEnd } = useAuditLog();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(warningMinutes * 60);
  const [isLocked, setIsLocked] = useState(false);
  
  const timeoutRef = useRef<number | null>(null);
  const warningRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const sessionStartRef = useRef<number>(Date.now());
  const lastActivityRef = useRef<number>(Date.now());
  // Refs para leitura sem adicionar às dependências do useEffect de atividade
  const showWarningRef = useRef(false);
  const isLockedRef = useRef(false);

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = warningMinutes * 60 * 1000;

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    if (warningRef.current) window.clearTimeout(warningRef.current);
    if (countdownRef.current) window.clearInterval(countdownRef.current);
  }, []);

  const handleLogout = useCallback(async (reason: string) => {
    clearAllTimers();
    
    const sessionDuration = Math.floor((Date.now() - sessionStartRef.current) / 1000);
    await logSessionEnd(sessionDuration);
    await logLogout();
    
    await supabase.auth.signOut();
    toast.info(reason);
    navigate("/auth");
  }, [clearAllTimers, logLogout, logSessionEnd, navigate]);

  const handleTimeout = useCallback(() => {
    handleLogout("Sessão expirada por inatividade. Faça login novamente.");
  }, [handleLogout]);

  const showTimeoutWarning = useCallback(() => {
    setShowWarning(true);
    setRemainingTime(warningMinutes * 60);
    
    countdownRef.current = window.setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleTimeout, warningMinutes]);

  const resetTimers = useCallback(() => {
    lastActivityRef.current = Date.now();
    clearAllTimers();
    setShowWarning(false);
    
    // Timer para mostrar aviso
    warningRef.current = window.setTimeout(() => {
      showTimeoutWarning();
    }, timeoutMs - warningMs);

    // Timer para logout automático
    timeoutRef.current = window.setTimeout(() => {
      handleTimeout();
    }, timeoutMs);
  }, [clearAllTimers, handleTimeout, showTimeoutWarning, timeoutMs, warningMs]);

  const extendSession = useCallback(() => {
    setShowWarning(false);
    if (countdownRef.current) window.clearInterval(countdownRef.current);
    resetTimers();
    toast.success("Sessão estendida");
  }, [resetTimers]);

  const lockScreen = useCallback(() => {
    setIsLocked(true);
    setShowWarning(false);
    clearAllTimers();
  }, [clearAllTimers]);

  const unlockScreen = useCallback(async (password: string) => {
    // Verificar senha (reautenticação)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return false;

    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (error) {
      toast.error("Senha incorreta");
      return false;
    }

    setIsLocked(false);
    resetTimers();
    toast.success("Tela desbloqueada");
    return true;
  }, [resetTimers]);

  // Mantém refs sincronizadas sem re-executar o efeito de atividade
  useEffect(() => { showWarningRef.current = showWarning; }, [showWarning]);
  useEffect(() => { isLockedRef.current = isLocked; }, [isLocked]);

  // Eventos de atividade do usuário
  useEffect(() => {
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      // Usa refs para não recriar este efeito quando o diálogo abre/fecha
      if (!showWarningRef.current && !isLockedRef.current) {
        const now = Date.now();
        // Só reseta se passou mais de 1 segundo desde a última atividade
        if (now - lastActivityRef.current > 1000) {
          resetTimers();
        }
      }
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Iniciar timers na montagem
    resetTimers();

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearAllTimers();
    };
  }, [resetTimers, clearAllTimers]);

  // Detectar fechamento da aba/navegador
  useEffect(() => {
    const handleBeforeUnload = () => {
      const sessionDuration = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      // Usar sendBeacon para garantir que o log seja enviado
      navigator.sendBeacon?.(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/audit_logs`,
        JSON.stringify({
          action: "SESSION_END",
          additional_info: { duration_seconds: sessionDuration, reason: "tab_close" },
        })
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLocked) {
    return (
      <LockScreen onUnlock={unlockScreen} onLogout={() => handleLogout("Sessão encerrada")} />
    );
  }

  return (
    <>
      {children}
      
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-600">
              ⚠️ Sessão Prestes a Expirar
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Sua sessão será encerrada automaticamente em{" "}
                <span className="font-bold text-destructive">{formatTime(remainingTime)}</span>
              </p>
              <p className="text-sm">
                Clique em "Continuar" para manter sua sessão ativa ou "Bloquear Tela" para proteger seus dados.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={lockScreen} className="sm:mr-auto">
              Bloquear Tela
            </AlertDialogCancel>
            <AlertDialogAction onClick={extendSession} className="bg-primary">
              Continuar Trabalhando
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Componente de tela bloqueada
interface LockScreenProps {
  onUnlock: (password: string) => Promise<boolean>;
  onLogout: () => void;
}

function LockScreen({ onUnlock, onLogout }: LockScreenProps) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onUnlock(password);
    setIsLoading(false);
    setPassword("");
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4 p-8 bg-card rounded-lg border shadow-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Tela Bloqueada</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Digite sua senha para desbloquear
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full px-4 py-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
            autoFocus
          />
          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? "Verificando..." : "Desbloquear"}
          </button>
        </form>

        <button
          onClick={onLogout}
          className="w-full mt-4 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}
