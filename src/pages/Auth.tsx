import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/pacientes");
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url('/images/dna-login-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        zIndex: 9999,
      }}
    >
      {/* Overlay sutil para profundidade */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.3) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Container do card com avatar flutuante */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        {/* Avatar flutuante */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "-40px",
            zIndex: 20,
          }}
        >
          <User
            style={{
              width: "70px",
              height: "70px",
              color: "#5B7FFF",
            }}
            strokeWidth={1.5}
          />
        </div>

        {/* Card glassmorphism */}
        <div
          style={{
            width: "min(520px, 90vw)",
            backgroundColor: "rgba(20, 25, 40, 0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "24px",
            padding: "60px 50px 40px 50px",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          {/* Título LOG-IN */}
          <h1
            style={{
              color: "#FFFFFF",
              fontSize: "24px",
              fontWeight: 600,
              letterSpacing: "3px",
              textAlign: "center",
              marginBottom: "40px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            LOG-IN
          </h1>

          <form onSubmit={handleLogin}>
            {/* Campo Username */}
            <div style={{ marginBottom: "30px" }}>
              <label
                style={{
                  display: "block",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 500,
                  marginBottom: "8px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Username
              </label>
              <input
                type="email"
                placeholder="Who are you ?"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
                  padding: "12px 0",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  outline: "none",
                  fontFamily: "Inter, sans-serif",
                }}
              />
            </div>

            {/* Campo Password */}
            <div style={{ marginBottom: "35px" }}>
              <label
                style={{
                  display: "block",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 500,
                  marginBottom: "8px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Password
              </label>
              <input
                type="password"
                placeholder="Prove that it is true"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
                  padding: "12px 0",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  outline: "none",
                  fontFamily: "Inter, sans-serif",
                }}
              />
            </div>

            {/* Mensagem de erro */}
            {error && (
              <p
                style={{
                  color: "#FF6B6B",
                  fontSize: "12px",
                  textAlign: "center",
                  marginBottom: "15px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {error}
              </p>
            )}

            {/* Botão Login */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                height: "52px",
                backgroundColor: "#4A6CF7",
                border: "none",
                borderRadius: "26px",
                color: "#FFFFFF",
                fontSize: "16px",
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "all 0.2s ease",
                fontFamily: "Inter, sans-serif",
                boxShadow: "0 4px 20px rgba(74, 108, 247, 0.3)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = "#5B7FFF";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#4A6CF7";
              }}
            >
              {loading ? "Loading..." : "Login"}
            </button>
          </form>

          {/* Links do rodapé */}
          <div
            style={{
              marginTop: "25px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                color: "rgba(255, 255, 255, 0.5)",
                fontSize: "12px",
                cursor: "pointer",
                textAlign: "left",
                padding: 0,
                fontFamily: "Inter, sans-serif",
              }}
            >
              Lost your password?
            </button>
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                color: "rgba(255, 255, 255, 0.5)",
                fontSize: "12px",
                cursor: "pointer",
                textAlign: "left",
                padding: 0,
                fontFamily: "Inter, sans-serif",
              }}
            >
              Don't have an account?
            </button>
          </div>

          {/* Indicador de página (3 dots) */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "8px",
              marginTop: "30px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.3)",
              }}
            />
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.6)",
              }}
            />
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.3)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
