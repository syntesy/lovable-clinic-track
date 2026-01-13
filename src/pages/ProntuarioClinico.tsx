/**
 * ProntuarioClinico - Página LEGADA
 * 
 * AVISO: Esta página está DEPRECADA.
 * Use o novo fluxo: /patients/:patientId/records (lista) → /patients/:patientId/records/:recordId (editor)
 * 
 * Esta página redireciona automaticamente para a lista de prontuários.
 */

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const ProntuarioClinico = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      console.log("[ProntuarioClinico] Redirecting to new records list:", id);
      // Redirecionar para a nova lista de prontuários
      navigate(`/patients/${id}/records`, { replace: true });
    }
  }, [id, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Redirecionando para prontuários...</p>
      </div>
    </div>
  );
};

export default ProntuarioClinico;
