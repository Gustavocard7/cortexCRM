import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Filter, 
  Users, 
  CalendarCheck, 
  Presentation, 
  FileText, 
  DollarSign, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Brain,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Visão Geral', path: '/' },
  { icon: Filter, label: 'Funil de Vendas', path: '/pipeline' },
  { icon: Users, label: 'Leads', path: '/leads' },
  { icon: CalendarCheck, label: 'Acompanhamentos', path: '/follow-ups' },
  { icon: Presentation, label: 'Demonstrações', path: '/demos' },
  { icon: FileText, label: 'Propostas', path: '/proposals' },
  { icon: DollarSign, label: 'Vendas e Financeiro', path: '/sales' },
  { icon: BarChart3, label: 'Desempenho Comercial', path: '/performance' },
  { icon: Settings, label: 'Configurações', path: '/settings' },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebar_collapsed');
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  const toggleCollapse = () => setCollapsed((prev: boolean) => !prev);

  const navContent = (isMobile: boolean) => (
    <>
      <div className="flex items-center h-16 px-4 border-b border-dark-700 justify-between">
        <div className="flex items-center overflow-hidden whitespace-nowrap">
          <Brain className="text-cortex-500 w-8 h-8 shrink-0" />
          <div className={cn(
            "ml-3 transition-opacity duration-300",
            (!isMobile && collapsed) ? "opacity-0 w-0" : "opacity-100 flex items-center gap-1.5"
          )}>
            <span className="font-bold text-xl text-dark-100">Cortex</span>
            <span className="text-cortex-400 font-medium text-xs px-1.5 py-0.5 rounded bg-cortex-500/10 border border-cortex-500/20">CRM</span>
          </div>
        </div>
        {isMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-dark-400 hover:text-dark-100 hover:bg-dark-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => {
              if (isMobile && onCloseMobile) {
                onCloseMobile();
              }
            }}
            className={({ isActive }) => cn(
              "sidebar-link group flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive ? "sidebar-link-active bg-cortex-500/10 text-cortex-400" : "text-dark-300 hover:bg-dark-800 hover:text-dark-100",
              (!isMobile && collapsed) && "justify-center"
            )}
            title={(!isMobile && collapsed) ? item.label : undefined}
          >
            <item.icon className={cn("w-5 h-5 shrink-0", (!isMobile && collapsed) ? "mr-0" : "mr-3")} />
            {(isMobile || !collapsed) && (
              <span className="truncate">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {!isMobile && (
        <div className="p-4 border-t border-dark-700 flex justify-end">
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg text-dark-400 hover:text-dark-100 hover:bg-dark-800 transition-colors"
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden md:flex flex-col bg-dark-900 border-r border-dark-700 transition-all duration-300 ease-in-out z-20 h-screen sticky top-0 shrink-0",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        {navContent(false)}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
        />
      )}

      <aside 
        className={cn(
          "fixed inset-y-0 left-0 w-72 bg-dark-900 border-r border-dark-700 z-50 flex flex-col md:hidden transform transition-transform duration-300 ease-in-out shadow-2xl",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent(true)}
      </aside>
    </>
  );
};

