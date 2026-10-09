import React from 'react';
import { cn, statusColors } from '@/lib/utils';

export interface BadgeProps {
  status?: string;
  variant?: string;
  label?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant,
  label,
  children,
  size = 'md',
  className,
}) => {
  const key = status || variant || 'default';
  const colorClass =
    (statusColors as Record<string, string>)[key] ||
    (key === 'primary' ? 'bg-cortex-500/10 text-cortex-400 border border-cortex-500/20' :
     key === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
     key === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
     key === 'danger' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
     'bg-dark-700/60 text-dark-200 border border-dark-600/50');

  const content = children || label || '';

  return (
    <span
      className={cn(
        'badge inline-flex items-center font-medium rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        colorClass,
        className
      )}
    >
      {content}
    </span>
  );
};
