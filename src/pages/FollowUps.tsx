import React, { useState } from 'react';
import { Plus, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { Button, Input, Modal, Select, Badge, Card, Tabs, EmptyState, LoadingSpinner, Textarea } from '@/components/ui';
import { cn, formatRelativeDate, formatDate, followUpPriorityLabels, followUpStatusLabels } from '@/lib/utils';
import { useFollowUps, useFollowUpMutations } from '@/hooks/useFollowUps';
import { FollowUp } from '@/types';

export default function FollowUps() {
  const { data: followUps, isLoading, error } = useFollowUps();
  const { completeFollowUp, createFollowUp } = useFollowUpMutations();
  const [activeTab, setActiveTab] = useState('today');
  const [modalOpen, setModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState<FollowUp | null>(null);

  if (isLoading) return <div className="flex h-full items-center justify-center p-8"><LoadingSpinner /></div>;
  if (error) return <div className="p-8"><EmptyState title="Erro" description="Falha ao carregar acompanhamentos." icon={AlertCircle} /></div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-dark-100">Acompanhamentos</h1>
        <Button variant="primary" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo Acompanhamento</Button>
      </div>


      <Tabs 
        tabs={[
          {id: 'today', label: 'Hoje'},
          {id: 'overdue', label: 'Atrasados'},
          {id: 'next_7_days', label: 'Próximos 7 Dias'},
          {id: 'all', label: 'Todos'}
        ]} 
        activeTab={activeTab} 
        onChange={setActiveTab} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {followUps?.map((fu: FollowUp) => {
          const isOverdue = new Date(fu.due_date) < new Date() && fu.status === 'pending';
          return (
            <Card key={fu.id} className={cn("p-4 flex flex-col gap-3", isOverdue && "border-red-500/50")}>
              <div className="flex justify-between items-start">
                <Badge variant={fu.priority === 'high' ? 'danger' : fu.priority === 'medium' ? 'warning' : 'default'}>
                  {followUpPriorityLabels[fu.priority] || fu.priority}
                </Badge>
                <span className={cn("text-xs font-medium flex items-center", isOverdue ? "text-red-500" : "text-dark-400")}>
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatRelativeDate(fu.due_date)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-dark-100">{fu.title}</h3>
                <p className="text-sm text-cortex-400 hover:underline cursor-pointer">{fu.lead_id}</p>
              </div>
              <p className="text-sm text-dark-300 line-clamp-2">{fu.description}</p>
              <div className="mt-auto pt-4 border-t border-dark-700 flex gap-2">
                <Button variant="primary" className="flex-1 text-xs" onClick={() => setCompleteModalOpen(fu)}><CheckCircle className="w-3 h-3 mr-1" /> Concluir</Button>
                <Button variant="secondary" className="text-xs"><XCircle className="w-3 h-3 mr-1" /> Cancelar</Button>
              </div>
            </Card>
          )
        })}
        {followUps?.length === 0 && <div className="col-span-full py-12"><EmptyState title="Nenhum acompanhamento" description="Você está em dia!" /></div>}
      </div>

      <Modal isOpen={!!completeModalOpen} onClose={() => setCompleteModalOpen(null)} title="Concluir e Agendar Próximo">
        <div className="p-4 space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-amber-500 text-sm">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            <strong>Regra de Ouro:</strong> Nunca deixe uma lead sem um próximo passo. Agende a próxima ação agora.
          </div>
          <div className="space-y-3">
            <Input label="Data/Hora do Próximo Acompanhamento" type="datetime-local" required />
            <Input label="Título" required />
            <Textarea label="Descrição" required />
          </div>
          <div className="flex justify-between items-center pt-4">
            <Button variant="secondary" className="text-dark-400">Pular (Não recomendado)</Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setCompleteModalOpen(null)}>Cancelar</Button>
              <Button variant="primary">Concluir e Salvar Novo</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
