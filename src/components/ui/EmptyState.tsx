import React from 'react';
import { Button } from './Button';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: any;
  title: string;
  description: string;
  action?:
    | {
        label: string;
        onClick: () => void;
      }
    | React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  const renderIcon = () => {
    if (!icon) return <Inbox className="w-6 h-6" />;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon as React.ComponentType<{ className?: string }>;
    return <IconComponent className="w-6 h-6" />;
  };

  const renderAction = () => {
    if (!action) return null;
    if (React.isValidElement(action)) {
      return <div className="mt-6">{action}</div>;
    }
    const act = action as { label: string; onClick: () => void };
    if (act.label && act.onClick) {
      return (
        <div className="mt-6">
          <Button onClick={act.onClick} variant="primary">
            {act.label}
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-dark-900 border border-dark-700 rounded-xl border-dashed">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-dark-800 text-dark-400 mb-4">
        {renderIcon()}
      </div>
      <h3 className="text-lg font-medium text-dark-100">{title}</h3>
      <p className="mt-2 text-sm text-dark-400 max-w-md">{description}</p>
      {renderAction()}
    </div>
  );
};
