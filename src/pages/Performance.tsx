import React, { useState } from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { Trophy, Users, Percent, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Card, Table, Select, LoadingSpinner, Badge, EmptyState } from '@/components/ui';
import { usePerformance } from '@/hooks/usePerformance';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function Performance() {
  const { teamData, funnelData, monthlyComparison, loading, error } = usePerformance();
  const [period, setPeriod] = useState('this_month');

  if (loading) return <div className="p-8 flex justify-center"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="p-8 text-red-500">Erro ao carregar dados de desempenho</div>;

  const totalLeads = teamData?.reduce((acc, user) => acc + user.leads_count, 0) || 0;
  const totalSales = teamData?.reduce((acc, user) => acc + user.won_count, 0) || 0;
  const avgConversion = totalLeads > 0 ? (totalSales / totalLeads) * 100 : 0;
  const totalRevenue = teamData?.reduce((acc, user) => acc + user.revenue, 0) || 0;

  // Sort team data by revenue descending for ranking
  const rankedTeam = [...(teamData || [])].sort((a, b) => b.revenue - a.revenue);

  const getRankBadge = (index: number) => {
    switch(index) {
      case 0: return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">1º Ouro</Badge>;
      case 1: return <Badge className="bg-gray-400/20 text-gray-400 border-gray-400/30">2º Prata</Badge>;
      case 2: return <Badge className="bg-amber-700/20 text-amber-600 border-amber-700/30">3º Bronze</Badge>;
      default: return <span className="text-dark-400 font-medium">{index + 1}º</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-dark-100 flex items-center gap-2">
          <Target className="w-6 h-6 text-cortex-500" />
          Desempenho Comercial
        </h1>
        <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full sm:w-48">

          <option value="this_month">Este Mês</option>
          <option value="last_month">Mês Passado</option>
          <option value="this_quarter">Este Trimestre</option>
          <option value="this_year">Este Ano</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 stat-card flex flex-col gap-2">
          <div className="flex items-center gap-2 text-dark-300">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Total de Leads Trabalhados</span>
          </div>
          <span className="text-2xl font-bold text-dark-100">{totalLeads}</span>
        </Card>
        <Card className="p-4 stat-card flex flex-col gap-2">
          <div className="flex items-center gap-2 text-dark-300">
            <Trophy className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium">Total de Vendas</span>
          </div>
          <span className="text-2xl font-bold text-emerald-400">{totalSales}</span>
        </Card>
        <Card className="p-4 stat-card flex flex-col gap-2">
          <div className="flex items-center gap-2 text-dark-300">
            <Percent className="w-4 h-4 text-cortex-500" />
            <span className="text-sm font-medium">Conversão Média</span>
          </div>
          <span className="text-2xl font-bold text-cortex-400">{avgConversion.toFixed(1)}%</span>
        </Card>
        <Card className="p-4 stat-card flex flex-col gap-2">
          <div className="flex items-center gap-2 text-dark-300">
            <Trophy className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium">Receita Total</span>
          </div>
          <span className="text-2xl font-bold text-dark-100">{formatCurrency(totalRevenue)}</span>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-dark-700">
          <h3 className="text-lg font-medium text-dark-100">Ranking de Vendedores</h3>
        </div>
        {rankedTeam.length === 0 ? (
          <EmptyState icon={<Users />} title="Sem dados da equipe" description="Não há atividades registradas para este período." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <th className="w-16">Posição</th>
                  <th>Vendedor</th>
                  <th>Leads</th>
                  <th>Ganhos</th>
                  <th>Perdidos</th>
                  <th className="w-48">Conversão</th>
                  <th>Receita</th>
                </tr>
              </thead>
              <tbody>
                {rankedTeam.map((user, index) => {
                  const convRate = user.leads_count > 0 ? (user.won_count / user.leads_count) * 100 : 0;
                  return (
                    <tr key={user.user_id} className="table-row">
                      <td className="text-center">{getRankBadge(index)}</td>
                      <td className="font-medium text-dark-100">{user.name}</td>
                      <td className="text-dark-300">{user.leads_count}</td>
                      <td className="text-emerald-400 font-medium">{user.won_count}</td>
                      <td className="text-red-400">{user.lost_count}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="text-sm w-12 text-right">{convRate.toFixed(1)}%</span>
                          <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-cortex-500 rounded-full" 
                              style={{ width: `${Math.min(convRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="text-dark-100 font-medium">{formatCurrency(user.revenue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-lg font-medium text-dark-100 mb-4">Funil de Vendas</h3>
          <div className="h-[300px]">
            {funnelData && funnelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                  <XAxis type="number" stroke="#9ca3af" axisLine={false} tickLine={false} />
                  <YAxis dataKey="stage_name" type="category" stroke="#9ca3af" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} cursor={{fill: '#374151', opacity: 0.4}} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-dark-400">Sem dados do funil</div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-medium text-dark-100 mb-4">Comparativo Mensal (Vendas)</h3>
          <div className="h-[300px]">
            {monthlyComparison && monthlyComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyComparison} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="month" stroke="#9ca3af" axisLine={false} tickLine={false} />
                  <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} cursor={{fill: '#374151', opacity: 0.4}} />
                  <Legend wrapperStyle={{ color: '#9ca3af' }} />
                  <Bar dataKey="current" name="Período Atual" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="previous" name="Período Anterior" fill="#4b5563" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-dark-400">Sem dados comparativos</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
