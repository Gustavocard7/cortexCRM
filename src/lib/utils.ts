export type ClassValue = string | number | boolean | undefined | null | ClassValue[] | Record<string, boolean | undefined | null>;

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Simple clsx implementation since we don't want another dependency
function clsx(...args: ClassValue[]): string {
  const classes: string[] = [];
  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === 'string') {
      classes.push(arg);
    } else if (Array.isArray(arg)) {
      const inner = clsx(...arg);
      if (inner) classes.push(inner);
    } else if (typeof arg === 'object') {
      for (const [key, value] of Object.entries(arg)) {
        if (value) classes.push(key);
      }
    }
  }
  return classes.join(' ');
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  if (days === -1) return 'Ontem';
  if (days > 0 && days <= 7) return `Em ${days} dias`;
  if (days < 0 && days >= -7) return `Há ${Math.abs(days)} dias`;
  return formatDate(d);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function generateId(): string {
  return crypto.randomUUID();
}

export const leadSourceLabels: Record<string, string> = {
  website: 'Website',
  referral: 'Indicação',
  social_media: 'Redes Sociais',
  cold_call: 'Prospecção Ativa',
  event: 'Evento',
  other: 'Outro',
};

export const leadStatusLabels: Record<string, string> = {
  active: 'Ativo',
  won: 'Ganho',
  lost: 'Perdido',
  archived: 'Arquivado',
};

export const followUpPriorityLabels: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

export const followUpStatusLabels: Record<string, string> = {
  pending: 'Pendente',
  completed: 'Concluído',
  overdue: 'Atrasado',
  cancelled: 'Cancelado',
};

export const demoStatusLabels: Record<string, string> = {
  scheduled: 'Agendada',
  completed: 'Realizada',
  cancelled: 'Cancelada',
  no_show: 'No-show',
};

export const proposalStatusLabels: Record<string, string> = {
  draft: 'Rascunho',
  sent: 'Enviada',
  viewed: 'Visualizada',
  accepted: 'Aceita',
  rejected: 'Rejeitada',
  expired: 'Expirada',
};

export const saleStatusLabels: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  partial: 'Parcial',
  overdue: 'Em Atraso',
  cancelled: 'Cancelado',
};

export const paymentMethodLabels: Record<string, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  bank_transfer: 'Transferência',
  invoice: 'Boleto',
};

export const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  won: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  lost: 'bg-red-500/10 text-red-400 border-red-500/20',
  archived: 'bg-dark-500/10 text-dark-400 border-dark-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled: 'bg-dark-500/10 text-dark-400 border-dark-500/20',
  scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  no_show: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  draft: 'bg-dark-500/10 text-dark-400 border-dark-500/20',
  sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  viewed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  accepted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  expired: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  partial: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  low: 'bg-dark-500/10 text-dark-400 border-dark-500/20',
  medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
};
