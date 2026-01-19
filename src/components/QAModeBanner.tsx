/**
 * QA Mode Banner
 * 
 * Displays a subtle banner when synthetic QA data is active.
 * Only shows in dev/staging environments.
 */

import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function QAModeBanner() {
  const [hasSyntheticData, setHasSyntheticData] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [syntheticCount, setSyntheticCount] = useState(0);

  // Check if in production
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isProduction = hostname.includes('lovable.app') && !hostname.includes('preview');

  useEffect(() => {
    // Don't check in production
    if (isProduction) return;

    const checkSyntheticData = async () => {
      try {
        const { count } = await supabase
          .from('attendance_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('is_synthetic', true);

        setHasSyntheticData((count || 0) > 0);
        setSyntheticCount(count || 0);
      } catch (error) {
        console.error('Error checking synthetic data:', error);
      }
    };

    checkSyntheticData();

    // Recheck periodically
    const interval = setInterval(checkSyntheticData, 30000);
    return () => clearInterval(interval);
  }, [isProduction]);

  // Don't render in production or if no synthetic data
  if (isProduction || !hasSyntheticData || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/90 text-amber-950 rounded-lg shadow-lg backdrop-blur-sm">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Modo QA ativo</p>
          <p className="text-xs opacity-80">
            {syntheticCount} atendimentos sintéticos em uso
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-amber-600/30"
          onClick={() => setIsDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
