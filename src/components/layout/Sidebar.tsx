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
  Brain
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

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebar_collapsed');
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  const toggleCollapse = () => setCollapsed((prev: boolean) => !prev);

  return (
    <aside 
      className={cn(
        "flex flex-col bg-dark-900 border-r border-dark-700 transition-all duration-300 ease-in-out z-20 h-screen sticky top-0",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      <div className="flex items-center h-16 px-4 border-b border-dark-700 justify-between">
        <div className="flex items-center overflow-hidden whitespace-nowrap">
          <Brain className="text-cortex-500 w-8 h-8 shrink-0" />
          <span className={cn(
            "ml-3 font-bold text-xl text-dark-100 transition-opacity duration-300",
            collapsed ? "opacity-0 w-0" : "opacity-100"
          )}>
            Cortex
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "sidebar-link group flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive ? "sidebar-link-active bg-cortex-500/10 text-cortex-400" : "text-dark-300 hover:bg-dark-800 hover:text-dark-100",
              collapsed && "justify-center"
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className={cn("w-5 h-5 shrink-0", collapsed ? "mr-0" : "mr-3")} />
            {!collapsed && (
              <span className="truncate">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-dark-700 flex justify-end">
        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-lg text-dark-400 hover:text-dark-100 hover:bg-dark-800 transition-colors"
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
};
