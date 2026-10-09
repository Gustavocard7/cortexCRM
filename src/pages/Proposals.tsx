import React, { useState, useEffect } from 'react';
import { Proposal, Lead } from '@/types';
import { formatCurrency, formatDate, cn, proposalStatusLabels } from '@/lib/utils';
import { Button, Input, Modal, Select, Badge, Card, Table, Tabs, EmptyState, LoadingSpinner, Textarea } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useProposals, useProposalMutations } from '@/hooks/useProposals';
import { Plus, Search, Filter, FileText, CheckCircle, XCircle, Clock, Edit, DollarSign, Send, FilePlus } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStore } from '@/lib/mockStore';

export default function Proposals() {
  const { proposals, loading, error } = useProposals();
  const { createProposal, updateProposal, deleteProposal } = useProposalMutations();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);

  // Create form state
  const [formData, setFormData] = useState({
    lead_id: '',
    title: '',
    value: '',
    valid_until: '',
    notes: ''
  });

  // Convert form state
  const [convertData, setConvertData] = useState({
    payment_method: 'pix',
    installments: '1',
    recurring_value: '',
    notes: ''
  });

  useEffect(() => {
    if (isCreateModalOpen) {
      fetchLeads();
    }
  }, [isCreateModalOpen]);

  const fetchLeads = async () => {
    setIsLoadingLeads(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('leads')
          .select('id, name, company')
          .eq('status', 'active');
        if (error) throw error;
        setLeads((data as any) || []);
      } else {
        const db = mockStore.get();
        const activeLeads = db.leads.filter((l) => l.status === 'active');
        setLeads(activeLeads as any);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProposal({
        lead_id: formData.lead_id,
        title: formData.title,
        value: parseFloat(formData.value),
        valid_until: formData.valid_until,
        notes: formData.notes,
        status: 'draft',
        user_id: user?.id || ''
      });
      setIsCreateModalOpen(false);
      setFormData({ lead_id: '', title: '', value: '', valid_until: '', notes: '' });
    } catch (err) {
      console.error('Error creating proposal:', err);
    }
  };

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal) return;
    try {
      // Create sale
      await supabase.from('sales').insert({
        proposal_id: selectedProposal.id,
        lead_id: selectedProposal.lead_id,
        user_id: user?.id,
        value: selectedProposal.value,
        payment_method: convertData.payment_method,
        installments: parseInt(convertData.installments),
        recurring_value: convertData.recurring_value ? parseFloat(convertData.recurring_value) : null,
        notes: convertData.notes,
        status: 'completed',
        date: new Date().toISOString()
      });
      
      // Update lead status
      await supabase.from('leads').update({ status: 'won' }).eq('id', selectedProposal.lead_id);
      
      setIsConvertModalOpen(false);
      setConvertData({ payment_method: 'pix', installments: '1', recurring_value: '', notes: '' });
      setSelectedProposal(null);
    } catch (err) {
      console.error('Error converting to sale:', err);
    }
  };

  const filteredProposals = proposals?.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || p.status === activeTab;
    return matchesSearch && matchesTab;
  }) || [];

  const totalValue = filteredProposals.reduce((sum, p) => sum + p.value, 0);
  const totalCount = filteredProposals.length;
  const acceptedCount = filteredProposals.filter(p => p.status === 'accepted').length;
  const acceptanceRate = totalCount > 0 ? (acceptedCount / totalCount) * 100 : 0;
  const pendingCount = filteredProposals.filter(p => p.status === 'sent').length;

  if (loading) return <div className="p-8 flex justify-center"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="p-8 text-red-500">Erro ao carregar propostas</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-2">
          <FileText className="w-6 h-6 text-cortex-500" />
          Propostas
        </h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <Input 
              placeholder="Buscar propostas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nova Proposta
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 stat-card flex flex-col gap-2">
          <span className="text-dark-400 text-sm">Total Propostas</span>
          <span className="text-2xl font-bold text-dark-100">{totalCount}</span>
        </Card>
        <Card className="p-4 stat-card flex flex-col gap-2">
          <span className="text-dark-400 text-sm">Valor Total</span>
          <span className="text-2xl font-bold text-emerald-400">{formatCurrency(totalValue)}</span>
        </Card>
        <Card className="p-4 stat-card flex flex-col gap-2">
          <span className="text-dark-400 text-sm">Taxa de Aceitação</span>
          <span className="text-2xl font-bold text-cortex-400">{acceptanceRate.toFixed(1)}%</span>
        </Card>
        <Card className="p-4 stat-card flex flex-col gap-2">
          <span className="text-dark-400 text-sm">Propostas Pendentes</span>
          <span className="text-2xl font-bold text-amber-400">{pendingCount}</span>
        </Card>
      </div>

      <div className="bg-dark-900 border border-dark-700 rounded-lg overflow-hidden">
        <div className="border-b border-dark-700 p-2">
          <Tabs 
            tabs={[
              { id: 'all', label: 'Todas' },
              { id: 'draft', label: 'Rascunho' },
              { id: 'sent', label: 'Enviadas' },
              { id: 'accepted', label: 'Aceitas' },
              { id: 'rejected', label: 'Rejeitadas' }
            ]}
            activeId={activeTab}
            onChange={setActiveTab}
          />
        </div>
        
        {filteredProposals.length === 0 ? (
          <EmptyState 
            icon={<FileText className="w-12 h-12" />}
            title="Nenhuma proposta encontrada"
            description="Você ainda não tem propostas nesta categoria."
            action={<Button onClick={() => setIsCreateModalOpen(true)}>Criar Primeira Proposta</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Lead/Cliente</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Validade</th>
                  <th>Enviada em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProposals.map(proposal => (
                  <tr key={proposal.id} className="table-row">
                    <td className="font-medium text-dark-100">{proposal.title}</td>
                    <td className="text-dark-300">{proposal.lead?.name || 'N/A'}</td>
                    <td className="text-dark-100">{formatCurrency(proposal.value)}</td>
                    <td>
                      <Badge variant={
                        proposal.status === 'accepted' ? 'success' :
                        proposal.status === 'rejected' ? 'danger' :
                        proposal.status === 'sent' ? 'warning' : 'default'
                      }>
                        {proposalStatusLabels[proposal.status as keyof typeof proposalStatusLabels] || proposal.status}
                      </Badge>
                    </td>
                    <td className="text-dark-300">{formatDate(proposal.valid_until)}</td>
                    <td className="text-dark-300">{proposal.sent_at ? formatDate(proposal.sent_at) : '-'}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {proposal.status === 'draft' && (
                          <Button variant="secondary" size="sm" onClick={() => updateProposal({ id: proposal.id, status: 'sent', sent_at: new Date().toISOString() })} title="Enviar">
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        {proposal.status === 'sent' && (
                          <>
                            <Button variant="secondary" size="sm" className="text-emerald-400 hover:bg-emerald-400/10" onClick={() => updateProposal({ id: proposal.id, status: 'accepted' })} title="Aceitar">
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button variant="secondary" size="sm" className="text-red-400 hover:bg-red-400/10" onClick={() => updateProposal({ id: proposal.id, status: 'rejected' })} title="Rejeitar">
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {proposal.status === 'accepted' && (
                          <Button variant="primary" size="sm" onClick={() => { setSelectedProposal(proposal); setIsConvertModalOpen(true); }} title="Converter em Venda">
                            <DollarSign className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="secondary" size="sm" onClick={() => { /* Edit logic */ }} title="Editar">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Nova Proposta">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Lead/Cliente *</label>
            <Select 
              value={formData.lead_id} 
              onChange={(e) => setFormData({...formData, lead_id: e.target.value})}
              required
              disabled={isLoadingLeads}
            >
              <option value="">Selecione um lead</option>
              {leads.map(lead => (
                <option key={lead.id} value={lead.id}>{lead.name} {lead.company ? `(${lead.company})` : ''}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Título da Proposta *</label>
            <Input 
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})} 
              required
              placeholder="Ex: Proposta de Serviços de Marketing"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Valor (R$) *</label>
              <Input 
                type="number" 
                step="0.01" 
                value={formData.value} 
                onChange={(e) => setFormData({...formData, value: e.target.value})} 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Válida até *</label>
              <Input 
                type="date" 
                value={formData.valid_until} 
                onChange={(e) => setFormData({...formData, valid_until: e.target.value})} 
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Observações</label>
            <Textarea 
              value={formData.notes} 
              onChange={(e) => setFormData({...formData, notes: e.target.value})} 
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="primary">Criar Proposta</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isConvertModalOpen} onClose={() => setIsConvertModalOpen(false)} title="Converter em Venda">
        {selectedProposal && (
          <form onSubmit={handleConvertSubmit} className="space-y-4">
            <div className="bg-dark-800 p-4 rounded-lg border border-dark-700 mb-4">
              <h4 className="font-medium text-dark-100">{selectedProposal.title}</h4>
              <p className="text-sm text-dark-400 mt-1">Valor: {formatCurrency(selectedProposal.value)}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Método de Pagamento</label>
                <Select 
                  value={convertData.payment_method} 
                  onChange={(e) => setConvertData({...convertData, payment_method: e.target.value})}
                >
                  <option value="pix">PIX</option>
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="bank_transfer">Transferência Bancária</option>
                  <option value="boleto">Boleto</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Parcelas</label>
                <Select 
                  value={convertData.installments} 
                  onChange={(e) => setConvertData({...convertData, installments: e.target.value})}
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1}x</option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Valor Recorrente (Opcional)</label>
              <Input 
                type="number" 
                step="0.01" 
                value={convertData.recurring_value} 
                onChange={(e) => setConvertData({...convertData, recurring_value: e.target.value})} 
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Observações da Venda</label>
              <Textarea 
                value={convertData.notes} 
                onChange={(e) => setConvertData({...convertData, notes: e.target.value})} 
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsConvertModalOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="primary" className="bg-emerald-500 hover:bg-emerald-600 text-white">Confirmar Venda</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
