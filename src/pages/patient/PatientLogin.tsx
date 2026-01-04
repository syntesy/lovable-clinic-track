import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientAuth } from '@/contexts/PatientAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';
import logoRegenapp from '@/assets/logo-regenapp-new.png';

export default function PatientLogin() {
  const [surname, setSurname] = useState('');
  const [cpf, setCpf] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { session, login } = usePatientAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/patient/home');
    }
  }, [session, navigate]);

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCpf(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(surname, cpf);
    
    if (result.error) {
      setError(result.error);
    } else {
      navigate('/patient/home');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src={logoRegenapp} 
            alt="REGENAPP" 
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-2xl font-semibold text-foreground">
            Área do Paciente
          </h1>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg">Acesso Seguro</CardTitle>
            <CardDescription>
              Acesso exclusivo para pacientes autorizados por profissional de saúde.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="surname">Sobrenome</Label>
                <Input
                  id="surname"
                  type="text"
                  placeholder="Digite seu sobrenome"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCpfChange}
                  maxLength={14}
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !surname || cpf.replace(/\D/g, '').length !== 11}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                O acesso à Área do Paciente é criado exclusivamente pelo seu profissional de saúde.
                Em caso de dúvidas, entre em contato com seu profissional.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-6">
          O REGENAPP não substitui a orientação do seu profissional de saúde.
        </p>
      </div>
    </div>
  );
}
