import React, { useState } from 'react';
import { Search, Filter, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Button, Input, Modal, Select, Badge, Table, Tabs, EmptyState, LoadingSpinner, Textarea } from '@/components/ui';
import { formatCurrency, formatDate, cn, leadSourceLabels, leadStatusLabels } from '@/lib/utils';
import { useLeads, useLeadMutations } from '@/hooks/useLeads';
import { Lead } from '@/types';

function LeadFormModal({ isOpen, onClose, lead }: { isOpen: boolean; onClose: () => void; lead?: Lead | null }) {
  const { createLead, updateLead } = useLeadMutations();
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<Partial<Lead>>(lead || { name: '', next_action_date: '', next_action_description: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lead) updateLead({ id: lead.id, ...formData });
    else createLead(formData as any);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={lead ? "Editar Lead" : "Nova Lead"} size="lg">
      <form onSubmit={handleSubmit}>
        <Tabs tabs={[{id: 'basic', label: 'Dados Básicos'}, {id: 'details', label: 'Detalhes'}, {id: 'action', label: 'Próxima Ação'}]} activeTab={activeTab} onChange={setActiveTab} />
        <div className="p-4 space-y-4 min-h-[300px]">
          {activeTab === 'basic' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Input label="Nome" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <Input label="Email" type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
              <Input label="Telefone" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <Input label="Empresa" value={formData.company || ''} onChange={e => setFormData({...formData, company: e.target.value})} />
              <Input label="Cargo" value={formData.position || ''} onChange={e => setFormData({...formData, position: e.target.value})} />
            </div>
          )}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <Input label="Valor Estimado" type="number" value={formData.estimated_value || ''} onChange={e => setFormData({...formData, estimated_value: Number(e.target.value)})} />
              <Textarea label="Notas" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} />
            </div>
          )}
          {activeTab === 'action' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-amber-500 text-sm flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4" /> REGRA DE OURO: Toda lead precisa de uma próxima ação!
              </div>
              <Input label="Data/Hora da Próxima Ação" type="datetime-local" required value={formData.next_action_date ? String(formData.next_action_date).slice(0, 16) : ''} onChange={e => setFormData({...formData, next_action_date: e.target.value})} />
              <Textarea label="Descrição da Ação" required value={formData.next_action_description || ''} onChange={e => setFormData({...formData, next_action_description: e.target.value})} />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 p-4 border-t border-dark-700 bg-dark-900 rounded-b-xl">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary">Salvar</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Leads() {
  const { data: leads, isLoading, error } = useLeads();
  const { deleteLead } = useLeadMutations();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  if (isLoading) return <div className="flex h-full items-center justify-center p-8"><LoadingSpinner /></div>;
  if (error) return <div className="p-8"><EmptyState title="Erro" description="Falha ao carregar leads." icon={AlertCircle} /></div>;

  const filtered = leads?.filter((l: Lead) => l.name.toLowerCase().includes(search.toLowerCase()) || l.company?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-100">Leads</h1>
        <Button variant="primary" onClick={() => { setEditingLead(null); setModalOpen(true); }}><Plus className="w-4 h-4 mr-2" /> Nova Lead</Button>
      </div>
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400" />
          <Input className="pl-9" placeholder="Buscar por nome ou empresa..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button variant="secondary"><Filter className="w-4 h-4 mr-2" /> Filtros</Button>
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
                    <button onClick={() => { setEditingLead(lead); setModalOpen(true); }} className="text-dark-400 hover:text-cortex-500 mr-3"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => { if(confirm('Excluir esta lead?')) deleteLead(lead.id); }} className="text-dark-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        {filtered?.length === 0 && <div className="p-8"><EmptyState title="Nenhuma lead encontrada" description="Ajuste os filtros ou crie uma nova lead." /></div>}
      </div>
      {modalOpen && <LeadFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} lead={editingLead} />}
    </div>
  );
}
