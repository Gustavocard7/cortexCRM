import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit2, Trash2, AlertCircle, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { Button, Input, Modal, Select, Badge, Table, Tabs, EmptyState, LoadingSpinner, Textarea } from '@/components/ui';
import { formatCurrency, formatDate, cn, leadSourceLabels, leadStatusLabels } from '@/lib/utils';
import { useLeads, useLeadMutations } from '@/hooks/useLeads';
import { mockStore } from '@/lib/mockStore';
import { Lead, PipelineStage } from '@/types';

const getTomorrowDefaultDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function LeadFormModal({ 
  isOpen, 
  onClose, 
  lead,
  defaultStageId,
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  lead?: Lead | null;
  defaultStageId?: string;
  onSuccess?: () => void;
}) {
  const { createLead, updateLead } = useLeadMutations();
  const [activeTab, setActiveTab] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [stages, setStages] = useState<PipelineStage[]>([]);

  useEffect(() => {
    try {
      const db = mockStore.get();
      setStages(db.pipelineStages || []);
    } catch (e) {
      console.error(e);
    }
  }, [isOpen]);

  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    source: 'website',
    stage_id: defaultStageId || 'stage-1',
    estimated_value: 0,
    status: 'active',
    notes: '',
    next_action_date: getTomorrowDefaultDate(),
    next_action_description: 'Primeiro contato / Apresentação comercial',
  });

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setActiveTab('basic');
      if (lead) {
        setFormData({
          ...lead,
          next_action_date: lead.next_action_date ? String(lead.next_action_date).slice(0, 16) : getTomorrowDefaultDate(),
          next_action_description: lead.next_action_description || 'Primeiro contato / Apresentação comercial',
        });
      } else {
        const db = mockStore.get();
        const initialStage = defaultStageId || db.pipelineStages?.[0]?.id || 'stage-1';
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          position: '',
          source: 'website',
          stage_id: initialStage,
          estimated_value: 0,
          status: 'active',
          notes: '',
          next_action_date: getTomorrowDefaultDate(),
          next_action_description: 'Primeiro contato / Apresentação comercial',
        });
      }
    }
  }, [isOpen, lead, defaultStageId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate Name
    if (!formData.name?.trim()) {
      setErrorMessage('O nome da lead é obrigatório.');
      setActiveTab('basic');
      return;
    }

    // Validate Golden Rule
    if (!formData.next_action_date || !formData.next_action_description?.trim()) {
      setErrorMessage('A Regra de Ouro exige definir a data e a descrição da próxima ação!');
      setActiveTab('action');
      return;
    }

    try {
      setIsSubmitting(true);
      if (lead?.id) {
        await updateLead({ id: lead.id, ...formData });
      } else {
        await createLead(formData as any);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving lead:', err);
      setErrorMessage(err.message || 'Erro ao registrar lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Dados Básicos' },
    { id: 'details', label: 'Detalhes' },
    { id: 'action', label: 'Próxima Ação ⚡' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={lead ? "Editar Lead" : "Nova Lead"} size="lg">
      <form onSubmit={handleSubmit}>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        
        {errorMessage && (
          <div className="mx-4 mt-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="p-4 space-y-4 min-h-[300px]">
          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2">
                <Input 
                  label="Nome do Contato *" 
                  required 
                  placeholder="Ex: Carlos Mendes"
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <Input 
                label="Empresa" 
                placeholder="Ex: Cortex Corp"
                value={formData.company || ''} 
                onChange={e => setFormData({...formData, company: e.target.value})} 
              />
              <Input 
                label="Valor Estimado da Oportunidade (R$)" 
                type="number" 
                placeholder="0,00"
                value={formData.estimated_value || ''} 
                onChange={e => setFormData({...formData, estimated_value: Number(e.target.value)})} 
              />
              <Input 
                label="Telefone / WhatsApp" 
                placeholder="(11) 98765-4321"
                value={formData.phone || ''} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
              />
              <Input 
                label="Email" 
                type="email" 
                placeholder="carlos@empresa.com"
                value={formData.email || ''} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
              />
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Estágio no Funil</label>
                <select
                  value={formData.stage_id || stages[0]?.id || 'stage-1'}
                  onChange={e => setFormData({...formData, stage_id: e.target.value})}
                  className="input-base"
                >
                  {stages.map((st) => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Origem do Lead</label>
                <select
                  value={formData.source || 'website'}
                  onChange={e => setFormData({...formData, source: e.target.value as any})}
                  className="input-base"
                >
                  {Object.entries(leadSourceLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input 
                  label="Valor Estimado da Oportunidade (R$)" 
                  type="number" 
                  placeholder="0,00"
                  value={formData.estimated_value || ''} 
                  onChange={e => setFormData({...formData, estimated_value: Number(e.target.value)})} 
                />
                <Input 
                  label="Cargo / Função" 
                  placeholder="Ex: Diretor de Vendas"
                  value={formData.position || ''} 
                  onChange={e => setFormData({...formData, position: e.target.value})} 
                />
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium text-dark-200 mb-1">Status da Oportunidade</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="input-base"
                  >
                    <option value="active">Ativo (Em Negociação)</option>
                    <option value="won">Ganho (Venda Fechada)</option>
                    <option value="lost">Perdido</option>
                  </select>
                </div>
              </div>
              <Textarea 
                label="Notas e Observações" 
                placeholder="Detalhes adicionais sobre a oportunidade..." 
                rows={4}
                value={formData.notes || ''} 
                onChange={e => setFormData({...formData, notes: e.target.value})} 
              />
            </div>
          )}

          {activeTab === 'action' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-500/15 via-cortex-500/15 to-transparent border border-amber-500/30 p-3.5 rounded-xl text-amber-300 text-sm flex items-start gap-3 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold text-amber-300 uppercase tracking-wider text-xs">
                    Regra de Ouro da Cortex
                  </strong>
                  <p className="text-xs text-amber-200/80 mt-0.5">
                    Nenhuma oportunidade fica sem próxima data e ação definida. Isso garante acompanhamento contínuo e impede perda de vendas.
                  </p>
                </div>
              </div>

              <Input 
                label="Data e Horário da Próxima Ação *" 
                type="datetime-local" 
                required 
                value={formData.next_action_date ? String(formData.next_action_date).slice(0, 16) : ''} 
                onChange={e => setFormData({...formData, next_action_date: e.target.value})} 
              />

              <Textarea 
                label="O que deve ser feito a seguir? *" 
                required 
                placeholder="Ex: Ligar para apresentar proposta técnica e alinhar requisitos..."
                rows={3}
                value={formData.next_action_description || ''} 
                onChange={e => setFormData({...formData, next_action_description: e.target.value})} 
              />
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-dark-700 bg-dark-900 rounded-b-xl gap-3">
          <div className="text-xs text-dark-400 flex items-center gap-1.5 self-start sm:self-center">
            <Clock className="w-3.5 h-3.5 text-cortex-400 shrink-0" />
            <span>Próxima ação pré-configurada automaticamente</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            {activeTab === 'basic' && (
              <Button type="button" variant="secondary" onClick={() => setActiveTab('details')}>
                Detalhes ➜
              </Button>
            )}
            {activeTab === 'details' && (
              <Button type="button" variant="secondary" onClick={() => setActiveTab('action')}>
                Próxima Ação ➜
              </Button>
            )}
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {lead ? "Salvar Alterações" : "Criar Lead"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function Leads() {
  const { data: leads, isLoading, error, refetch } = useLeads();

  const { deleteLead } = useLeadMutations();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  if (isLoading) return <div className="flex h-full items-center justify-center p-8"><LoadingSpinner /></div>;
  if (error) return <div className="p-8"><EmptyState title="Erro" description="Falha ao carregar leads." icon={AlertCircle} /></div>;

  const filtered = leads?.filter(
    (l: Lead) =>
      Boolean(l.name?.toLowerCase().includes(search.toLowerCase())) ||
      Boolean(l.company?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-dark-100">Leads</h1>
        <Button variant="primary" onClick={() => { setEditingLead(null); setModalOpen(true); }}><Plus className="w-4 h-4 mr-2" /> Nova Lead</Button>
      </div>
      <div className="flex gap-2 sm:gap-4 items-center w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400" />
          <Input className="pl-9 w-full" placeholder="Buscar por nome ou empresa..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button variant="secondary" className="shrink-0"><Filter className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Filtros</span></Button>
      </div>

      <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
        <Table>
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Empresa</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Valor Estimado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Próxima Ação</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700">
            {filtered?.map((lead: Lead) => {
              const isOverdue = lead.next_action_date && new Date(lead.next_action_date) < new Date();
              return (
                <tr key={lead.id} className="hover:bg-dark-800 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-dark-100">{lead.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-dark-300">{lead.company || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-dark-300">{formatCurrency(lead.estimated_value || 0)}</td>
                  <td className="px-4 py-3 text-sm">
                    {lead.next_action_date ? (
                      <div className={cn("flex flex-col", isOverdue ? "text-red-500" : "text-dark-300")}>
                        <span className="font-medium">{formatDate(lead.next_action_date)}</span>
                        <span className="text-xs truncate max-w-[200px]">{lead.next_action_description}</span>
                      </div>
                    ) : <span className="text-red-500 font-medium">Sem ação definida!</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap"><Badge variant={lead.status === 'active' ? 'success' : 'default'}>{leadStatusLabels[lead.status] || lead.status}</Badge></td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => { setEditingLead(lead); setModalOpen(true); }} className="text-dark-400 hover:text-cortex-500 mr-3" title="Editar"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={async () => { if(confirm('Excluir esta lead?')) { await deleteLead(lead.id); refetch(); } }} className="text-dark-400 hover:text-red-500" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        {filtered?.length === 0 && <div className="p-8"><EmptyState title="Nenhuma lead encontrada" description="Ajuste os filtros ou crie uma nova lead." /></div>}
      </div>
      {modalOpen && (
        <LeadFormModal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          lead={editingLead} 
          onSuccess={() => refetch()} 
        />
      )}
    </div>
  );
}

