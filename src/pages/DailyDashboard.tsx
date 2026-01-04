import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, ChevronLeft, ChevronRight, Plus, Search, Clock, Layers } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDailyDashboard } from '@/hooks/useDailyDashboard';
import { ClinicalEventCard, DashboardCounters, AddEventModal } from '@/components/DailyDashboard';
import { ViewMode, ClinicalStage } from '@/types/daily-dashboard';

export default function DailyDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('by_time');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    events,
    counters,
    loading,
    filters,
    setFilters,
    createEvent,
    markAsAttended,
  } = useDailyDashboard(selectedDate);

  // Apply search filter
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setFilters({ ...filters, searchTerm: term });
  };

  // Handle counter filter click
  const handleFilterClick = (stage: ClinicalStage | null) => {
    setFilters({ ...filters, stage: stage || undefined });
  };

  // Date navigation
  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Agenda Clínica</h1>
            <p className="text-muted-foreground">
              Eventos do dia organizados por horário
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Atendimento
          </Button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between bg-card border rounded-lg p-3 mb-6">
          <Button variant="ghost" size="icon" onClick={goToPreviousDay}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span className="text-lg font-medium">
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </span>
            {!isToday && (
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoje
              </Button>
            )}
          </div>

          <Button variant="ghost" size="icon" onClick={goToNextDay}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Counters - Fixed at top */}
        <DashboardCounters
          counters={counters}
          activeFilter={filters.stage}
          onFilterClick={handleFilterClick}
        />

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between my-6">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente ou ação..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* View Mode Toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="by_time" className="gap-2">
                <Clock className="h-4 w-4" />
                Por horário
              </TabsTrigger>
              <TabsTrigger value="by_stage" className="gap-2">
                <Layers className="h-4 w-4" />
                Por etapa
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Carregando...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Nenhum atendimento agendado para hoje.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agendar atendimento
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <ClinicalEventCard
                key={event.id}
                event={event}
                viewMode={viewMode}
                onMarkAttended={markAsAttended}
              />
            ))}
          </div>
        )}

        {/* Add Event Modal */}
        <AddEventModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
          selectedDate={selectedDate}
          onSubmit={createEvent}
        />
      </div>
    </Layout>
  );
}
