import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Heart, Pill, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PrescriptionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
}

const prescriptionTypes = [
  { value: 'cuidados_gerais', label: 'Cuidados Gerais', icon: Heart, description: 'Orientações gerais de cuidados' },
  { value: 'medicacoes', label: 'Medicações', icon: Pill, description: 'Prescrição de medicamentos' },
  { value: 'suplementacoes', label: 'Suplementações', icon: Sparkles, description: 'Vitaminas e suplementação' },
];

export function PrescriptionFormModal({ open, onOpenChange, patientId, patientName }: PrescriptionFormModalProps) {
  const queryClient = useQueryClient();
  const [prescriptionType, setPrescriptionType] = useState('');
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState('');
  const [isVisibleToPatient, setIsVisibleToPatient] = useState(true);
  const [prescriptionDate] = useState(new Date());

  const selectedTypeLabel = prescriptionTypes.find(t => t.value === prescriptionType)?.label || 'Prescrição';

  const createPrescriptionMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('patient_prescriptions').insert({
        patient_id: patientId,
        professional_id: user.id,
        prescription_type: prescriptionType,
        title: selectedTypeLabel,
        content,
        notes: notes || null,
        is_visible_to_patient: isVisibleToPatient
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-prescriptions', patientId] });
      toast.success('Prescrição criada com sucesso!');
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar prescrição: ' + error.message);
    }
  });

  const resetForm = () => {
    setPrescriptionType('');
    setContent('');
    setNotes('');
    setIsVisibleToPatient(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prescriptionType) {
      toast.error('Selecione o tipo de prescrição');
      return;
    }
    if (!content.trim()) {
      toast.error('Informe o conteúdo da prescrição');
      return;
    }

    createPrescriptionMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Prescrição</DialogTitle>
          <DialogDescription>
            Criar prescrição para <strong>{patientName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Informações do Paciente e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border border-border">
            <div>
              <Label className="text-xs text-muted-foreground">Paciente</Label>
              <p className="font-medium text-foreground">{patientName}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Data da Prescrição</Label>
              <p className="font-medium text-foreground">
                {format(prescriptionDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>

          {/* Tipo de Prescrição */}
          <div className="space-y-3">
            <Label>Tipo de Prescrição *</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {prescriptionTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = prescriptionType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setPrescriptionType(type.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Icon className={`h-6 w-6 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className={`font-medium text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {type.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {type.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conteúdo */}
          <div className="space-y-2">
            <Textarea
              id="content"
              placeholder={
                prescriptionType === 'cuidados_gerais' 
                  ? 'Descreva os cuidados gerais...\n\nExemplo:\n- Repouso relativo\n- Evitar atividades de impacto\n- Aplicar gelo local por 15 min, 3x ao dia' 
                  : prescriptionType === 'medicacoes'
                  ? 'Descreva a prescrição medicamentosa...\n\nExemplo:\n1. Medicamento X - 500mg - 1x ao dia por 7 dias\n2. Medicamento Y - 200mg - 2x ao dia por 5 dias'
                  : prescriptionType === 'suplementacoes'
                  ? 'Descreva a suplementação...\n\nExemplo:\n1. Vitamina D3 - 5000 UI - 1x ao dia\n2. Ômega 3 - 1000mg - 2x ao dia\n3. Colágeno tipo II - 40mg - em jejum'
                  : 'Descreva o conteúdo da prescrição...'
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="resize-none"
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Observações adicionais para o paciente..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Visibilidade */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="visibility" className="font-medium">Visível para o paciente</Label>
              <p className="text-sm text-muted-foreground">
                O paciente poderá visualizar esta prescrição na Área do Paciente
              </p>
            </div>
            <Switch
              id="visibility"
              checked={isVisibleToPatient}
              onCheckedChange={setIsVisibleToPatient}
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createPrescriptionMutation.isPending || !prescriptionType || !content}
          >
            {createPrescriptionMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Criar Prescrição'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
