import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Shield, CreditCard, Check, ArrowLeft } from "lucide-react";
import logoRegenapp from "@/assets/logo-regenapp.png";

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Básico",
    price: 97,
    period: "/mês",
    features: [
      "Até 30 pacientes ativos",
      "Prontuário eletrônico",
      "Protocolos básicos",
      "Suporte por email"
    ]
  },
  {
    id: "premium",
    name: "Premium",
    price: 197,
    period: "/mês",
    features: [
      "Até 100 pacientes ativos",
      "Todos os protocolos",
      "Score Clínico FisioRegen",
      "Triagem Biológica",
      "Área do Paciente",
      "Suporte prioritário"
    ],
    popular: true
  },
  {
    id: "pro",
    name: "Profissional",
    price: 347,
    period: "/mês",
    features: [
      "Pacientes ilimitados",
      "Todas as funcionalidades",
      "Curadoria Científica",
      "Agente MAC com IA",
      "Relatórios avançados",
      "API de integração",
      "Suporte dedicado"
    ]
  }
];

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string>("premium");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"plan" | "payment">("plan");
  
  // Payment form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  const selectedPlanData = PLANS.find(p => p.id === selectedPlan);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast({
      title: "Pagamento processado!",
      description: "Sua assinatura foi ativada com sucesso."
    });

    setLoading(false);
    navigate("/pacientes");
  };

  return (
    <div
      style={{
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
        overflow: "auto",
        zIndex: 9999
      }}
    >
      {/* Overlay sutil para profundidade */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(27, 38, 54, 0.5) 100%)",
          pointerEvents: "none"
        }}
      />

      {/* Container do card */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 10,
          padding: "40px 20px",
          width: "100%",
          maxWidth: step === "plan" ? "1000px" : "520px"
        }}
      >
        {/* Card glassmorphism */}
        <div
          style={{
            width: "100%",
            backgroundColor: "rgba(27, 38, 54, 0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "24px",
            padding: "40px",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4)",
            border: "1px solid #253441"
          }}
        >
          {/* Botão voltar */}
          <Link
            to={step === "payment" ? "#" : "/auth"}
            onClick={(e) => {
              if (step === "payment") {
                e.preventDefault();
                setStep("plan");
              }
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "#B7BBC0",
              fontSize: "14px",
              textDecoration: "none",
              marginBottom: "20px",
              fontFamily: "Inter, sans-serif"
            }}
          >
            <ArrowLeft style={{ width: "16px", height: "16px" }} />
            {step === "payment" ? "Voltar aos planos" : "Voltar ao login"}
          </Link>

          {/* Logo */}
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "30px"
            }}
          >
            <img
              src={logoRegenapp}
              alt="REGENAPP"
              style={{
                width: "200px",
                height: "auto",
                objectFit: "contain"
              }}
            />
          </div>

          {/* Título */}
          <h1
            style={{
              color: "#FEFEFE",
              fontSize: "24px",
              fontWeight: 600,
              letterSpacing: "3px",
              textAlign: "center",
              marginBottom: "10px",
              fontFamily: "Inter, sans-serif"
            }}
          >
            {step === "plan" ? "ESCOLHA SEU PLANO" : "PAGAMENTO"}
          </h1>

          <p
            style={{
              color: "#B7BBC0",
              fontSize: "14px",
              textAlign: "center",
              marginBottom: "30px",
              fontFamily: "Inter, sans-serif"
            }}
          >
            {step === "plan"
              ? "Selecione o plano ideal para sua prática clínica"
              : "Finalize sua assinatura de forma segura"}
          </p>

          {/* Badge de segurança */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "30px",
              padding: "8px 16px",
              backgroundColor: "#293E48",
              borderRadius: "20px",
              border: "1px solid #253441",
              width: "fit-content",
              margin: "0 auto 30px"
            }}
          >
            <Shield
              style={{
                width: "14px",
                height: "14px",
                color: "#79B997"
              }}
            />
            <span
              style={{
                color: "#B7BBC0",
                fontSize: "11px",
                fontFamily: "Inter, sans-serif"
              }}
            >
              Pagamento 100% seguro
            </span>
          </div>

          {step === "plan" ? (
            /* Seleção de planos */
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px",
                marginBottom: "30px"
              }}
            >
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  style={{
                    position: "relative",
                    backgroundColor:
                      selectedPlan === plan.id
                        ? "rgba(121, 185, 151, 0.15)"
                        : "rgba(37, 52, 65, 0.5)",
                    border:
                      selectedPlan === plan.id
                        ? "2px solid #79B997"
                        : "1px solid #253441",
                    borderRadius: "16px",
                    padding: "24px",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  {plan.popular && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-10px",
                        right: "20px",
                        backgroundColor: "#79B997",
                        color: "#FEFEFE",
                        fontSize: "10px",
                        fontWeight: 600,
                        padding: "4px 12px",
                        borderRadius: "10px",
                        fontFamily: "Inter, sans-serif"
                      }}
                    >
                      MAIS POPULAR
                    </div>
                  )}

                  <h3
                    style={{
                      color: "#FEFEFE",
                      fontSize: "18px",
                      fontWeight: 600,
                      marginBottom: "8px",
                      fontFamily: "Inter, sans-serif"
                    }}
                  >
                    {plan.name}
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      marginBottom: "20px"
                    }}
                  >
                    <span
                      style={{
                        color: "#79B997",
                        fontSize: "36px",
                        fontWeight: 700,
                        fontFamily: "Inter, sans-serif"
                      }}
                    >
                      R$ {plan.price}
                    </span>
                    <span
                      style={{
                        color: "#B7BBC0",
                        fontSize: "14px",
                        fontFamily: "Inter, sans-serif"
                      }}
                    >
                      {plan.period}
                    </span>
                  </div>

                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {plan.features.map((feature, idx) => (
                      <li
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "10px",
                          color: "#B7BBC0",
                          fontSize: "13px",
                          fontFamily: "Inter, sans-serif"
                        }}
                      >
                        <Check
                          style={{
                            width: "16px",
                            height: "16px",
                            color: "#79B997",
                            flexShrink: 0
                          }}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {selectedPlan === plan.id && (
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        left: "12px",
                        width: "24px",
                        height: "24px",
                        backgroundColor: "#79B997",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Check
                        style={{
                          width: "14px",
                          height: "14px",
                          color: "#FEFEFE"
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Formulário de pagamento */
            <form onSubmit={handleSubmit}>
              {/* Resumo do plano selecionado */}
              <div
                style={{
                  backgroundColor: "rgba(37, 52, 65, 0.5)",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "25px",
                  border: "1px solid #253441"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <p
                      style={{
                        color: "#B7BBC0",
                        fontSize: "12px",
                        marginBottom: "4px",
                        fontFamily: "Inter, sans-serif"
                      }}
                    >
                      Plano selecionado
                    </p>
                    <p
                      style={{
                        color: "#FEFEFE",
                        fontSize: "16px",
                        fontWeight: 600,
                        fontFamily: "Inter, sans-serif"
                      }}
                    >
                      {selectedPlanData?.name}
                    </p>
                  </div>
                  <p
                    style={{
                      color: "#79B997",
                      fontSize: "20px",
                      fontWeight: 700,
                      fontFamily: "Inter, sans-serif"
                    }}
                  >
                    R$ {selectedPlanData?.price}
                    <span style={{ fontSize: "12px", color: "#B7BBC0" }}>
                      /mês
                    </span>
                  </p>
                </div>
              </div>

              {/* Campo Número do Cartão */}
              <div style={{ marginBottom: "25px" }}>
                <label
                  style={{
                    display: "block",
                    color: "#FEFEFE",
                    fontSize: "14px",
                    fontWeight: 500,
                    marginBottom: "8px",
                    fontFamily: "Inter, sans-serif"
                  }}
                >
                  Número do Cartão
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) =>
                      setCardNumber(formatCardNumber(e.target.value))
                    }
                    maxLength={19}
                    required
                    style={{
                      width: "100%",
                      backgroundColor: "transparent",
                      border: "none",
                      borderBottom: "1px solid #253441",
                      padding: "12px 40px 12px 0",
                      color: "#FEFEFE",
                      fontSize: "14px",
                      outline: "none",
                      fontFamily: "Inter, sans-serif"
                    }}
                  />
                  <CreditCard
                    style={{
                      position: "absolute",
                      right: "0",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "20px",
                      height: "20px",
                      color: "#B7BBC0"
                    }}
                  />
                </div>
              </div>

              {/* Campo Nome no Cartão */}
              <div style={{ marginBottom: "25px" }}>
                <label
                  style={{
                    display: "block",
                    color: "#FEFEFE",
                    fontSize: "14px",
                    fontWeight: 500,
                    marginBottom: "8px",
                    fontFamily: "Inter, sans-serif"
                  }}
                >
                  Nome no Cartão
                </label>
                <input
                  type="text"
                  placeholder="Como está no cartão"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  required
                  style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    border: "none",
                    borderBottom: "1px solid #253441",
                    padding: "12px 0",
                    color: "#FEFEFE",
                    fontSize: "14px",
                    outline: "none",
                    fontFamily: "Inter, sans-serif"
                  }}
                />
              </div>

              {/* Validade e CVV */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                  marginBottom: "30px"
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#FEFEFE",
                      fontSize: "14px",
                      fontWeight: 500,
                      marginBottom: "8px",
                      fontFamily: "Inter, sans-serif"
                    }}
                  >
                    Validade
                  </label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    value={expiryDate}
                    onChange={(e) =>
                      setExpiryDate(formatExpiryDate(e.target.value))
                    }
                    maxLength={5}
                    required
                    style={{
                      width: "100%",
                      backgroundColor: "transparent",
                      border: "none",
                      borderBottom: "1px solid #253441",
                      padding: "12px 0",
                      color: "#FEFEFE",
                      fontSize: "14px",
                      outline: "none",
                      fontFamily: "Inter, sans-serif"
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#FEFEFE",
                      fontSize: "14px",
                      fontWeight: 500,
                      marginBottom: "8px",
                      fontFamily: "Inter, sans-serif"
                    }}
                  >
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) =>
                      setCvv(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    maxLength={4}
                    required
                    style={{
                      width: "100%",
                      backgroundColor: "transparent",
                      border: "none",
                      borderBottom: "1px solid #253441",
                      padding: "12px 0",
                      color: "#FEFEFE",
                      fontSize: "14px",
                      outline: "none",
                      fontFamily: "Inter, sans-serif"
                    }}
                  />
                </div>
              </div>

              {/* Botão de pagamento */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  height: "52px",
                  backgroundColor: "#79B997",
                  border: "none",
                  borderRadius: "26px",
                  color: "#FEFEFE",
                  fontSize: "16px",
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  transition: "all 0.2s ease",
                  fontFamily: "Inter, sans-serif",
                  boxShadow: "0 4px 20px rgba(121, 185, 151, 0.3)"
                }}
              >
                {loading ? "Processando..." : `Pagar R$ ${selectedPlanData?.price}/mês`}
              </button>
            </form>
          )}

          {/* Botão continuar (apenas na seleção de planos) */}
          {step === "plan" && (
            <button
              onClick={() => setStep("payment")}
              style={{
                width: "100%",
                height: "52px",
                backgroundColor: "#79B997",
                border: "none",
                borderRadius: "26px",
                color: "#FEFEFE",
                fontSize: "16px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "Inter, sans-serif",
                boxShadow: "0 4px 20px rgba(121, 185, 151, 0.3)"
              }}
            >
              Continuar com {selectedPlanData?.name} - R$ {selectedPlanData?.price}/mês
            </button>
          )}

          {/* Indicador de etapa */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "8px",
              marginTop: "25px"
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: step === "plan" ? "#79B997" : "#253441"
              }}
            />
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: step === "payment" ? "#79B997" : "#253441"
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
