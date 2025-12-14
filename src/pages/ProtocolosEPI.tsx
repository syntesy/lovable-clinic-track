import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

const ProtocolosEPI = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          Protocolos EPI
        </h2>
        <p className="text-muted-foreground">
          Protocolos de Eletrólise Percutânea Intratecidual
        </p>
      </div>

      <Card className="p-12 text-center border-border">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Em desenvolvimento
        </h3>
        <p className="text-muted-foreground">
          Os protocolos EPI serão disponibilizados em breve
        </p>
      </Card>
    </div>
  );
};

export default ProtocolosEPI;
