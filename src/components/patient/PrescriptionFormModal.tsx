import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Heart, Pill, Sparkles, Plus, Trash2 } from 'lucide-react';
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

// ─── Tipos estruturados para medicações / suplementações ────────────────────

interface DrugItem { name: string; dose: string; frequency: string; duration: string; }
const EMPTY_DRUG: DrugItem = { name: '', dose: '', frequency: '', duration: '' };

export function PrescriptionFormModal({ open, onOpenChange, patientId, patientName }: PrescriptionFormModalProps) {
  const queryClient = useQueryClient();
  const [prescriptionType, setPrescriptionType] = useState('');
  // cuidados_gerais
  const [orientacoes, setOrientacoes] = useState('');
  // medicacoes / suplementacoes
  const [items, setItems] = useState<DrugItem[]>([{ ...EMPTY_DRUG }]);
  const [notes, setNotes] = useState('');
  const [isVisibleToPatient, setIsVisibleToPatient] = useState(true);
  const [prescriptionDate] = useState(new Date());

  const selectedTypeLabel = prescriptionTypes.find(t => t.value === prescriptionType)?.label || 'Prescrição';

  function updateItem(index: number, field: keyof DrugItem, val: string) {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, [field]: val } : it));
  }
  function addItem() { setItems(prev => [...prev, { ...EMPTY_DRUG }]); }
  function removeItem(index: number) { setItems(prev => prev.filter((_, i) => i !== index)); }

  /** Monta o campo `content` a partir dos campos estruturados */
  function buildContent(): string {
    if (prescriptionType === 'cuidados_gerais') return orientacoes.trim();
    return items
      .filter(it => it.name.trim())
      .map((it, i) => {
        const parts = [`${i + 1}. ${it.name.trim()}`];
        if (it.dose)      parts.push(`Dose: ${it.dose}`);
        if (it.frequency) parts.push(`Frequência: ${it.frequency}`);
        if (it.duration)  parts.push(`Duração: ${it.duration}`);
        return parts.join(' | ');
      })
      .join('\n');
  }

  function handleChangePrescriptionType(type: string) {
    setPrescriptionType(type);
    setOrientacoes('');
    setItems([{ ...EMPTY_DRUG }]);
  }

  const createPrescriptionMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('patient_prescriptions').insert({
        patient_id: patientId,
        professional_id: user.id,
        prescription_type: prescriptionType,
        title: selectedTypeLabel,
        content: buildContent(),
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
    setOrientacoes('');
    setItems([{ ...EMPTY_DRUG }]);
    setNotes('');
    setIsVisibleToPatient(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prescriptionType) {
      toast.error('Selecione o tipo de prescrição');
      return;
    }
    if (!buildContent()) {
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
                    onClick={() => handleChangePrescriptionType(type.value)}
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

          {/* Conteúdo dinâmico por tipo */}
          {prescriptionType === 'cuidados_gerais' && (
            <div className="space-y-2">
              <Label>Orientações *</Label>
              <Textarea
                placeholder={'Descreva os cuidados gerais...\n\nExemplo:\n- Repouso relativo\n- Evitar atividades de impacto\n- Aplicar gelo local por 15 min, 3x ao dia'}
                value={orientacoes}
                onChange={(e) => setOrientacoes(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>
          )}

          {(prescriptionType === 'medicacoes' || prescriptionType === 'suplementacoes') && (
            <div className="space-y-3">
              <Label>
                {prescriptionType === 'medicacoes' ? 'Medicamentos *' : 'Suplementos *'}
              </Label>
              {items.map((item, idx) => (
                <div key={idx} className="rounded-lg border border-border p-3 space-y-2 relative">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        {prescriptionType === 'medicacoes' ? 'Medicamento' : 'Suplemento'} *
                      </Label>
                      <Input
                        placeholder={prescriptionType === 'medicacoes' ? 'Ex: Ibuprofeno' : 'Ex: Vitamina D3'}
                        value={item.name}
                        onChange={(e) => updateItem(idx, 'name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Dose</Label>
                      <Input
                        placeholder={prescriptionType === 'medicacoes' ? 'Ex: 600mg' : 'Ex: 5000 UI'}
                        value={item.dose}
                        onChange={(e) => updateItem(idx, 'dose', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Frequência</Label>
                      <Input
                        placeholder="Ex: 2x ao dia"
                        value={item.frequency}
                        onChange={(e) => updateItem(idx, 'frequency', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Duração</Label>
                      <Input
                        placeholder="Ex: 7 dias"
                        value={item.duration}
                        onChange={(e) => updateItem(idx, 'duration', e.target.value)}
                      />
                    </div>
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Adicionar item
              </Button>
            </div>
          )}

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
            disabled={createPrescriptionMutation.isPending || !prescriptionType || !buildContent()}
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
