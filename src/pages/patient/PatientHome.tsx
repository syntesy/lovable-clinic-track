import { useNavigate } from 'react-router-dom';
import { usePatientAuth } from '@/contexts/PatientAuthContext';
import { PatientLayout } from '@/components/patient/PatientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ClipboardCheck, ArrowRight } from 'lucide-react';

export default function PatientHome() {
  const { session } = usePatientAuth();
  const navigate = useNavigate();

  return (
    <PatientLayout>
      <div className="space-y-6">
        {/* Welcome Message */}
        <div className="text-center py-6">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Olá, {session?.patientName?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Suas respostas ajudam o profissional responsável a acompanhar sua evolução.
          </p>
        </div>

        {/* Warning Alert */}
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            Estas informações não substituem avaliação profissional presencial.
          </AlertDescription>
        </Alert>

        {/* Single CTA Card - Follow-up */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <ClipboardCheck className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-xl">Acompanhamento Clínico</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <CardDescription className="text-base">
              Informe como você está se sentindo para que seu profissional possa acompanhar sua evolução.
            </CardDescription>
            <Button 
              size="lg" 
              className="w-full sm:w-auto"
              onClick={() => navigate('/patient/followup')}
            >
              Responder acompanhamento
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </PatientLayout>
  );
}
