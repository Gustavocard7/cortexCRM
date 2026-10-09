import React from 'react';
import { cn } from '@/lib/utils';

export interface Tab {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  activeId?: string;
  onChange: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, activeId, onChange }) => {
  const currentTab = activeTab || activeId || (tabs[0] ? tabs[0].id : '');

  return (
    <div className="w-full border-b border-dark-700">
      <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === currentTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors focus:outline-none',
                isActive
                  ? 'border-cortex-500 text-cortex-400'
                  : 'border-transparent text-dark-400 hover:text-dark-300 hover:border-dark-600'
              )}
            >
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'ml-2 rounded-full py-0.5 px-2.5 text-xs font-medium',
                    isActive
                      ? 'bg-cortex-500/10 text-cortex-400'
                      : 'bg-dark-800 text-dark-300'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
