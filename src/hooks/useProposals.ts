import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStore } from '@/lib/mockStore';
import { Proposal, ProposalStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useProposals(filters?: { status?: ProposalStatus; user_id?: string }) {
  const [data, setData] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (isSupabaseConfigured) {
        let query = supabase
          .from('proposals')
          .select('*, lead:leads(*), user:profiles!proposals_user_id_fkey(*)')
          .order('created_at', { ascending: false });

        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.user_id) query = query.eq('user_id', filters.user_id);

        const { data: proposalsData, error: proposalsError } = await query;
        if (proposalsError) throw proposalsError;
        setData(proposalsData as Proposal[]);
      } else {
        let all = mockStore.getPopulatedProposals();
        if (filters?.status) {
          all = all.filter((p) => p.status === filters.status);
        }
        if (filters?.user_id) {
          all = all.filter((p) => p.user_id === filters.user_id);
        }
        all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setData(all);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.user_id]);

  useEffect(() => {
    fetchProposals();
    if (!isSupabaseConfigured) {
      return mockStore.subscribe(fetchProposals);
    }
  }, [fetchProposals]);

  return {
    data,
    proposals: data,
    loading,
    isLoading: loading,
    error,
    refetch: fetchProposals,
  };
}

export function useProposalMutations() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const createProposal = async (proposalData: Partial<Proposal>) => {
    try {
      setLoading(true);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('proposals')
          .insert([proposalData])
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const db = mockStore.get();
        const newProp: Proposal = {
          id: 'prop-' + Date.now(),
          lead_id: proposalData.lead_id || '',
          user_id: proposalData.user_id || user?.id || db.profiles[0].id,
          title: proposalData.title || 'Proposta Comercial',
          value: Number(proposalData.value) || 0,
          status: proposalData.status || 'draft',
          valid_until: proposalData.valid_until || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
          sent_at: proposalData.sent_at || null,
          notes: proposalData.notes || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        db.proposals.unshift(newProp);

        if (newProp.lead_id) {
          db.leadActivities.unshift({
            id: 'act-' + Date.now(),
            lead_id: newProp.lead_id,
            user_id: newProp.user_id,
            type: 'email',
            description: `Proposta "${newProp.title}" gerada no valor de R$ ${newProp.value.toLocaleString('pt-BR')}`,
            created_at: new Date().toISOString(),
          });
        }

        mockStore.save(db);
        return newProp;
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProposal = async (
    idOrObj: string | { id: string; [key: string]: any },
    updatesArg?: Partial<Proposal>
  ) => {
    const id = typeof idOrObj === 'string' ? idOrObj : idOrObj.id;
    const updates = typeof idOrObj === 'object' ? { ...idOrObj } : updatesArg || {};
    delete (updates as any).id;

    try {
      setLoading(true);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('proposals')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const db = mockStore.get();
        const idx = db.proposals.findIndex((p) => p.id === id);
        if (idx !== -1) {
          db.proposals[idx] = {
            ...db.proposals[idx],
            ...updates,
            updated_at: new Date().toISOString(),
          };
          mockStore.save(db);
          return db.proposals[idx];
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteProposal = async (id: string) => {
    try {
      setLoading(true);
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('proposals').delete().eq('id', id);
        if (error) throw error;
      } else {
        const db = mockStore.get();
        db.proposals = db.proposals.filter((p) => p.id !== id);
        mockStore.save(db);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendProposal = async (id: string) => {
    return updateProposal(id, { status: 'sent', sent_at: new Date().toISOString() });
  };

  const acceptProposal = async (id: string, leadId: string) => {
    return updateProposal(id, { status: 'accepted' });
  };

  const rejectProposal = async (id: string) => {
    return updateProposal(id, { status: 'rejected' });
  };

  return {
    createProposal,
    updateProposal,
    deleteProposal,
    sendProposal,
    acceptProposal,
    rejectProposal,
    loading,
    isLoading: loading,
  };
}
