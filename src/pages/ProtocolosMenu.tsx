import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Activity, Syringe } from "lucide-react";

const ProtocolosMenu = () => {
  const navigate = useNavigate();

  const protocolOptions = [
    {
      title: "MAC",
      subtitle: "Método de Aceleração Cicatricial",
      description: "Protocolos de fotobiomodulação e terapia fotodinâmica",
      icon: Zap,
      path: "/protocolos/mac",
      color: "#2F3F6B",
    },
    {
      title: "EPI",
      subtitle: "Eletrólise Percutânea Intratecidual",
      description: "Protocolos de tratamento com eletrólise",
      icon: Activity,
      path: "/protocolos/epi",
      color: "#3D4F7C",
    },
    {
      title: "ORTOBIOLÓGICOS",
      subtitle: "Terapias Regenerativas",
      description: "Protocolos de PRP, BMA e BMAC",
      icon: Syringe,
      path: "/protocolos/ortobiologicos",
      color: "#4A5D8A",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          Protocolos
        </h2>
        <p className="text-muted-foreground">
          Selecione a área de tratamento para acessar os protocolos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {protocolOptions.map((option) => (
          <Card
            key={option.title}
            className="border-border cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
            onClick={() => navigate(option.path)}
          >
            <CardContent className="p-6">
              <div
                className="h-12 w-12 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: option.color }}
              >
                <option.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">
                {option.title}
              </h3>
              <p className="text-sm font-medium text-primary mb-2">
                {option.subtitle}
              </p>
              <p className="text-sm text-muted-foreground">
                {option.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProtocolosMenu;
