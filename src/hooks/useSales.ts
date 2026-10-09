import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStore } from '@/lib/mockStore';
import { Sale, SaleStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useSales(filters?: { status?: SaleStatus; user_id?: string; period?: any }) {
  const [data, setData] = useState<Sale[]>([]);
  const [monthlyData, setMonthlyData] = useState<Array<{ month: string; revenue: number }>>([]);
  const [stats, setStats] = useState({ totalRevenue: 0, monthlyRevenue: 0, recurringRevenue: 0, avgTicket: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (isSupabaseConfigured) {
        let query = supabase
          .from('sales')
          .select('*, lead:leads(*), proposal:proposals(*), user:profiles!sales_user_id_fkey(*)')
          .order('closed_at', { ascending: false });

        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.user_id) query = query.eq('user_id', filters.user_id);

        const { data: salesData, error: salesError } = await query;
        if (salesError) throw salesError;

        const salesList = (salesData || []) as Sale[];
        setData(salesList);

        const totalRev = salesList.reduce((acc, s) => acc + (Number(s.value) || 0), 0);
        const mrr = salesList.reduce((acc, s) => acc + (Number(s.recurring_value) || 0), 0);
        setStats({
          totalRevenue: totalRev,
          monthlyRevenue: totalRev,
          recurringRevenue: mrr,
          avgTicket: salesList.length > 0 ? totalRev / salesList.length : 0,
          count: salesList.length,
        });

        setMonthlyData([
          { month: 'Mai', revenue: 45000 },
          { month: 'Jun', revenue: 78000 },
          { month: 'Jul', revenue: 95000 },
          { month: 'Ago', revenue: 130000 },
          { month: 'Set', revenue: 190000 },
          { month: 'Out', revenue: totalRev },
        ]);
      } else {
        const salesList = mockStore.getPopulatedSales();
        setData(salesList);

        const totalRev = salesList.reduce((acc, s) => acc + (Number(s.value) || 0), 0);
        const mrr = salesList.reduce((acc, s) => acc + (Number(s.recurring_value) || 0), 0);
        setStats({
          totalRevenue: totalRev,
          monthlyRevenue: totalRev,
          recurringRevenue: mrr,
          avgTicket: salesList.length > 0 ? Math.round(totalRev / salesList.length) : 0,
          count: salesList.length,
        });

        setMonthlyData([
          { month: 'Mai', revenue: 45000 },
          { month: 'Jun', revenue: 78000 },
          { month: 'Jul', revenue: 110000 },
          { month: 'Ago', revenue: 155000 },
          { month: 'Set', revenue: 220000 },
          { month: 'Out', revenue: totalRev },
        ]);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.user_id]);

  useEffect(() => {
    fetchSales();
    if (!isSupabaseConfigured) {
      return mockStore.subscribe(fetchSales);
    }
  }, [fetchSales]);

  return {
    data,
    sales: data,
    monthlyData,
    stats,
    loading,
    isLoading: loading,
    error,
    refetch: fetchSales,
  };
}

export function useSaleMutations() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const createSale = async (saleData: Partial<Sale>) => {
    try {
      setLoading(true);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('sales')
          .insert([saleData])
          .select()
          .single();
        if (error) throw error;

        if (saleData.lead_id) {
          await supabase.from('leads').update({ status: 'won' }).eq('id', saleData.lead_id);
          await supabase.from('lead_activities').insert([
            {
              lead_id: saleData.lead_id,
              type: 'stage_change',
              description: `Venda concluída! Valor: R$ ${(Number(saleData.value) || 0).toLocaleString('pt-BR')}`,
              user_id: user?.id,
            },
          ]);
        }
        return data;
      } else {
        const db = mockStore.get();
        const newSale: Sale = {
          id: 'sale-' + Date.now(),
          lead_id: saleData.lead_id || '',
          proposal_id: saleData.proposal_id || null,
          user_id: saleData.user_id || user?.id || db.profiles[0].id,
          value: Number(saleData.value) || 0,
          recurring_value: Number(saleData.recurring_value) || 0,
          payment_method: saleData.payment_method || 'pix',
          installments: Number(saleData.installments) || 1,
          status: saleData.status || 'paid',
          closed_at: new Date().toISOString(),
          notes: saleData.notes || '',
          created_at: new Date().toISOString(),
        };

        db.sales.unshift(newSale);

        if (newSale.lead_id) {
          const lIdx = db.leads.findIndex((l) => l.id === newSale.lead_id);
          if (lIdx !== -1) {
            db.leads[lIdx].status = 'won';
            db.leads[lIdx].stage_id = db.pipelineStages[db.pipelineStages.length - 1].id;
          }
          db.leadActivities.unshift({
            id: 'act-' + Date.now(),
            lead_id: newSale.lead_id,
            user_id: newSale.user_id,
            type: 'stage_change',
            description: `Venda fechada com sucesso! Valor: R$ ${newSale.value.toLocaleString('pt-BR')}`,
            created_at: new Date().toISOString(),
          });
        }

        mockStore.save(db);
        return newSale;
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSale = async (id: string, updates: Partial<Sale>) => {
    try {
      setLoading(true);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('sales')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const db = mockStore.get();
        const idx = db.sales.findIndex((s) => s.id === id);
        if (idx !== -1) {
          db.sales[idx] = { ...db.sales[idx], ...updates };
          mockStore.save(db);
          return db.sales[idx];
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return { createSale, updateSale, loading, isLoading: loading };
}
