import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  className,
  noPadding = false,
}) => {
  return (
    <div className={cn('glass-card flex flex-col', className)}>
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between px-6 py-4 border-b border-dark-700">
          <div>
            {title && <h3 className="text-lg font-medium text-dark-100">{title}</h3>}
            {subtitle && <p className="text-sm text-dark-400 mt-1">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={cn('flex-1', !noPadding && 'p-6')}>
        {children}
      </div>
    </div>
  );
};
