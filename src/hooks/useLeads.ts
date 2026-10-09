import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStore } from '@/lib/mockStore';
import { Lead, LeadStatus, LeadActivity } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useLeads(filters?: { status?: LeadStatus; stage_id?: string; assigned_to?: string; search?: string }) {
  const [data, setData] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (isSupabaseConfigured) {
        let query = supabase
          .from('leads')
          .select('*, stage:pipeline_stages(*), assignee:profiles!leads_assigned_to_fkey(*)')
          .order('created_at', { ascending: false });

        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.stage_id) query = query.eq('stage_id', filters.stage_id);
        if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
        if (filters?.search) {
          query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
        }

        const { data: leadsData, error: leadsError } = await query;
        if (leadsError) throw leadsError;
        setData(leadsData as Lead[]);
      } else {
        let allLeads = mockStore.getPopulatedLeads();
        if (filters?.status) allLeads = allLeads.filter((l) => l.status === filters.status);
        if (filters?.stage_id) allLeads = allLeads.filter((l) => l.stage_id === filters.stage_id);
        if (filters?.assigned_to) allLeads = allLeads.filter((l) => l.assigned_to === filters.assigned_to);
        if (filters?.search) {
          const s = filters.search.toLowerCase();
          allLeads = allLeads.filter(
            (l) =>
              l.name.toLowerCase().includes(s) ||
              l.company.toLowerCase().includes(s) ||
              l.email.toLowerCase().includes(s)
          );
        }
        setData(allLeads);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.stage_id, filters?.assigned_to, filters?.search]);

  useEffect(() => {
    fetchLeads();
    if (!isSupabaseConfigured) {
      return mockStore.subscribe(fetchLeads);
    }
  }, [fetchLeads]);

  return {
    data,
    leads: data,
    loading,
    isLoading: loading,
    error,
    refetch: fetchLeads,
  };
}

export function useLead(id: string) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLead = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);

      if (isSupabaseConfigured) {
        const { data: leadData, error: leadError } = await supabase
          .from('leads')
          .select('*, stage:pipeline_stages(*), assignee:profiles!leads_assigned_to_fkey(*)')
          .eq('id', id)
          .single();

        if (leadError) throw leadError;

        const { data: activitiesData, error: activitiesError } = await supabase
          .from('lead_activities')
          .select('*, user:profiles(*)')
          .eq('lead_id', id)
          .order('created_at', { ascending: false });

        if (activitiesError) throw activitiesError;

        setLead(leadData as Lead);
        setActivities(activitiesData as LeadActivity[]);
      } else {
        const leads = mockStore.getPopulatedLeads();
        const found = leads.find((l) => l.id === id) || null;
        setLead(found);

        const db = mockStore.get();
        const acts = db.leadActivities
          .filter((a) => a.lead_id === id)
          .map((a) => ({
            ...a,
            user: db.profiles.find((p) => p.id === a.user_id),
          }));
        setActivities(acts);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLead();
    if (!isSupabaseConfigured) {
      return mockStore.subscribe(fetchLead);
    }
  }, [fetchLead]);

  return { lead, activities, loading, isLoading: loading, error, refetch: fetchLead };
}

