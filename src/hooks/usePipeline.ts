import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStore } from '@/lib/mockStore';
import { Lead, PipelineStage } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function usePipeline() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsByStage, setLeadsByStage] = useState<Record<string, Lead[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPipeline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (isSupabaseConfigured) {
        const { data: stagesData, error: stagesError } = await supabase
          .from('pipeline_stages')
          .select('*')
          .order('order_position', { ascending: true });

        if (stagesError) throw stagesError;

        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('*, stage:pipeline_stages(*), assignee:profiles!leads_assigned_to_fkey(*)')
          .eq('status', 'active');

        if (leadsError) throw leadsError;

        const stageList = (stagesData || []) as PipelineStage[];
        const leadList = (leadsData || []) as Lead[];

        const groupedLeads: Record<string, Lead[]> = {};
        stageList.forEach((s) => (groupedLeads[s.id] = []));
        leadList.forEach((lead) => {
          if (groupedLeads[lead.stage_id]) {
            groupedLeads[lead.stage_id].push(lead);
          } else {
            groupedLeads[lead.stage_id] = [lead];
          }
        });

        setStages(stageList);
        setLeads(leadList);
        setLeadsByStage(groupedLeads);
      } else {
        const db = mockStore.get();
        const stageList = [...db.pipelineStages].sort((a, b) => a.order_position - b.order_position);
        const allPopulated = mockStore.getPopulatedLeads();
        const activeLeads = allPopulated.filter((l) => l.status === 'active');

        const grouped: Record<string, Lead[]> = {};
        stageList.forEach((s) => (grouped[s.id] = []));
        activeLeads.forEach((lead) => {
          if (grouped[lead.stage_id]) {
            grouped[lead.stage_id].push(lead);
          } else {
            grouped[lead.stage_id] = [lead];
          }
        });

        setStages(stageList);
        setLeads(activeLeads);
        setLeadsByStage(grouped);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipeline();
    if (!isSupabaseConfigured) {
      return mockStore.subscribe(fetchPipeline);
    }
  }, [fetchPipeline]);

  return {
    stages,
    leads,
    leadsByStage,
    loading,
    isLoading: loading,
    error,
    refetch: fetchPipeline,
    data: {
      stages,
      leads,
      leadsByStage,
    },
  };
}

export function usePipelineMutations() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const moveLeadToStage = async (leadId: string, newStageId: string) => {
    try {
      setLoading(true);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('leads')
          .update({ stage_id: newStageId, updated_at: new Date().toISOString() })
          .eq('id', leadId)
          .select()
          .single();

        if (error) throw error;

        await supabase.from('lead_activities').insert([
          {
            lead_id: leadId,
            type: 'stage_change',
            description: `Movido no funil de vendas`,
            user_id: user?.id,
          },
        ]);

        return data;
      } else {
        const db = mockStore.get();
        const leadIdx = db.leads.findIndex((l) => l.id === leadId);
        if (leadIdx !== -1) {
          db.leads[leadIdx].stage_id = newStageId;
          db.leads[leadIdx].updated_at = new Date().toISOString();

          const targetStage = db.pipelineStages.find((s) => s.id === newStageId);
          db.leadActivities.unshift({
            id: 'act-' + Date.now(),
            lead_id: leadId,
            user_id: user?.id || db.profiles[0].id,
            type: 'stage_change',
            description: `Lead movida para: ${targetStage?.name || 'Novo Estágio'}`,
            created_at: new Date().toISOString(),
          });

          mockStore.save(db);
          return db.leads[leadIdx];
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const createStage = async (stageData: Partial<PipelineStage>) => {
    try {
      setLoading(true);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('pipeline_stages')
          .insert([stageData])
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const db = mockStore.get();
        const newStage: PipelineStage = {
          id: 'stage-' + Date.now(),
          name: stageData.name || 'Novo Estágio',
          order_position: stageData.order_position ?? (db.pipelineStages.length + 1),
          color: stageData.color || '#6366f1',
          created_at: new Date().toISOString(),
        };
        db.pipelineStages.push(newStage);
        mockStore.save(db);
        return newStage;
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStage = async (id: string, updates: Partial<PipelineStage>) => {
    try {
      setLoading(true);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('pipeline_stages')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const db = mockStore.get();
        const idx = db.pipelineStages.findIndex((s) => s.id === id);
        if (idx !== -1) {
          db.pipelineStages[idx] = { ...db.pipelineStages[idx], ...updates };
          mockStore.save(db);
          return db.pipelineStages[idx];
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteStage = async (id: string) => {
    try {
      setLoading(true);
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('pipeline_stages').delete().eq('id', id);
        if (error) throw error;
      } else {
        const db = mockStore.get();
        db.pipelineStages = db.pipelineStages.filter((s) => s.id !== id);
        mockStore.save(db);
      }
    } finally {
      setLoading(false);
    }
  };

  const reorderStages = async (orderedStageIds: string[]) => {
    try {
      setLoading(true);
      if (isSupabaseConfigured) {
        const updates = orderedStageIds.map((id, index) => ({
          id,
          order_position: index + 1,
        }));
        const { error } = await supabase.from('pipeline_stages').upsert(updates);
        if (error) throw error;
      } else {
        const db = mockStore.get();
        orderedStageIds.forEach((id, idx) => {
          const s = db.pipelineStages.find((st) => st.id === id);
          if (s) s.order_position = idx + 1;
        });
        mockStore.save(db);
      }
    } finally {
      setLoading(false);
    }
  };

  return { moveLeadToStage, createStage, updateStage, deleteStage, reorderStages, loading, isLoading: loading };
}
