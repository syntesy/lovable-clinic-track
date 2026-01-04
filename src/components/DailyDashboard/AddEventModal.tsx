import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { ClinicalStage, STAGE_CONFIG } from '@/types/daily-dashboard';
import { format } from 'date-fns';

interface AddEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onSubmit: (data: {
    patient_id: string;
    patient_name: string;
    case_id?: string;
    case_summary?: string;
    event_date: string;
    time_start: string;
    time_end?: string;
    clinical_stage: ClinicalStage;
    today_action: string;
    last_outcome?: string;
  }) => Promise<boolean>;
}

interface PatientOption {
  id: string;
  name: string;
  cases: { id: string; summary: string }[];
}

export function AddEventModal({ open, onOpenChange, selectedDate, onSubmit }: AddEventModalProps) {
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [selectedCase, setSelectedCase] = useState<string>('');
  const [timeStart, setTimeStart] = useState('09:00');
  const [timeEnd, setTimeEnd] = useState('');
  const [clinicalStage, setClinicalStage] = useState<ClinicalStage>('avaliacao');
  const [todayAction, setTodayAction] = useState('');

  // Fetch patients with their cases
  useEffect(() => {
    if (!open) return;
    
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch patients (column is full_name, not name)
        const { data: patientsData } = await supabase
          .from('patients')
          .select('id, full_name')
          .order('full_name');

        if (!patientsData) return;

        // Fetch cases for each patient
        const patientsWithCases: PatientOption[] = await Promise.all(
          patientsData.map(async (p) => {
            const { data: cases } = await supabase
              .from('prp_screenings')
              .select('id, clinical_diagnosis, clinical_chief_complaint')
              .eq('patient_id', p.id);

            return {
              id: p.id,
              name: p.full_name,
              cases: (cases || []).map(c => ({
                id: c.id,
                summary: c.clinical_diagnosis || c.clinical_chief_complaint || 'Caso sem diagnóstico',
              })),
            };
          })
        );

        setPatients(patientsWithCases);
      } catch (err) {
        console.error('Error fetching patients:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedPatient || !todayAction) return;

    setSubmitting(true);
    const selectedCaseData = selectedPatient.cases.find(c => c.id === selectedCase);

    const success = await onSubmit({
      patient_id: selectedPatient.id,
      patient_name: selectedPatient.name,
      case_id: selectedCase || undefined,
      case_summary: selectedCaseData?.summary,
      event_date: format(selectedDate, 'yyyy-MM-dd'),
      time_start: timeStart,
      time_end: timeEnd || undefined,
      clinical_stage: clinicalStage,
      today_action: todayAction,
    });

    setSubmitting(false);

    if (success) {
      // Reset form
      setSelectedPatient(null);
      setSelectedCase('');
      setTimeStart('09:00');
      setTimeEnd('');
      setClinicalStage('avaliacao');
      setTodayAction('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar Atendimento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Paciente */}
          <div className="space-y-2">
            <Label>Paciente *</Label>
            <Select
              value={selectedPatient?.id || ''}
              onValueChange={(val) => {
                const patient = patients.find(p => p.id === val);
                setSelectedPatient(patient || null);
                setSelectedCase('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Carregando..." : "Selecione o paciente"} />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Caso (opcional) */}
          {selectedPatient && selectedPatient.cases.length > 0 && (
            <div className="space-y-2">
              <Label>Caso clínico (opcional)</Label>
              <Select value={selectedCase} onValueChange={setSelectedCase}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o caso" />
                </SelectTrigger>
                <SelectContent>
                  {selectedPatient.cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.summary}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Horário */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Início *</Label>
              <Input
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fim (opcional)</Label>
              <Input
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
              />
            </div>
          </div>

          {/* Etapa clínica */}
          <div className="space-y-2">
            <Label>Etapa clínica *</Label>
            <Select value={clinicalStage} onValueChange={(v) => setClinicalStage(v as ClinicalStage)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STAGE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ação do dia */}
          <div className="space-y-2">
            <Label>Ação do dia *</Label>
            <Textarea
              placeholder="Descreva objetivamente o que será feito neste atendimento"
              value={todayAction}
              onChange={(e) => setTodayAction(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!selectedPatient || !todayAction || submitting}
            >
              {submitting ? 'Agendando...' : 'Agendar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
