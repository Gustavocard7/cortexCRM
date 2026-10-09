import React, { useState, useEffect } from 'react';
import { User, Settings as SettingsIcon, LayoutTemplate, Users as UsersIcon, Building, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { Card, Input, Button, Table, Badge, Select, LoadingSpinner, Modal } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStore } from '@/lib/mockStore';
import { cn, getInitials } from '@/lib/utils';
import { PipelineStage, Profile } from '@/types';

export default function Settings() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile state
  const [profileData, setProfileData] = useState({ name: '', phone: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // General state
  const [generalData, setGeneralData] = useState({ company_name: 'Cortex Soluções' });
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [generalMsg, setGeneralMsg] = useState({ type: '', text: '' });

  // Users state
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Pipeline Stages state
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [isLoadingStages, setIsLoadingStages] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [stageForm, setStageForm] = useState({ name: '', color: '#6366f1' });

  useEffect(() => {
    if (activeTab === 'profile') loadProfile();
    else if (activeTab === 'general') loadGeneral();
    else if (activeTab === 'users') loadUsers();
    else if (activeTab === 'stages') loadStages();
  }, [activeTab, user]);

  const loadProfile = async () => {
    if (profile) {
      setProfileData({ name: profile.full_name || '', phone: profile.phone || '' });
    } else if (user) {
      if (isSupabaseConfigured) {
        try {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (data) setProfileData({ name: data.full_name || '', phone: data.phone || '' });
        } catch (e) {
          console.error(e);
        }
      } else {
        const db = mockStore.get();
        const p = db.profiles.find((x) => x.id === user.id) || db.profiles[0];
        setProfileData({ name: p.full_name || '', phone: p.phone || '' });
      }
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    setProfileMsg({ type: '', text: '' });
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('profiles')
          .update({ full_name: profileData.name, phone: profileData.phone, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        if (error) throw error;
      } else {
        const db = mockStore.get();
        const idx = db.profiles.findIndex((p) => p.id === user.id);
        if (idx !== -1) {
          db.profiles[idx].full_name = profileData.name;
          db.profiles[idx].phone = profileData.phone;
          db.profiles[idx].updated_at = new Date().toISOString();
          mockStore.save(db);
        }
      }
      setProfileMsg({ type: 'success', text: 'Perfil Cortex atualizado com sucesso!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: 'Erro ao salvar alterações do perfil.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const loadGeneral = async () => {
    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase.from('settings').select('*').eq('key', 'company_name').single();
        if (data) setGeneralData({ company_name: data.value });
      } catch (e) {
        console.error(e);
      }
    } else {
      const db = mockStore.get();
      setGeneralData({ company_name: db.settings?.company_name || 'Cortex Soluções' });
    }
  };

  const saveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGeneral(true);
    setGeneralMsg({ type: '', text: '' });
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('settings')
          .upsert({ key: 'company_name', value: generalData.company_name, updated_at: new Date().toISOString() });
        if (error) throw error;
      } else {
        const db = mockStore.get();
        db.settings = { ...db.settings, company_name: generalData.company_name };
        mockStore.save(db);
      }
      setGeneralMsg({ type: 'success', text: 'Configurações gerais atualizadas!' });
    } catch (e) {
      setGeneralMsg({ type: 'error', text: 'Erro ao salvar configurações gerais.' });
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      if (isSupabaseConfigured) {
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        setUsers(data || []);
      } else {
        const db = mockStore.get();
        setUsers(db.profiles);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadStages = async () => {
    setIsLoadingStages(true);
    try {
      if (isSupabaseConfigured) {
        const { data } = await supabase.from('pipeline_stages').select('*').order('order_position', { ascending: true });
        setStages(data || []);
      } else {
        const db = mockStore.get();
        const sorted = [...db.pipelineStages].sort((a, b) => a.order_position - b.order_position);
        setStages(sorted);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingStages(false);
    }
  };

  const handleSaveStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageForm.name.trim()) return;

    try {
      if (editingStage) {
        if (isSupabaseConfigured) {
          await supabase.from('pipeline_stages').update({ name: stageForm.name, color: stageForm.color }).eq('id', editingStage.id);
        } else {
          const db = mockStore.get();
          const idx = db.pipelineStages.findIndex((s) => s.id === editingStage.id);
          if (idx !== -1) {
            db.pipelineStages[idx].name = stageForm.name;
            db.pipelineStages[idx].color = stageForm.color;
            mockStore.save(db);
          }
        }
      } else {
        const newOrder = stages.length + 1;
        if (isSupabaseConfigured) {
          await supabase.from('pipeline_stages').insert([{ name: stageForm.name, color: stageForm.color, order_position: newOrder }]);
        } else {
          const db = mockStore.get();
          const newSt: PipelineStage = {
            id: 'stage-' + Date.now(),
            name: stageForm.name,
            color: stageForm.color,
            order_position: newOrder,
            created_at: new Date().toISOString(),
          };
          db.pipelineStages.push(newSt);
          mockStore.save(db);
        }
      }
      setIsStageModalOpen(false);
      setEditingStage(null);
      setStageForm({ name: '', color: '#6366f1' });
      await loadStages();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (stages.length <= 1) {
      alert('O funil deve conter pelo menos um estágio.');
      return;
    }
    if (!confirm('Deseja realmente remover este estágio do funil?')) return;

    try {
      if (isSupabaseConfigured) {
        await supabase.from('pipeline_stages').delete().eq('id', stageId);
      } else {
        const db = mockStore.get();
        db.pipelineStages = db.pipelineStages.filter((s) => s.id !== stageId);
        mockStore.save(db);
      }
      await loadStages();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-2">
        <SettingsIcon className="w-6 h-6 text-cortex-500" />
        Configurações do Sistema
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-2 md:col-span-1 h-fit space-y-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'profile' ? 'bg-cortex-600/20 text-cortex-400 border border-cortex-500/30' : 'text-dark-300 hover:bg-dark-800'
            )}
          >
            <User className="w-4 h-4" />
            Meu Perfil
          </button>
          <button
            onClick={() => setActiveTab('stages')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'stages' ? 'bg-cortex-600/20 text-cortex-400 border border-cortex-500/30' : 'text-dark-300 hover:bg-dark-800'
            )}
          >
            <LayoutTemplate className="w-4 h-4" />
            Estágios do Funil
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'users' ? 'bg-cortex-600/20 text-cortex-400 border border-cortex-500/30' : 'text-dark-300 hover:bg-dark-800'
            )}
          >
            <UsersIcon className="w-4 h-4" />
            Usuários & Equipe
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'general' ? 'bg-cortex-600/20 text-cortex-400 border border-cortex-500/30' : 'text-dark-300 hover:bg-dark-800'
            )}
          >
            <Building className="w-4 h-4" />
            Geral
          </button>
        </Card>

        <div className="md:col-span-3">
          <Card className="p-6">
            {activeTab === 'profile' && (
              <form onSubmit={saveProfile} className="space-y-6">
                <div className="flex items-center gap-4 pb-6 border-b border-dark-700">
                  <div className="w-16 h-16 rounded-full bg-cortex-600/30 border border-cortex-500 flex items-center justify-center text-xl font-bold text-cortex-300">
                    {getInitials(profileData.name || user?.email || 'Cortex')}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-dark-100">{profileData.name || 'Usuário Cortex'}</h2>
                    <p className="text-sm text-dark-400">{user?.email}</p>
                    <Badge variant="primary" className="mt-1">
                      {profile?.role === 'admin' ? 'Administrador' : 'Vendedor'}
                    </Badge>
                  </div>
                </div>

                {profileMsg.text && (
                  <div className={cn('p-3 rounded-lg text-sm', profileMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}>
                    {profileMsg.text}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Nome Completo" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} required />
                  <Input label="Telefone / WhatsApp" value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} placeholder="(11) 98765-4321" />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" variant="primary" loading={isSavingProfile}>Salvar Alterações</Button>
                </div>
              </form>
            )}

            {activeTab === 'stages' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-dark-700">
                  <div>
                    <h2 className="text-lg font-medium text-dark-100">Estágios do Funil de Vendas</h2>
                    <p className="text-sm text-dark-400">Personalize os estágios pelos quais as leads passam no Kanban comercial.</p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setEditingStage(null);
                      setStageForm({ name: '', color: '#6366f1' });
                      setIsStageModalOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Estágio
                  </Button>
                </div>

                {isLoadingStages ? (
                  <LoadingSpinner />
                ) : (
                  <div className="space-y-3">
                    {stages.map((stage, idx) => (
                      <div key={stage.id} className="flex items-center justify-between p-4 bg-dark-800/60 border border-dark-700/60 rounded-xl hover:border-dark-600 transition-all">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-dark-700 text-dark-300 text-xs flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: stage.color }} />
                          <span className="font-semibold text-dark-100">{stage.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditingStage(stage);
                              setStageForm({ name: stage.name, color: stage.color });
                              setIsStageModalOpen(true);
                            }}
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            Editar
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteStage(stage.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-dark-700">
                  <h2 className="text-lg font-medium text-dark-100">Equipe Comercial</h2>
                  <p className="text-sm text-dark-400">Usuários cadastrados no Cortex CRM e suas atribuições.</p>
                </div>

                {isLoadingUsers ? (
                  <LoadingSpinner />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-dark-700 text-xs text-dark-400 font-semibold uppercase">
                          <th className="py-3 px-4">Nome</th>
                          <th className="py-3 px-4">Telefone</th>
                          <th className="py-3 px-4">Função</th>
                          <th className="py-3 px-4">Data de Cadastro</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-700/60 text-sm">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-dark-800/40">
                            <td className="py-3 px-4 font-medium text-dark-100">{u.full_name}</td>
                            <td className="py-3 px-4 text-dark-300">{u.phone || '-'}</td>
                            <td className="py-3 px-4">
                              <Badge variant={u.role === 'admin' ? 'primary' : 'default'}>
                                {u.role === 'admin' ? 'Administrador' : 'Vendedor'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-dark-400">
                              {new Date(u.created_at).toLocaleDateString('pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'general' && (
              <form onSubmit={saveGeneral} className="space-y-6">
                <div className="pb-4 border-b border-dark-700">
                  <h2 className="text-lg font-medium text-dark-100">Configurações Gerais</h2>
                  <p className="text-sm text-dark-400">Informações institucionais e operacionais da Cortex.</p>
                </div>

                {generalMsg.text && (
                  <div className={cn('p-3 rounded-lg text-sm', generalMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}>
                    {generalMsg.text}
                  </div>
                )}

                <div className="space-y-4 max-w-lg">
                  <Input
                    label="Nome da Empresa"
                    value={generalData.company_name}
                    onChange={(e) => setGeneralData({ ...generalData, company_name: e.target.value })}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">Fuso Horário Operacional</label>
                    <Select value="America/Sao_Paulo" disabled>
                      <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                    </Select>
                  </div>

                  <div className="pt-2">
                    <span className="text-xs text-dark-400 block mb-2">Status da Conexão de Banco de Dados</span>
                    <Badge variant={isSupabaseConfigured ? 'success' : 'primary'}>
                      {isSupabaseConfigured ? 'Supabase Conectado (PostgreSQL)' : 'Banco Local Sincronizado (Multi-aba Ativa)'}
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-start">
                  <Button type="submit" variant="primary" loading={isSavingGeneral}>
                    Salvar Configurações
                  </Button>
                </div>

                <div className="pt-8 mt-8 border-t border-dark-700/80 space-y-3">
                  <h3 className="text-base font-semibold text-red-400">Zona de Inicialização & Limpeza</h3>
                  <p className="text-sm text-dark-400">
                    Deseja iniciar do zero para o uso oficial na Cortex? Clique abaixo para zerar todas as leads, acompanhamentos, propostas e vendas cadastradas.
                  </p>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => {
                      if (confirm('Atenção: Deseja realmente ZERAR todos os dados operacionais (leads, follow-ups, propostas e vendas)? Esta ação deixará o CRM pronto e limpo para o seu uso diário.')) {
                        mockStore.clearAllData();
                        alert('✅ Dados zerados com sucesso! O CRM está 100% limpo e pronto para a operação.');
                        window.location.reload();
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Zerar Dados Operacionais
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>

      {/* Modal de Estágio do Funil */}
      <Modal
        isOpen={isStageModalOpen}
        onClose={() => setIsStageModalOpen(false)}
        title={editingStage ? 'Editar Estágio do Funil' : 'Adicionar Novo Estágio'}
      >
        <form onSubmit={handleSaveStage} className="space-y-4">
          <Input
            label="Nome do Estágio"
            value={stageForm.name}
            onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
            placeholder="Ex: Proposta Técnica, Negociação Jurídica..."
            required
          />

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">Cor Identificadora</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={stageForm.color}
                onChange={(e) => setStageForm({ ...stageForm, color: e.target.value })}
                className="w-10 h-10 rounded border border-dark-700 bg-transparent cursor-pointer"
              />
              <span className="text-sm text-dark-300 font-mono">{stageForm.color}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsStageModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar Estágio
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
