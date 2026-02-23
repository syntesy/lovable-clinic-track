import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const AcademyPrivacyPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-6">Política de Privacidade — REGHEN Academy</h1>
        <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
          <h2 className="text-foreground">1. Dados Coletados</h2>
          <p>Coletamos informações necessárias para o funcionamento da plataforma: nome, e-mail, dados de pagamento (processados pelo Stripe) e dados de progresso nas aulas.</p>

          <h2 className="text-foreground">2. Uso dos Dados</h2>
          <p>Seus dados são utilizados para: autenticação, processamento de pagamentos, controle de acesso ao conteúdo, acompanhamento de progresso e comunicações sobre seus produtos.</p>

          <h2 className="text-foreground">3. Compartilhamento</h2>
          <p>Não compartilhamos dados pessoais com terceiros, exceto com o Stripe para processamento de pagamentos. Professores têm acesso limitado a informações de alunos matriculados em seus cursos.</p>

          <h2 className="text-foreground">4. Segurança</h2>
          <p>Utilizamos criptografia, autenticação segura e políticas de acesso restrito (RLS) para proteger seus dados. Vídeos são entregues via URLs temporárias com expiração curta.</p>

          <h2 className="text-foreground">5. Seus Direitos</h2>
          <p>Conforme a LGPD, você pode solicitar acesso, correção ou exclusão de seus dados pessoais a qualquer momento, entrando em contato conosco.</p>

          <h2 className="text-foreground">6. Cookies</h2>
          <p>Utilizamos cookies essenciais para autenticação e funcionamento da plataforma.</p>

          <h2 className="text-foreground">7. Contato</h2>
          <p>Para dúvidas sobre privacidade, entre em contato através do suporte da plataforma.</p>

          <p className="text-xs text-muted-foreground mt-8">Última atualização: Fevereiro 2026</p>
        </div>
      </div>
    </div>
  );
};

export default AcademyPrivacyPage;
