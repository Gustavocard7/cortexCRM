import React, { useState } from 'react';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Search, Filter, AlertCircle, Clock, DollarSign } from 'lucide-react';
import { Button, Input, Modal, LoadingSpinner, EmptyState } from '@/components/ui';
import { formatCurrency, formatRelativeDate, cn, getInitials } from '@/lib/utils';
import { usePipeline, usePipelineMutations } from '@/hooks/usePipeline';
import { Lead, PipelineStage } from '@/types';

function PipelineCard({ lead, onClick }: { lead: Lead; onClick: (lead: Lead) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id, data: { type: 'Lead', lead } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const isOverdue = lead.next_action_date && new Date(lead.next_action_date) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(lead)}
      className={cn("glass-card-hover mb-3 cursor-grab active:cursor-grabbing p-3 rounded-lg border", isOverdue ? "border-red-500/50" : "border-dark-700")}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="text-sm font-semibold text-dark-100">{lead.name}</h4>
          <p className="text-xs text-dark-400">{lead.company}</p>
        </div>
        {lead.assigned_to && (
          <div className="h-6 w-6 rounded-full bg-cortex-500/20 text-cortex-500 flex items-center justify-center text-xs font-bold">
            {getInitials(lead.assigned_to)}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-xs mt-3">
        <div className="flex items-center text-dark-300">
          <DollarSign className="w-3 h-3 mr-1" />
          {formatCurrency(lead.estimated_value || 0)}
        </div>
        <div className={cn("flex items-center", isOverdue ? "text-red-400 font-medium" : "text-dark-400")}>
          <Clock className="w-3 h-3 mr-1" />
          {lead.next_action_date ? formatRelativeDate(lead.next_action_date) : 'Sem ação'}
        </div>
      </div>
    </div>
  );
}

function PipelineColumn({ stage, leads, onCardClick }: { stage: PipelineStage; leads: Lead[]; onCardClick: (lead: Lead) => void }) {
  const { setNodeRef } = useSortable({ id: stage.id, data: { type: 'Column', stage } });
  const totalValue = leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);

  return (
    <div className="flex flex-col w-[280px] sm:w-[320px] shrink-0 snap-start bg-dark-900/50 border border-dark-700 rounded-xl">
      <div className="p-3 border-b border-dark-700 flex justify-between items-center" style={{ borderTop: `3px solid ${stage.color || '#f59e0b'}` }}>
        <h3 className="font-semibold text-dark-100 flex items-center gap-2">
          {stage.name}
          <span className="bg-dark-800 text-dark-300 text-xs py-0.5 px-2 rounded-full">{leads.length}</span>
        </h3>
        <span className="text-xs font-medium text-dark-400">{formatCurrency(totalValue)}</span>
      </div>
      <div ref={setNodeRef} className="flex-1 p-3 overflow-y-auto min-h-[400px]">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map(lead => <PipelineCard key={lead.id} lead={lead} onClick={onCardClick} />)}
        </SortableContext>
        {leads.length === 0 && <div className="h-full flex items-center justify-center text-dark-400 text-sm italic py-8">Arraste leads para cá</div>}
      </div>
    </div>
  );
}

export default function Pipeline() {
  const { data, isLoading, error } = usePipeline();
  const { moveLeadToStage } = usePipelineMutations();
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor));

  if (isLoading) return <div className="flex h-full items-center justify-center"><LoadingSpinner /></div>;
  if (error || !data) return <div className="p-8"><EmptyState title="Erro" description="Falha ao carregar pipeline." icon={AlertCircle} /></div>;

  const totalValue = data.stages.reduce((acc: number, stage: any) => 
    acc + data.leads.filter((l: any) => l.stage_id === stage.id).reduce((sum: number, l: any) => sum + (l.estimated_value || 0), 0), 0);

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Lead') setActiveLead(event.active.data.current.lead);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;
    const activeLeadData = active.data.current?.lead;
    const overStageId = over.data.current?.type === 'Column' ? over.id : over.data.current?.lead?.stage_id;
    if (activeLeadData && overStageId && activeLeadData.stage_id !== overStageId) {
      moveLeadToStage(activeLeadData.id, overStageId);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-dark-100">Funil de Vendas</h1>
          <p className="text-xs sm:text-sm text-dark-400">Total no pipeline: <span className="font-semibold text-cortex-400">{formatCurrency(totalValue)}</span></p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400" />
            <Input className="pl-9 w-full" placeholder="Buscar no pipeline..." />
          </div>
          <Button variant="secondary" className="shrink-0"><Filter className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Filtros</span></Button>
        </div>
      </div>
      <div className="flex-1 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full items-start snap-x snap-mandatory">
            {data.stages.sort((a: any, b: any) => a.order_position - b.order_position).map((stage: any) => (
              <PipelineColumn key={stage.id} stage={stage} leads={data.leads.filter((l: any) => l.stage_id === stage.id)} onCardClick={setSelectedLead} />
            ))}
          </div>
          <DragOverlay>{activeLead ? <PipelineCard lead={activeLead} onClick={() => {}} /> : null}</DragOverlay>
        </DndContext>
      </div>

      <Modal isOpen={!!selectedLead} onClose={() => setSelectedLead(null)} title="Detalhes do Lead">
        {selectedLead && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg text-dark-100">{selectedLead.name}</h3>
              <p className="text-dark-400">{selectedLead.company}</p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setSelectedLead(null)}>Fechar</Button>
              <Button variant="primary">Editar Lead</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
