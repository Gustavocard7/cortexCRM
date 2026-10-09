import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStore } from '@/lib/mockStore';
import { Demonstration, DemoStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useDemonstrations(filters?: { status?: DemoStatus; user_id?: string }) {
  const [data, setData] = useState<Demonstration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDemos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (isSupabaseConfigured) {
        let query = supabase
          .from('demonstrations')
          .select('*, lead:leads(*), user:profiles!demonstrations_user_id_fkey(*)')
          .order('scheduled_at', { ascending: false });

        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.user_id) query = query.eq('user_id', filters.user_id);

        const { data: demosData, error: demosError } = await query;
        if (demosError) throw demosError;
        setData(demosData as Demonstration[]);
      } else {
        let all = mockStore.getPopulatedDemos();
        if (filters?.status) {
          all = all.filter((d) => d.status === filters.status);
        }
        if (filters?.user_id) {
          all = all.filter((d) => d.user_id === filters.user_id);
        }
        all.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
        setData(all);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.user_id]);

  useEffect(() => {
    fetchDemos();
    if (!isSupabaseConfigured) {
      return mockStore.subscribe(fetchDemos);
    }
  }, [fetchDemos]);

  return {
    data,
    demos: data,
    loading,
    isLoading: loading,
    error,
    refetch: fetchDemos,
  };
}

export function useDemonstrationMutations() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const createDemonstration = async (demoData: Partial<Demonstration>) => {
    try {
      setLoading(true);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('demonstrations')
          .insert([demoData])
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const db = mockStore.get();
        const newDemo: Demonstration = {
          id: 'demo-' + Date.now(),
          lead_id: demoData.lead_id || '',
          user_id: demoData.user_id || user?.id || db.profiles[0].id,
          scheduled_at: demoData.scheduled_at || new Date().toISOString(),
          duration_minutes: demoData.duration_minutes || 60,
          status: demoData.status || 'scheduled',
          meeting_link: demoData.meeting_link || '',
          notes: demoData.notes || '',
          feedback: demoData.feedback || '',
          created_at: new Date().toISOString(),
        };
        db.demonstrations.unshift(newDemo);

        if (newDemo.lead_id) {
          db.leadActivities.unshift({
            id: 'act-' + Date.now(),
            lead_id: newDemo.lead_id,
            user_id: newDemo.user_id,
            type: 'meeting',
            description: `Demonstração agendada para ${new Date(newDemo.scheduled_at).toLocaleString('pt-BR')}`,
            created_at: new Date().toISOString(),
          });
        }

        mockStore.save(db);
        return newDemo;
      }
    } finally {
      setLoading(false);
    }
  };

  const updateDemonstration = async (id: string, updates: Partial<Demonstration>) => {
    try {
      setLoading(true);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('demonstrations')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const db = mockStore.get();
        const idx = db.demonstrations.findIndex((d) => d.id === id);
        if (idx !== -1) {
          db.demonstrations[idx] = { ...db.demonstrations[idx], ...updates };
          mockStore.save(db);
          return db.demonstrations[idx];
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    createDemonstration,
    updateDemonstration,
    loading,
    isLoading: loading,
  };
}

// Aliases for useDemos
export const useDemos = useDemonstrations;
export const useDemoMutations = () => {
  const muts = useDemonstrationMutations();
  return {
    createDemo: muts.createDemonstration,
    updateDemo: muts.updateDemonstration,
    completeDemo: (id: string, feedback?: string) => muts.updateDemonstration(id, { status: 'completed', feedback }),
    cancelDemo: (id: string) => muts.updateDemonstration(id, { status: 'cancelled' }),
    loading: muts.loading,
    isLoading: muts.isLoading,
  };
};
