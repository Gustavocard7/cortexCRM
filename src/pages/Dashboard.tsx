import React from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, TrendingUp, DollarSign, Activity, AlertCircle, CalendarClock, Target, Phone, Mail, CheckCircle, Clock } from 'lucide-react';
import { Card, LoadingSpinner, EmptyState } from '@/components/ui';
import { formatCurrency, formatRelativeDate, cn } from '@/lib/utils';
import { useDashboard } from '@/hooks/useDashboard';

export default function Dashboard() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <div className="flex h-full items-center justify-center p-8"><LoadingSpinner /></div>;
  if (error || !data) return <div className="p-8"><EmptyState title="Erro ao carregar" description="Não foi possível carregar os dados do dashboard." icon={AlertCircle} /></div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-dark-100 flex items-center gap-2">
            Visão Geral
            <span className="cyber-pill text-[10px] hidden sm:inline-flex">AI Telemetry</span>
          </h1>
          <p className="text-xs text-dark-400">Monitoramento comercial e indicadores em tempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-dark-400 capitalize">{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card p-4 hover:border-cortex-500/40 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cortex-500/20 border border-cortex-500/30 p-2.5 text-cortex-400 shadow-[0_0_12px_rgba(99,102,241,0.3)]"><Users className="h-5 w-5" /></div>
            <div>
              <p className="text-xs font-mono tracking-wider text-dark-400 uppercase">Total Leads Ativos</p>
              <p className="text-2xl font-extrabold text-white tracking-tight">{data.kpis.totalLeads}</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card p-4 hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 p-2.5 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]"><TrendingUp className="h-5 w-5" /></div>
            <div>
              <p className="text-xs font-mono tracking-wider text-dark-400 uppercase">Taxa Conversão</p>
              <p className="text-2xl font-extrabold text-white tracking-tight">{data.kpis.conversionRate}%</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card p-4 hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/20 border border-blue-500/30 p-2.5 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.3)]"><Target className="h-5 w-5" /></div>
            <div>
              <p className="text-xs font-mono tracking-wider text-dark-400 uppercase">Valor Pipeline</p>
              <p className="text-2xl font-extrabold text-white tracking-tight">{formatCurrency(data.kpis.pipelineValue)}</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card p-4 hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/20 border border-purple-500/30 p-2.5 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.3)]"><DollarSign className="h-5 w-5" /></div>
            <div>
              <p className="text-xs font-mono tracking-wider text-dark-400 uppercase">Vendas do Mês</p>
              <p className="text-2xl font-extrabold text-white tracking-tight">{formatCurrency(data.kpis.monthlySales)}</p>
            </div>
          </div>
        </Card>
      </div>


      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="flex items-center justify-between border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-500">Follow-ups Atrasados</h3>
              <p className="text-sm text-red-400">Ação imediata necessária (Regra de Ouro)</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-red-500">{data.alerts.overdueFollowUps}</span>
        </Card>
        <Card className="flex items-center justify-between border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-6 w-6 text-amber-500" />
            <div>
              <h3 className="font-semibold text-amber-500">Leads sem Próxima Ação</h3>
              <p className="text-sm text-amber-400">Agende a próxima interação</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-amber-500">{data.alerts.noNextActionLeads}</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="col-span-1 p-4 lg:col-span-2">
          <h3 className="mb-4 font-semibold text-dark-100">Vendas Mensais</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlySalesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="month" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} tickFormatter={(value: number) => `R$${value/1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} itemStyle={{ color: '#f59e0b' }} />
                <Area type="monotone" dataKey="sales" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="col-span-1 p-4">
          <h3 className="mb-4 font-semibold text-dark-100">Funil de Vendas</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={data.pipelineData} margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                <YAxis dataKey="stage" type="category" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                <Tooltip cursor={{ fill: '#374151', opacity: 0.4 }} contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data.pipelineData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="mb-4 font-semibold text-dark-100">Atividade Recente</h3>
        <div className="space-y-4">
          {data.recentActivities.length === 0 ? (
            <p className="text-sm text-dark-400">Nenhuma atividade recente.</p>
          ) : (
            data.recentActivities.map((activity: any) => (
              <div key={activity.id} className="flex items-start gap-4">
                <div className="rounded-full bg-dark-800 p-2 text-dark-300 border border-dark-700">
                  {activity.type === 'call' && <Phone className="h-4 w-4" />}
                  {activity.type === 'email' && <Mail className="h-4 w-4" />}
                  {activity.type === 'meeting' && <Users className="h-4 w-4" />}
                  {activity.type === 'status_change' && <Activity className="h-4 w-4" />}
                  {activity.type === 'task_completed' && <CheckCircle className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-sm text-dark-100">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-dark-400" />
                    <span className="text-xs text-dark-400">{formatRelativeDate(activity.date)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
