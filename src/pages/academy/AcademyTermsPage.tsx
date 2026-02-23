import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const AcademyTermsPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-6">Termos de Uso — REGHEN Academy</h1>
        <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
          <h2 className="text-foreground">1. Aceitação dos Termos</h2>
          <p>Ao acessar e utilizar a plataforma REGHEN Academy, você concorda com estes termos de uso. Caso não concorde, não utilize a plataforma.</p>

          <h2 className="text-foreground">2. Conta de Usuário</h2>
          <p>Você é responsável por manter a confidencialidade de suas credenciais de acesso. Cada conta é pessoal e intransferível.</p>

          <h2 className="text-foreground">3. Conteúdo e Propriedade Intelectual</h2>
          <p>Todo conteúdo disponibilizado na plataforma (vídeos, materiais, textos) é protegido por direitos autorais. É proibida a reprodução, distribuição ou compartilhamento sem autorização prévia do autor.</p>

          <h2 className="text-foreground">4. Uso Aceitável</h2>
          <p>O acesso aos conteúdos é exclusivamente para uso pessoal e educacional do comprador. É proibido compartilhar credenciais ou conteúdo com terceiros.</p>

          <h2 className="text-foreground">5. Pagamentos</h2>
          <p>Os pagamentos são processados de forma segura via Stripe. Os preços são exibidos em Reais (BRL) e incluem impostos quando aplicável.</p>

          <h2 className="text-foreground">6. Política de Reembolso</h2>
          <p>Consulte nossa <a href="/academy/reembolso" className="text-primary hover:underline">Política de Reembolso</a> para informações detalhadas.</p>

          <h2 className="text-foreground">7. Cancelamento</h2>
          <p>Assinaturas podem ser canceladas a qualquer momento. O acesso permanece ativo até o final do período pago.</p>

          <h2 className="text-foreground">8. Limitação de Responsabilidade</h2>
          <p>O conteúdo da plataforma possui caráter educacional e não substitui orientação profissional direta. A REGHEN Academy não se responsabiliza pelo uso clínico do conteúdo.</p>

          <h2 className="text-foreground">9. Alterações</h2>
          <p>Estes termos podem ser atualizados periodicamente. Alterações significativas serão comunicadas por e-mail.</p>

          <p className="text-xs text-muted-foreground mt-8">Última atualização: Fevereiro 2026</p>
        </div>
      </div>
    </div>
  );
};

export default AcademyTermsPage;
