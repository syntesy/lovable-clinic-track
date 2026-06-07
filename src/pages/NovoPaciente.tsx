import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Loader2, Search } from "lucide-react";
import { PatientPhotoUpload } from "@/components/PatientPhotoUpload";
import LGPDConsentForm, { CONSENT_TEXT } from "@/components/LGPDConsentForm";
import { useAuditLog } from "@/hooks/useAuditLog";

// ─── Helpers de máscara ───────────────────────────────────────────────────────

function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskCpf(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function maskCep(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

// ─── Seletor de data de nascimento ───────────────────────────────────────────

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function BirthDatePicker({
  value,
  onChange,
}: {
  value: string; // YYYY-MM-DD
  onChange: (v: string) => void;
}) {
  const parts = value ? value.split("-") : ["", "", ""];
  const year = parts[0] ?? "";
  const month = parts[1] ?? "";
  const day = parts[2] ?? "";

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => currentYear - i);

  const daysInMonth = year && month
    ? new Date(Number(year), Number(month), 0).getDate()
    : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function emit(y: string, m: string, d: string) {
    if (y && m && d) {
      onChange(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
    } else {
      onChange("");
    }
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <div>
        <Select value={day} onValueChange={(v) => emit(year, month, v)}>
          <SelectTrigger className="border-input">
            <SelectValue placeholder="Dia" />
          </SelectTrigger>
          <SelectContent className="max-h-48 overflow-y-auto">
            {days.map((d) => (
              <SelectItem key={d} value={String(d)}>
                {String(d).padStart(2, "0")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Select value={month} onValueChange={(v) => emit(year, v, day)}>
          <SelectTrigger className="border-input">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Select value={year} onValueChange={(v) => emit(v, month, day)}>
          <SelectTrigger className="border-input">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent className="max-h-48 overflow-y-auto">
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

type Stage = "consent" | "form";

const NovoPaciente = () => {
  const navigate = useNavigate();
  const { logConsentAccepted } = useAuditLog();

  // ── Fluxo de consentimento LGPD (Step 1) ───────────────────────────────────
  const [stage, setStage] = useState<Stage>("consent");
  const [pendingConsents, setPendingConsents] = useState<Record<string, boolean>>({});

  function handleConsentCollected(items: Record<string, boolean>) {
    setPendingConsents(items);
  }

  function handleConsentAccepted() {
    setStage("form");
  }

  // Dados básicos
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState(""); // YYYY-MM-DD
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Endereço
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  // ── Busca de CEP ────────────────────────────────────────────────────────────
  async function fetchCep(rawCep: string) {
    const digits = rawCep.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setIsFetchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();

      if (data.erro) {
        toast.error("CEP não encontrado. Preencha o endereço manualmente.");
        return;
      }

      setRua(data.logradouro ?? "");
      setBairro(data.bairro ?? "");
      setCidade(data.localidade ?? "");
      setEstado(data.uf ?? "");
    } catch {
      toast.error("Não foi possível buscar o CEP. Preencha o endereço manualmente.");
    } finally {
      setIsFetchingCep(false);
    }
  }

  function handleCepChange(raw: string) {
    const masked = maskCep(raw);
    setCep(masked);
    if (raw.replace(/\D/g, "").length === 8) {
      fetchCep(raw);
    }
  }

  // ── Cálculo de idade ────────────────────────────────────────────────────────
  function calcAge(dateStr: string): number | null {
    if (!dateStr) return null;
    const birth = new Date(dateStr);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 0 ? age : null;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Informe o nome completo do paciente.");
      return;
    }

    setIsSubmitting(true);
    try {
      const addressParts = [rua, numero, bairro, cidade, estado]
        .filter(Boolean)
        .join(", ");

      const age = calcAge(birthDate);

      // 1. Criar paciente e obter o ID gerado
      const { data: patientData, error } = await supabase
        .from("patients")
        .insert([
          {
            full_name: fullName.trim(),
            age,
            gender: gender || null,
            birth_date: birthDate || null,
            phone: phone || null,
            email: email || null,
            cpf: cpf || null,
            address: addressParts || null,
            photo_url: photoUrl,
          },
        ])
        .select("id")
        .single();

      if (error) throw error;

      const patientId = patientData.id;

      // 2. Gravar consentimentos LGPD coletados na Etapa 1
      const { data: { user } } = await supabase.auth.getUser();
      const consentsToInsert = Object.entries(pendingConsents)
        .filter(([, accepted]) => accepted)
        .map(([itemId]) => ({
          patient_id: patientId,
          consent_type: itemId,
          consent_text: CONSENT_TEXT,
          accepted: true,
          accepted_at: new Date().toISOString(),
          user_agent: navigator.userAgent,
          witness_user_id: user?.id,
        }));

      const { error: consentError } = await supabase
        .from("patient_consents")
        .insert(consentsToInsert);

      if (consentError) {
        // ALERTA GRITANTE — paciente existe mas sem consentimento gravado.
        // O toast persistente garante que ninguém ignore o gap.
        toast.error(
          "Paciente cadastrado, mas o consentimento LGPD NÃO foi salvo. " +
          "Registre o consentimento novamente antes de prosseguir.",
          { duration: Infinity }
        );
        navigate("/pacientes");
        return;
      }

      // 3. Registrar log de auditoria do consentimento
      await logConsentAccepted(patientId, "LGPD_FULL_CONSENT");

      toast.success("Paciente cadastrado com sucesso!");
      navigate("/pacientes");
    } catch (error) {
      console.error("Erro ao cadastrar paciente:", error);
      toast.error("Erro ao cadastrar paciente");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Etapa 1: Consentimento LGPD (gate antes dos dados do paciente) ──────────
  if (stage === "consent") {
    return (
      <LGPDConsentForm
        onConsentAccepted={handleConsentAccepted}
        onConsentCollected={handleConsentCollected}
        onCancel={() => navigate("/pacientes")}
      />
    );
  }

  // ── Etapa 2: Dados do Paciente ──────────────────────────────────────────────
  return (
    <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 md:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/pacientes")}
          className="flex-shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h2 className="text-xl md:text-3xl font-bold text-foreground truncate">
            Novo Paciente
          </h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Cadastro de dados demográficos
          </p>
        </div>
      </div>

      {/* Indicador de progresso */}
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-1.5 text-green-500">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-medium">Consentimento LGPD</span>
        </div>
        <div className="h-px flex-1 bg-border" />
        <div className="flex items-center gap-1.5 text-primary font-medium">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">2</span>
          <span>Dados do Paciente</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Dados Cadastrais ── */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Dados Cadastrais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Foto */}
            <div className="flex justify-center pb-4 border-b border-border">
              <PatientPhotoUpload
                photoUrl={photoUrl}
                onPhotoChange={setPhotoUrl}
                patientName={fullName}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="border-input"
                  placeholder="Nome completo do paciente"
                />
              </div>

              {/* Data de Nascimento */}
              <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <BirthDatePicker value={birthDate} onChange={setBirthDate} />
              </div>

              {/* Gênero */}
              <div className="space-y-2">
                <Label htmlFor="gender">Gênero</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="gender" className="border-input">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  placeholder="(62) 99999-9999"
                  className="border-input"
                  inputMode="numeric"
                />
              </div>

              {/* E-mail */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-input"
                  placeholder="email@exemplo.com"
                />
              </div>

              {/* CPF */}
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={cpf}
                  onChange={(e) => setCpf(maskCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className="border-input"
                  inputMode="numeric"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Endereço ── */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CEP */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="relative">
                  <Input
                    id="cep"
                    value={cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    className="border-input pr-8"
                    inputMode="numeric"
                    maxLength={9}
                  />
                  {isFetchingCep && (
                    <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {!isFetchingCep && (
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Preenchimento automático ao digitar
                </p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="rua">Rua / Logradouro</Label>
                <Input
                  id="rua"
                  value={rua}
                  onChange={(e) => setRua(e.target.value)}
                  placeholder="Nome da rua"
                  className="border-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="Nº"
                  className="border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  placeholder="Bairro"
                  className="border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Cidade"
                  className="border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado (UF)</Label>
                <Input
                  id="estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="UF"
                  className="border-input"
                  maxLength={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 md:gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/pacientes")}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Cadastrar Paciente"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NovoPaciente;
