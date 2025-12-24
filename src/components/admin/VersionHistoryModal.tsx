import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { CurationStatus, curationStatusConfig } from "@/types/curation";
import { Eye, Clock } from "lucide-react";

interface CurationVersion {
  id: string;
  version_number: number;
  status: CurationStatus;
  data: any;
  created_by: string;
  created_at: string;
  change_reason: string | null;
}

interface VersionHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  curationId: string;
}

export function VersionHistoryModal({
  open,
  onOpenChange,
  curationId,
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<CurationVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<CurationVersion | null>(null);

  useEffect(() => {
    if (open && curationId) {
      fetchVersions();
    }
  }, [open, curationId]);

  const fetchVersions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("curation_versions")
        .select("*")
        .eq("curation_id", curationId)
        .order("version_number", { ascending: false });

      if (error) throw error;

      setVersions(
        (data || []).map((v: any) => ({
          ...v,
          status: v.status as CurationStatus,
        }))
      );
    } catch (error) {
      console.error("Error fetching versions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: CurationStatus) => {
    const config = curationStatusConfig[status];
    return (
      <Badge variant="outline" className={`${config?.color || ""} border text-xs`}>
        {config?.label || status}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Versões
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p>Nenhuma versão anterior encontrada</p>
            </div>
          ) : selectedVersion ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => setSelectedVersion(null)}>
                  ← Voltar
                </Button>
                <Badge variant="secondary">v{selectedVersion.version_number}</Badge>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedVersion.status)}
                  <span className="text-sm text-muted-foreground">
                    {new Date(selectedVersion.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                
                {selectedVersion.change_reason && (
                  <p className="text-sm text-muted-foreground italic">
                    "{selectedVersion.change_reason}"
                  </p>
                )}
                
                <pre className="text-xs bg-background p-4 rounded overflow-auto max-h-[300px]">
                  {JSON.stringify(selectedVersion.data, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="font-mono">
                      v{version.version_number}
                    </Badge>
                    {getStatusBadge(version.status)}
                    <span className="text-sm text-muted-foreground">
                      {new Date(version.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedVersion(version)}
                    className="gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    Visualizar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
