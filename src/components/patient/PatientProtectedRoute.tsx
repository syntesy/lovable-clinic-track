import { Navigate } from 'react-router-dom';
import { usePatientAuth } from '@/contexts/PatientAuthContext';

export function PatientProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = usePatientAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/patient/login" replace />;
  }

  return <>{children}</>;
}
