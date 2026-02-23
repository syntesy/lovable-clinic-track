import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const AcademyRefundPolicyPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-6">Política de Reembolso — REGHEN Academy</h1>
        <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
          <h2 className="text-foreground">Direito de Arrependimento (CDC)</h2>
          <p>De acordo com o Código de Defesa do Consumidor (Art. 49), você tem o direito de solicitar o reembolso integral de qualquer compra realizada na plataforma em até <strong>7 (sete) dias corridos</strong> após a data da compra.</p>

          <h2 className="text-foreground">Como Solicitar</h2>
          <p>O reembolso pode ser solicitado diretamente na seção <strong>"Minhas Compras"</strong> da plataforma. Dentro do prazo de 7 dias, um botão de reembolso estará disponível ao lado de cada compra.</p>

          <h2 className="text-foreground">Processamento</h2>
          <ul>
            <li>O reembolso é processado automaticamente via Stripe.</li>
            <li>O valor será estornado na mesma forma de pagamento utilizada na compra.</li>
            <li>O prazo de devolução pode variar de 5 a 10 dias úteis, dependendo da operadora do cartão.</li>
          </ul>

          <h2 className="text-foreground">Revogação de Acesso</h2>
          <p>Ao solicitar o reembolso, o acesso ao conteúdo será <strong>revogado imediatamente</strong>. Não será possível acessar aulas, materiais ou qualquer conteúdo associado ao produto reembolsado.</p>

          <h2 className="text-foreground">Após o Prazo de 7 Dias</h2>
          <p>Após o período de 7 dias, o reembolso não estará mais disponível de forma automática. Casos excepcionais poderão ser analisados individualmente pelo suporte da plataforma.</p>

          <h2 className="text-foreground">Assinaturas</h2>
          <p>Assinaturas podem ser canceladas a qualquer momento. Ao cancelar, o acesso permanece ativo até o final do período já pago. Não há reembolso proporcional do período em andamento.</p>

          <h2 className="text-foreground">Contato</h2>
          <p>Em caso de dúvidas, entre em contato pelo suporte da plataforma.</p>

          <p className="text-xs text-muted-foreground mt-8">Última atualização: Fevereiro 2026</p>
        </div>
      </div>
    </div>
  );
};

export default AcademyRefundPolicyPage;
