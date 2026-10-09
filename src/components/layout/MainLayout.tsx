import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState('Visão Geral');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
    // Close mobile sidebar on route change
    setMobileSidebarOpen(false);
  }, [location]);

  return (
    <div className="relative flex min-h-screen bg-dark-950 text-dark-100 font-sans selection:bg-cortex-500/30 overflow-hidden">
      {/* Futuristic Cyber Grid & Ambient Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none bg-cyber-grid z-0 opacity-60" />
      <div className="fixed -top-40 left-1/4 w-[650px] h-[450px] bg-cortex-600/10 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="fixed -bottom-40 right-10 w-[550px] h-[450px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none z-0" />

      <Sidebar 
        mobileOpen={mobileSidebarOpen} 
        onCloseMobile={() => setMobileSidebarOpen(false)} 
      />
      <div className="relative z-10 flex-1 flex flex-col min-w-0">
        <Header 
          title={pageTitle} 
          onOpenMobileMenu={() => setMobileSidebarOpen(true)} 
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );

};

