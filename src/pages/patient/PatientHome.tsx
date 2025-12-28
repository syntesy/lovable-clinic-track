import { useNavigate } from 'react-router-dom';
import { usePatientAuth } from '@/contexts/PatientAuthContext';
import { PatientLayout } from '@/components/patient/PatientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Pill, ShoppingBag, AlertTriangle } from 'lucide-react';

export default function PatientHome() {
  const { session } = usePatientAuth();
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Meus Relatórios',
      description: 'Visualize os relatórios clínicos liberados pelo seu profissional',
      icon: FileText,
      path: '/patient/reports',
      color: 'text-blue-500'
    },
    {
      title: 'Minhas Prescrições',
      description: 'Acesse orientações alimentares, medicamentosas e suplementares',
      icon: Pill,
      path: '/patient/prescriptions',
      color: 'text-green-500'
    },
    {
      title: 'Parceiros e Suplementos',
      description: 'Descontos exclusivos em produtos recomendados',
      icon: ShoppingBag,
      path: '/patient/partners',
      color: 'text-purple-500'
    }
  ];

  return (
    <PatientLayout>
      <div className="space-y-6">
        {/* Welcome Message */}
        <div className="text-center py-6">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Bem-vindo(a), {session?.patientName?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Aqui você pode consultar os relatórios e orientações liberados pelo seu profissional de saúde.
          </p>
        </div>

        {/* Warning Alert */}
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            O REGENAPP não substitui a orientação do seu profissional de saúde.
          </AlertDescription>
        </Alert>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Card 
                key={card.path}
                className="cursor-pointer hover:shadow-md transition-shadow border-border/50"
                onClick={() => navigate(card.path)}
              >
                <CardHeader className="pb-3">
                  <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{card.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </PatientLayout>
  );
}
