import React, { useState } from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { DollarSign, TrendingUp, CreditCard, ShoppingCart } from 'lucide-react';
import { formatCurrency, formatDate, paymentMethodLabels } from '@/lib/utils';
import { Card, Table, Select, LoadingSpinner, EmptyState } from '@/components/ui';
import { useSales } from '@/hooks/useSales';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function SalesFinance() {
  const { sales, monthlyData, loading, error } = useSales();
  const [period, setPeriod] = useState('this_month');

  if (loading) return <div className="p-8 flex justify-center"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="p-8 text-red-500">Erro ao carregar dados financeiros</div>;

  const totalRevenue = sales?.reduce((acc, sale) => acc + sale.value, 0) || 0;
  const totalMRR = sales?.reduce((acc, sale) => acc + (sale.recurring_value || 0), 0) || 0;
  const salesCount = sales?.length || 0;
  const averageTicket = salesCount > 0 ? totalRevenue / salesCount : 0;

  // Payment method distribution
  const paymentMethods = sales?.reduce((acc: any, sale) => {
    const method = paymentMethodLabels[sale.payment_method as keyof typeof paymentMethodLabels] || sale.payment_method;
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(paymentMethods || {}).map(key => ({
    name: key,
    value: paymentMethods[key]
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-dark-100 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-emerald-500" />
          Vendas e Financeiro
        </h1>
        <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full sm:w-48">

          <option value="this_month">Este Mês</option>
          <option value="last_3_months">Últimos 3 Meses</option>
          <option value="this_year">Este Ano</option>
          <option value="all">Todos</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 stat-card flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-10">
            <TrendingUp className="w-16 h-16 text-emerald-500" />
          </div>
          <span className="text-dark-400 text-sm font-medium">Receita Total</span>
          <span className="text-3xl font-bold text-emerald-400">{formatCurrency(totalRevenue)}</span>
        </Card>
        <Card className="p-4 stat-card flex flex-col gap-2">
          <span className="text-dark-400 text-sm font-medium">Receita Recorrente (MRR)</span>
          <span className="text-2xl font-bold text-cortex-400">{formatCurrency(totalMRR)}</span>
        </Card>
        <Card className="p-4 stat-card flex flex-col gap-2">
          <span className="text-dark-400 text-sm font-medium">Ticket Médio</span>
          <span className="text-2xl font-bold text-dark-100">{formatCurrency(averageTicket)}</span>
        </Card>
        <Card className="p-4 stat-card flex flex-col gap-2">
          <span className="text-dark-400 text-sm font-medium">Número de Vendas</span>
          <span className="text-2xl font-bold text-dark-100">{salesCount}</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 lg:col-span-2">
          <h3 className="text-lg font-medium text-dark-100 mb-4">Evolução de Receita</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="month" stroke="#9ca3af" axisLine={false} tickLine={false} />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} tickFormatter={(value) => `R$${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                  formatter={(value: number) => [formatCurrency(value), 'Receita']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-medium text-dark-100 mb-4">Métodos de Pagamento</h3>
          <div className="h-[300px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} />
                  <Legend wrapperStyle={{ color: '#9ca3af' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-dark-400">Sem dados suficientes</div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-dark-700">
          <h3 className="text-lg font-medium text-dark-100">Histórico de Vendas</h3>
        </div>
        {(!sales || sales.length === 0) ? (
          <EmptyState 
            icon={<ShoppingCart className="w-12 h-12" />}
            title="Nenhuma venda registrada"
            description="As vendas aparecerão aqui após converter propostas aceitas."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <th>Lead/Cliente</th>
                  <th>Valor</th>
                  <th>Recorrente</th>
                  <th>Método</th>
                  <th>Parcelas</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="table-row">
                    <td className="font-medium text-dark-100">{sale.lead?.name || 'N/A'}</td>
                    <td className="text-emerald-400 font-medium">{formatCurrency(sale.value)}</td>
                    <td className="text-dark-300">{sale.recurring_value ? formatCurrency(sale.recurring_value) : '-'}</td>
                    <td className="text-dark-300">{paymentMethodLabels[sale.payment_method as keyof typeof paymentMethodLabels] || sale.payment_method}</td>
                    <td className="text-dark-300">{sale.installments}x</td>
                    <td className="text-dark-300">{formatDate(sale.closed_at || sale.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
