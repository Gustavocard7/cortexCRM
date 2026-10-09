import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStore } from '@/lib/mockStore';
import { FollowUp, FollowUpStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useFollowUps(filters?: { status?: FollowUpStatus; user_id?: string; period?: string }) {
  const [data, setData] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFollowUps = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (isSupabaseConfigured) {
        let query = supabase
          .from('follow_ups')
          .select('*, lead:leads(*), user:profiles!follow_ups_user_id_fkey(*)')
          .order('due_date', { ascending: true });

        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.user_id) query = query.eq('user_id', filters.user_id);

        const { data: followUpsData, error: followUpsError } = await query;
        if (followUpsError) throw followUpsError;
        setData(followUpsData as FollowUp[]);
      } else {
        let all = mockStore.getPopulatedFollowUps();
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        if (filters?.period === 'today') {
          all = all.filter((f) => f.due_date.startsWith(todayStr));
        } else if (filters?.period === 'overdue') {
          all = all.filter((f) => new Date(f.due_date) < now && f.status === 'pending');
        } else if (filters?.period === 'next_7_days' || filters?.period === 'week') {
          const nextWeek = new Date(now.getTime() + 7 * 86400000);
          all = all.filter((f) => new Date(f.due_date) >= now && new Date(f.due_date) <= nextWeek);
        }

        if (filters?.status) {
          all = all.filter((f) => f.status === filters.status);
        }
        if (filters?.user_id) {
          all = all.filter((f) => f.user_id === filters.user_id);
        }

        all.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
        setData(all);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.user_id, filters?.period]);

  useEffect(() => {
    fetchFollowUps();
    if (!isSupabaseConfigured) {
      return mockStore.subscribe(fetchFollowUps);
    }
  }, [fetchFollowUps]);

  return {
    data,
    followUps: data,
    loading,
    isLoading: loading,
    error,
    refetch: fetchFollowUps,
  };
}

export function useFollowUpMutations() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const createFollowUp = async (followUpData: Partial<FollowUp>) => {
    try {
      setLoading(true);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('follow_ups')
          .insert([followUpData])
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const db = mockStore.get();
        const newFu: FollowUp = {
          id: 'fu-' + Date.now(),
          lead_id: followUpData.lead_id || '',
          user_id: followUpData.user_id || user?.id || db.profiles[0].id,
          title: followUpData.title || 'Acompanhamento',
          description: followUpData.description || '',
          due_date: followUpData.due_date || new Date().toISOString(),
          priority: followUpData.priority || 'medium',
          status: followUpData.status || 'pending',
          completed_at: null,
          created_at: new Date().toISOString(),
        };

        db.followUps.unshift(newFu);

        // Update lead's next action date and description per Golden Rule
        if (newFu.lead_id) {
          const leadIdx = db.leads.findIndex((l) => l.id === newFu.lead_id);
          if (leadIdx !== -1) {
            db.leads[leadIdx].next_action_date = newFu.due_date;
            db.leads[leadIdx].next_action_description = newFu.title;
          }
        }

        mockStore.save(db);
        return newFu;
      }
    } finally {
      setLoading(false);
    }
  };

  const completeFollowUp = async (id: string, notes?: string) => {
    try {
      setLoading(true);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('follow_ups')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            ...(notes ? { description: notes } : {}),
          })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const db = mockStore.get();
        const idx = db.followUps.findIndex((f) => f.id === id);
        if (idx !== -1) {
          db.followUps[idx].status = 'completed';
          db.followUps[idx].completed_at = new Date().toISOString();
          if (notes) {
            db.followUps[idx].description = (db.followUps[idx].description ? db.followUps[idx].description + '\n' : '') + notes;
          }
          mockStore.save(db);
          return db.followUps[idx];
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelFollowUp = async (id: string) => {
    try {
      setLoading(true);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('follow_ups')
          .update({ status: 'cancelled' })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const db = mockStore.get();
        const idx = db.followUps.findIndex((f) => f.id === id);
        if (idx !== -1) {
          db.followUps[idx].status = 'cancelled';
          mockStore.save(db);
          return db.followUps[idx];
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return { createFollowUp, completeFollowUp, cancelFollowUp, loading, isLoading: loading };
}
