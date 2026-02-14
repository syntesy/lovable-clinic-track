import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Loader2 } from "lucide-react";

interface DuplicateProtocolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceTitle: string;
  onConfirm: (newTitle: string) => void;
  isPending: boolean;
}

export function DuplicateProtocolModal({
  open,
  onOpenChange,
  sourceTitle,
  onConfirm,
  isPending,
}: DuplicateProtocolModalProps) {
  const [title, setTitle] = useState(`${sourceTitle} (Derivado)`);

  // Reset title when source changes
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setTitle(`${sourceTitle} (Derivado)`);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicar Protocolo
          </DialogTitle>
          <DialogDescription>
            Será criado um novo protocolo DERIVADO a partir de "{sourceTitle}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label>Título do novo protocolo</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Informe o título..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(title)}
            disabled={!title.trim() || isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            Duplicar e Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
