import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState('Visão Geral');

  useEffect(() => {
    // Map routes to titles
    const titles: Record<string, string> = {
      '/': 'Visão Geral',
      '/pipeline': 'Funil de Vendas',
      '/leads': 'Leads',
      '/follow-ups': 'Acompanhamentos',
      '/demos': 'Demonstrações',
      '/proposals': 'Propostas',
      '/sales': 'Vendas e Financeiro',
      '/performance': 'Desempenho Comercial',
      '/settings': 'Configurações'
    };

    setPageTitle(titles[location.pathname] || 'Cortex CRM');
  }, [location]);

  return (
    <div className="flex min-h-screen bg-dark-950 text-dark-100 font-sans selection:bg-cortex-500/30">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={pageTitle} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
