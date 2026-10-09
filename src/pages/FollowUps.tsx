import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, XCircle, AlertCircle, Calendar, Sparkles } from 'lucide-react';
import { Button, Input, Modal, Select, Badge, Card, Tabs, EmptyState, LoadingSpinner, Textarea } from '@/components/ui';
import { cn, formatRelativeDate, formatDate, followUpPriorityLabels, followUpStatusLabels } from '@/lib/utils';
import { useFollowUps, useFollowUpMutations } from '@/hooks/useFollowUps';
import { mockStore } from '@/lib/mockStore';
import { FollowUp, Lead } from '@/types';

const getTomorrowDefaultDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function FollowUps() {
  const [activeTab, setActiveTab] = useState('all');
  const { data: followUps, isLoading, error, refetch } = useFollowUps(activeTab === 'all' ? undefined : { period: activeTab });
  const { completeFollowUp, cancelFollowUp, createFollowUp } = useFollowUpMutations();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState<FollowUp | null>(null);
  const [availableLeads, setAvailableLeads] = useState<Lead[]>([]);

  // New follow-up form state
  const [newLeadId, setNewLeadId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState(getTomorrowDefaultDate());
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Next action form state for complete modal
  const [nextTitle, setNextTitle] = useState('');
  const [nextDueDate, setNextDueDate] = useState(getTomorrowDefaultDate());
  const [nextDescription, setNextDescription] = useState('');

  useEffect(() => {
    try {
      const db = mockStore.get();
      setAvailableLeads(db.leads || []);
      if (db.leads?.length > 0 && !newLeadId) {
        setNewLeadId(db.leads[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  }, [modalOpen]);

  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadId || !newTitle.trim() || !newDueDate) return;
    try {
      setIsSubmitting(true);
      await createFollowUp({
        lead_id: newLeadId,
        title: newTitle.trim(),
        due_date: newDueDate,
        priority: newPriority,
        description: newDescription.trim(),
      });
      setModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      refetch();
    } catch (err) {
      console.error('Error creating follow up:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteWithNext = async (skipNext = false) => {
    if (!completeModalOpen) return;
    try {
      setIsSubmitting(true);
      await completeFollowUp(completeModalOpen.id);
      
      if (!skipNext && nextTitle.trim() && nextDueDate && completeModalOpen.lead_id) {
        await createFollowUp({
          lead_id: completeModalOpen.lead_id,
          title: nextTitle.trim(),
          due_date: nextDueDate,
          priority: 'medium',
          description: nextDescription.trim(),
        });
      }
      setCompleteModalOpen(null);
      setNextTitle('');
      setNextDescription('');
      refetch();
    } catch (err) {
      console.error('Error completing follow up:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelFollowUp = async (id: string) => {
    if (!confirm('Deseja realmente cancelar este acompanhamento?')) return;
    await cancelFollowUp(id);
    refetch();
  };

  if (isLoading) return <div className="flex h-full items-center justify-center p-8"><LoadingSpinner /></div>;
  if (error) return <div className="p-8"><EmptyState title="Erro" description="Falha ao carregar acompanhamentos." icon={AlertCircle} /></div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-dark-100">Acompanhamentos</h1>
          <p className="text-xs sm:text-sm text-dark-400">Rotina diária de contatos e próximas ações</p>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Novo Acompanhamento
        </Button>
      </div>

      <Tabs 
        tabs={[
          { id: 'all', label: 'Todos' },
          { id: 'today', label: 'Hoje' },
          { id: 'overdue', label: 'Atrasados' },
          { id: 'next_7_days', label: 'Próximos 7 Dias' },
        ]} 
        activeTab={activeTab} 
        onChange={setActiveTab} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {followUps?.map((fu: FollowUp) => {
          const isOverdue = new Date(fu.due_date) < new Date() && fu.status === 'pending';
          const isDone = fu.status === 'completed';
          const isCancelled = fu.status === 'cancelled';
          return (
            <Card key={fu.id} className={cn("p-4 flex flex-col gap-3 transition-all", isOverdue && "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]", isDone && "opacity-60")}>
              <div className="flex justify-between items-start">
                <Badge variant={isDone ? 'success' : isCancelled ? 'default' : fu.priority === 'high' || fu.priority === 'urgent' ? 'danger' : fu.priority === 'medium' ? 'warning' : 'default'}>
                  {followUpStatusLabels[fu.status] || fu.priority}
                </Badge>
                <span className={cn("text-xs font-medium flex items-center", isOverdue ? "text-red-400 font-semibold" : "text-dark-400")}>
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  {formatRelativeDate(fu.due_date)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-dark-100">{fu.title}</h3>
                <p className="text-xs sm:text-sm text-cortex-400 font-medium">
                  {fu.lead?.name ? `${fu.lead.name}${fu.lead.company ? ` • ${fu.lead.company}` : ''}` : 'Lead vinculada'}
                </p>
              </div>

              {fu.description && <p className="text-xs sm:text-sm text-dark-300 line-clamp-2">{fu.description}</p>}
              
              <div className="mt-auto pt-3 border-t border-dark-700/60 flex gap-2">
                {!isDone && !isCancelled ? (
                  <>
                    <Button 
                      variant="primary" 
                      className="flex-1 text-xs py-1.5" 
                      onClick={() => {
                        setCompleteModalOpen(fu);
                        setNextTitle('Follow-up de alinhamento');
                        setNextDueDate(getTomorrowDefaultDate());
                        setNextDescription('');
                      }}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Concluir
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="text-xs py-1.5" 
                      onClick={() => handleCancelFollowUp(fu.id)}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Cancelar
                    </Button>
                  </>
                ) : (
                  <span className="text-xs text-dark-400 italic">
                    {isDone ? 'Finalizado com sucesso' : 'Cancelado'}
                  </span>
                )}
              </div>
            </Card>
          );
        })}
        {followUps?.length === 0 && (
          <div className="col-span-full py-12">
            <EmptyState title="Nenhum acompanhamento" description="Todos os contatos agendados para este período estão em dia!" />
          </div>
        )}
      </div>

      {/* Modal: Novo Acompanhamento */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Novo Acompanhamento" size="md">
        <form onSubmit={handleCreateFollowUp} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">Lead Vinculada *</label>
            <select
              value={newLeadId}
              onChange={(e) => setNewLeadId(e.target.value)}
              className="input-base"
              required
            >
              {availableLeads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.company ? `(${l.company})` : ''}
                </option>
              ))}
            </select>
          </div>

          <Input 
            label="Título da Tarefa *" 
            required 
            placeholder="Ex: Ligar para confirmar interesse na proposta" 
            value={newTitle} 
            onChange={(e) => setNewTitle(e.target.value)} 
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Data e Horário *" 
              type="datetime-local" 
              required 
              value={newDueDate} 
              onChange={(e) => setNewDueDate(e.target.value)} 
            />
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">Prioridade</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="input-base"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          <Textarea 
            label="Descrição / Pauta da Ação" 
            placeholder="Notas sobre o que abordar durante o contato..." 
            rows={3} 
            value={newDescription} 
            onChange={(e) => setNewDescription(e.target.value)} 
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-dark-700">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>Agendar Ação</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Concluir e Agendar Próximo */}
      <Modal isOpen={!!completeModalOpen} onClose={() => setCompleteModalOpen(null)} title="Concluir e Agendar Próximo">
        <div className="p-4 space-y-4">
          <div className="bg-gradient-to-r from-amber-500/15 via-cortex-500/15 to-transparent border border-amber-500/30 p-3.5 rounded-xl text-amber-300 text-sm flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold text-amber-300 uppercase tracking-wider text-xs">
                Regra de Ouro da Cortex
              </strong>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Nunca deixe uma lead sem próxima ação agendada. Defina o próximo passo para manter a negociação viva!
              </p>
            </div>
          </div>

          <div className="bg-dark-800/80 p-3 rounded-lg border border-dark-700">
            <span className="text-xs text-dark-400 block font-medium">Concluindo ação de:</span>
            <p className="text-sm font-semibold text-dark-100">{completeModalOpen?.lead?.name || 'Lead'}</p>
            <p className="text-xs text-dark-300 mt-0.5">{completeModalOpen?.title}</p>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-semibold text-dark-200">Próxima Ação a Agendar:</h4>
            <Input 
              label="Título do Próximo Contato *" 
              value={nextTitle} 
              onChange={(e) => setNextTitle(e.target.value)} 
              placeholder="Ex: Enviar proposta revisada" 
            />
            <Input 
              label="Data e Horário *" 
              type="datetime-local" 
              value={nextDueDate} 
              onChange={(e) => setNextDueDate(e.target.value)} 
            />
            <Textarea 
              label="Observações da Ação" 
              rows={2} 
              value={nextDescription} 
              onChange={(e) => setNextDescription(e.target.value)} 
              placeholder="Detalhes ou acordos definidos no contato..." 
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-dark-700">
            <button 
              type="button" 
              className="text-xs text-dark-400 hover:text-dark-200 underline" 
              onClick={() => handleCompleteWithNext(true)}
              disabled={isSubmitting}
            >
              Concluir sem novo agendamento
            </button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setCompleteModalOpen(null)}>Cancelar</Button>
              <Button variant="primary" loading={isSubmitting} onClick={() => handleCompleteWithNext(false)}>
                Concluir e Salvar Próximo
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
