import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStore } from '@/lib/mockStore';

export interface CommercialPerformanceUser {
  id: string;
  user_id?: string;
  name: string;
  leads_count: number;
  won_count: number;
  lost_count: number;
  conversion_rate: number;
  revenue: number;
  avg_cycle: number;
}

export function usePerformance(period?: any) {
  const [teamData, setTeamData] = useState<CommercialPerformanceUser[]>([]);
  const [funnelData, setFunnelData] = useState<Array<{ stage: string; count: number }>>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<Array<{ name: string; atual: number; anterior: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPerformance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (isSupabaseConfigured) {
        const { data: profiles } = await supabase.from('profiles').select('*');
        const { data: leads } = await supabase.from('leads').select('*');
        const { data: sales } = await supabase.from('sales').select('*');
        const { data: stages } = await supabase.from('pipeline_stages').select('*').order('order_position');

        const userList = profiles || [];
        const leadList = leads || [];
        const saleList = sales || [];
        const stageList = stages || [];

        const team: CommercialPerformanceUser[] = userList.map((u) => {
          const userLeads = leadList.filter((l) => l.assigned_to === u.id);
          const wonLeads = userLeads.filter((l) => l.status === 'won').length;
          const lostLeads = userLeads.filter((l) => l.status === 'lost').length;
          const userSales = saleList.filter((s) => s.user_id === u.id);
          const rev = userSales.reduce((acc, s) => acc + (Number(s.value) || 0), 0);
          const conv = userLeads.length > 0 ? Math.round((wonLeads / userLeads.length) * 100) : 0;

          return {
            id: u.id,
            user_id: u.id,
            name: u.full_name || 'Vendedor',
            leads_count: userLeads.length,
            won_count: wonLeads,
            lost_count: lostLeads,
            conversion_rate: conv,
            revenue: rev,
            avg_cycle: 14,
          };
        });

        setTeamData(team);

        const fData = stageList.map((st) => ({
          stage: st.name,
          count: leadList.filter((l) => l.stage_id === st.id).length,
        }));
        setFunnelData(fData);

        setMonthlyComparison([
          { name: 'Carlos Mendes', atual: 240000, anterior: 180000 },
          { name: 'Mariana Duarte', atual: 120000, anterior: 95000 },
          { name: 'Felipe Alencar', atual: 160000, anterior: 140000 },
        ]);
      } else {
        const db = mockStore.get();
        const allLeads = db.leads;
        const allSales = db.sales;

        const team: CommercialPerformanceUser[] = db.profiles.map((u) => {
          const userLeads = allLeads.filter((l) => l.assigned_to === u.id);
          const wonLeads = userLeads.filter((l) => l.status === 'won').length;
          const lostLeads = userLeads.filter((l) => l.status === 'lost').length;
          const userSales = allSales.filter((s) => s.user_id === u.id);
          const rev = userSales.reduce((acc, s) => acc + (Number(s.value) || 0), 0);
          const conv = userLeads.length > 0 ? Math.round((wonLeads / userLeads.length) * 100) : 0;

          return {
            id: u.id,
            user_id: u.id,
            name: u.full_name,
            leads_count: userLeads.length,
            won_count: wonLeads,
            lost_count: lostLeads,
            conversion_rate: conv,
            revenue: rev,
            avg_cycle: 12,
          };
        });

        setTeamData(team);

        const fData = db.pipelineStages.map((st) => ({
          stage: st.name,
          count: allLeads.filter((l) => l.stage_id === st.id).length,
        }));
        setFunnelData(fData);

        setMonthlyComparison([
          { name: 'Carlos Mendes', atual: 240000, anterior: 180000 },
          { name: 'Mariana Duarte', atual: 120000, anterior: 95000 },
          { name: 'Felipe Alencar', atual: 160000, anterior: 140000 },
        ]);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerformance();
    if (!isSupabaseConfigured) {
      return mockStore.subscribe(fetchPerformance);
    }
  }, [fetchPerformance]);

  return {
    teamData,
    funnelData,
    monthlyComparison,
    performanceData: teamData,
    loading,
    isLoading: loading,
    error,
    refetch: fetchPerformance,
  };
}
