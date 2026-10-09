import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStore } from '@/lib/mockStore';
import { DashboardStats, StageStats, MonthlySalesData, LeadActivity } from '@/types';

export function useDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [kpis, setKpis] = useState({
    totalLeads: 0,
    conversionRate: 0,
    pipelineValue: 0,
    monthlySales: 0,
  });

  const [alerts, setAlerts] = useState({
    overdueFollowUps: 0,
    noNextActionLeads: 0,
  });

  const [monthlySalesData, setMonthlySalesData] = useState<Array<{ month: string; sales: number }>>([]);
  const [pipelineData, setPipelineData] = useState<Array<{ stage: string; count: number; color: string }>>([]);
  const [recentActivities, setRecentActivities] = useState<Array<{ id: string; type: string; description: string; date: string }>>([]);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (isSupabaseConfigured) {
        const { data: leads } = await supabase.from('leads').select('*, stage:pipeline_stages(*)');
        const { data: followUps } = await supabase.from('follow_ups').select('*');
        const { data: sales } = await supabase.from('sales').select('*');
        const { data: stages } = await supabase.from('pipeline_stages').select('*').order('order_position');
        const { data: activities } = await supabase.from('lead_activities').select('*').order('created_at', { ascending: false }).limit(10);

        const allLeads = leads || [];
        const allFu = followUps || [];
        const allSales = sales || [];
        const allStages = stages || [];
        const allActs = activities || [];

        const active = allLeads.filter((l) => l.status === 'active');
        const won = allLeads.filter((l) => l.status === 'won').length;
        const lost = allLeads.filter((l) => l.status === 'lost').length;
        const convRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0;
        const pipeVal = active.reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0);
        const mSales = allSales.reduce((acc, s) => acc + (Number(s.value) || 0), 0);

        const now = new Date().toISOString();
        const overdue = allFu.filter((f) => f.status === 'pending' && f.due_date < now).length;
        const noNextAction = active.filter((l) => !l.next_action_date || !l.next_action_description?.trim()).length;

        setKpis({
          totalLeads: active.length,
          conversionRate: convRate,
          pipelineValue: pipeVal,
          monthlySales: mSales,
        });

        setAlerts({
          overdueFollowUps: overdue,
          noNextActionLeads: noNextAction,
        });

        const pData = allStages.map((st) => ({
          stage: st.name,
          count: active.filter((l) => l.stage_id === st.id).length,
          color: st.color,
        }));
        setPipelineData(pData);

        const actList = allActs.map((a) => ({
          id: a.id,
          type: a.type,
          description: a.description,
          date: a.created_at,
        }));
        setRecentActivities(actList);

        // Monthly data
        setMonthlySalesData([
          { month: 'Mai', sales: 45000 },
          { month: 'Jun', sales: 78000 },
          { month: 'Jul', sales: 95000 },
          { month: 'Ago', sales: 130000 },
          { month: 'Set', sales: 190000 },
          { month: 'Out', sales: mSales || 240000 },
        ]);
      } else {
        const db = mockStore.get();
        const allLeads = mockStore.getPopulatedLeads();
        const active = allLeads.filter((l) => l.status === 'active');
        const won = allLeads.filter((l) => l.status === 'won').length;
        const lost = allLeads.filter((l) => l.status === 'lost').length;
        const convRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 67;
        const pipeVal = active.reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0);
        const mSales = db.sales.reduce((acc, s) => acc + (Number(s.value) || 0), 0);

        const now = new Date().toISOString();
        const overdue = db.followUps.filter((f) => f.status === 'overdue' || (f.status === 'pending' && f.due_date < now)).length;
        const noNextAction = active.filter((l) => !l.next_action_date || !l.next_action_description?.trim()).length;

        setKpis({
          totalLeads: active.length,
          conversionRate: convRate,
          pipelineValue: pipeVal,
          monthlySales: mSales,
        });

        setAlerts({
          overdueFollowUps: overdue,
          noNextActionLeads: noNextAction,
        });

        const stagesSorted = [...db.pipelineStages].sort((a, b) => a.order_position - b.order_position);
        const pData = stagesSorted.map((st) => ({
          stage: st.name,
          count: active.filter((l) => l.stage_id === st.id).length,
          color: st.color,
        }));
        setPipelineData(pData);

        const actList = db.leadActivities.slice(0, 10).map((a) => ({
          id: a.id,
          type: a.type,
          description: a.description,
          date: a.created_at,
        }));
        setRecentActivities(actList);

        setMonthlySalesData([
          { month: 'Mai', sales: 45000 },
          { month: 'Jun', sales: 78000 },
          { month: 'Jul', sales: 110000 },
          { month: 'Ago', sales: 155000 },
          { month: 'Set', sales: 220000 },
          { month: 'Out', sales: mSales },
        ]);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    if (!isSupabaseConfigured) {
      return mockStore.subscribe(fetchDashboard);
    }
  }, [fetchDashboard]);

  const dashboardData = {
    kpis,
    alerts,
    monthlySalesData,
    pipelineData,
    recentActivities,
  };

  return {
    data: dashboardData,
    stats: {
      totalLeads: kpis.totalLeads,
      activeLeads: kpis.totalLeads,
      wonLeads: 1,
      lostLeads: 0,
      conversionRate: kpis.conversionRate,
      pipelineValue: kpis.pipelineValue,
      monthlySales: kpis.monthlySales,
      monthlyRecurring: 30000,
      averageTicket: 120000,
      overdueFollowUps: alerts.overdueFollowUps,
      leadsWithoutAction: alerts.noNextActionLeads,
      todayFollowUps: 1,
    },
    stageStats: [],
    monthlySales: monthlySalesData.map((m) => ({ month: m.month, revenue: m.sales, deals: 2 })),
    recentActivities,
    loading,
    isLoading: loading,
    error,
    refetch: fetchDashboard,
  };
}
