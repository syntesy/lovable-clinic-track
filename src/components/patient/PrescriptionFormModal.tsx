import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Salad, Pill, Sparkles } from 'lucide-react';

interface PrescriptionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
}

const prescriptionTypes = [
  { value: 'alimentar', label: 'Cuidados Alimentares', icon: Salad, description: 'Orientações de preparo do solo e alimentação' },
  { value: 'medicamentosa', label: 'Medicações', icon: Pill, description: 'Prescrição de medicamentos' },
  { value: 'suplementar', label: 'Suplementos', icon: Sparkles, description: 'Vitaminas e suplementação' },
];

export function PrescriptionFormModal({ open, onOpenChange, patientId, patientName }: PrescriptionFormModalProps) {
  const queryClient = useQueryClient();
  const [prescriptionType, setPrescriptionType] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState('');
  const [isVisibleToPatient, setIsVisibleToPatient] = useState(true);

  const createPrescriptionMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('patient_prescriptions').insert({
        patient_id: patientId,
        professional_id: user.id,
        prescription_type: prescriptionType,
        title,
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
    setTitle('');
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
    if (!title.trim()) {
      toast.error('Informe o título');
      return;
    }
    if (!content.trim()) {
      toast.error('Informe o conteúdo da prescrição');
      return;
    }

    createPrescriptionMutation.mutate();
  };

  const selectedType = prescriptionTypes.find(t => t.value === prescriptionType);

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

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder={
                prescriptionType === 'alimentar' ? 'Ex: Orientações alimentares pré-procedimento' :
                prescriptionType === 'medicamentosa' ? 'Ex: Prescrição de anti-inflamatório' :
                prescriptionType === 'suplementar' ? 'Ex: Protocolo de suplementação' :
                'Título da prescrição'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Conteúdo */}
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo da Prescrição *</Label>
            <Textarea
              id="content"
              placeholder={
                prescriptionType === 'alimentar' 
                  ? 'Descreva as orientações alimentares...\n\nExemplo:\n- Evitar alimentos processados\n- Aumentar consumo de vegetais verdes\n- Hidratação: mínimo 2L de água/dia' 
                  : prescriptionType === 'medicamentosa'
                  ? 'Descreva a prescrição medicamentosa...\n\nExemplo:\n1. Medicamento X - 500mg - 1x ao dia por 7 dias\n2. Medicamento Y - 200mg - 2x ao dia por 5 dias'
                  : prescriptionType === 'suplementar'
                  ? 'Descreva a suplementação...\n\nExemplo:\n1. Vitamina D3 - 5000 UI - 1x ao dia\n2. Ômega 3 - 1000mg - 2x ao dia\n3. Colágeno tipo II - 40mg - em jejum'
                  : 'Descreva o conteúdo da prescrição...'
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
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
            disabled={createPrescriptionMutation.isPending || !prescriptionType || !title || !content}
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