export function useLeadMutations() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const createLead = async (leadData: Partial<Lead>) => {
    // ENFORCING GOLDEN RULE: Nenhuma lead fica sem próxima ação definida
    if (!leadData.next_action_date || !leadData.next_action_description?.trim()) {
      throw new Error(
        'Regra de Ouro da Cortex: Toda lead deve possuir uma próxima ação definida com data e descrição!'
      );
    }

    try {
      setLoading(true);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('leads')
          .insert([{ ...leadData, assigned_to: leadData.assigned_to || user?.id }])
          .select()
          .single();

        if (error) throw error;

        if (data) {
          await supabase.from('lead_activities').insert([
            {
              lead_id: data.id,
              type: 'note',
              description: `Lead criada no sistema Cortex. Próxima ação: ${data.next_action_description}`,
              user_id: user?.id,
            },
          ]);
        }
        return data;
      } else {
        const db = mockStore.get();
        const newLead: Lead = {
          id: 'lead-' + Date.now(),
          name: leadData.name || 'Nova Lead',
          email: leadData.email || '',
          phone: leadData.phone || '',
          company: leadData.company || '',
          position: leadData.position || '',
          source: leadData.source || 'other',
          stage_id: leadData.stage_id || db.pipelineStages[0].id,
          assigned_to: leadData.assigned_to || user?.id || db.profiles[0].id,
          status: leadData.status || 'active',
          estimated_value: Number(leadData.estimated_value) || 0,
          notes: leadData.notes || '',
          next_action_date: leadData.next_action_date,
          next_action_description: leadData.next_action_description.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        db.leads.unshift(newLead);
        db.leadActivities.unshift({
          id: 'act-' + Date.now(),
          lead_id: newLead.id,
          user_id: user?.id || db.profiles[0].id,
          type: 'note',
          description: `Lead criada. Próxima ação: ${newLead.next_action_description}`,
          created_at: new Date().toISOString(),
        });

        // Also automatically create corresponding follow up item for the calendar
        db.followUps.unshift({
          id: 'fu-' + Date.now(),
          lead_id: newLead.id,
          user_id: newLead.assigned_to,
          title: newLead.next_action_description,
          description: `Ação vinculada à lead ${newLead.name} (${newLead.company})`,
          due_date: newLead.next_action_date,
          priority: 'medium',
          status: 'pending',
          completed_at: null,
          created_at: new Date().toISOString(),
        });

        mockStore.save(db);
        return newLead;
      }
    } finally {
      setLoading(false);
    }
  };

  const updateLead = async (
    idOrObj: string | ({ id: string } & Partial<Lead>),
    updatesArg?: Partial<Lead>,
    stageChanged: boolean = false
  ) => {
    const id = typeof idOrObj === 'string' ? idOrObj : idOrObj.id;
    const updates = typeof idOrObj === 'object' ? { ...idOrObj } : updatesArg || {};
    delete (updates as any).id;

    // Check golden rule if next action fields are present
    if (updates.next_action_date !== undefined || updates.next_action_description !== undefined) {
      if (!updates.next_action_date || !updates.next_action_description?.trim()) {
        throw new Error(
          'Regra de Ouro da Cortex: Não é permitido remover a próxima ação da lead.'
        );
      }
    }

    try {
      setLoading(true);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('leads')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        if (stageChanged && updates.stage_id) {
          await supabase.from('lead_activities').insert([
            {
              lead_id: id,
              type: 'stage_change',
              description: `Estágio do funil atualizado`,
              user_id: user?.id,
            },
          ]);
        }
        return data;
      } else {
        const db = mockStore.get();
        const index = db.leads.findIndex((l) => l.id === id);
        if (index === -1) throw new Error('Lead não encontrada');

        const oldLead = db.leads[index];
        const updatedLead = {
          ...oldLead,
          ...updates,
          updated_at: new Date().toISOString(),
        };
        db.leads[index] = updatedLead;

        if (stageChanged && updates.stage_id) {
          const newStage = db.pipelineStages.find((s) => s.id === updates.stage_id);
          db.leadActivities.unshift({
            id: 'act-' + Date.now(),
            lead_id: id,
            user_id: user?.id || db.profiles[0].id,
            type: 'stage_change',
            description: `Lead avançou para o estágio: ${newStage?.name || 'Novo Estágio'}`,
            created_at: new Date().toISOString(),
          });
        }

        mockStore.save(db);
        return updatedLead;
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteLead = async (id: string) => {
    try {
      setLoading(true);
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('leads').delete().eq('id', id);
        if (error) throw error;
      } else {
        const db = mockStore.get();
        db.leads = db.leads.filter((l) => l.id !== id);
        db.leadActivities = db.leadActivities.filter((a) => a.lead_id !== id);
        db.followUps = db.followUps.filter((f) => f.lead_id !== id);
        db.demonstrations = db.demonstrations.filter((d) => d.lead_id !== id);
        db.proposals = db.proposals.filter((p) => p.lead_id !== id);
        mockStore.save(db);
      }
    } finally {
      setLoading(false);
    }
  };

  return { createLead, updateLead, deleteLead, loading, isLoading: loading };
}
