import {
  Profile,
  PipelineStage,
  Lead,
  LeadActivity,
  FollowUp,
  Demonstration,
  Proposal,
  Sale,
  Setting
} from '@/types';

// Storage key for clean production-ready data
const STORAGE_KEY = 'cortex_crm_data_clean_prod';
const EVENT_NAME = 'cortex_crm_sync';

export interface CRMDatabase {
  profiles: Profile[];
  pipelineStages: PipelineStage[];
  leads: Lead[];
  leadActivities: LeadActivity[];
  followUps: FollowUp[];
  demonstrations: Demonstration[];
  proposals: Proposal[];
  sales: Sale[];
  settings: Record<string, any>;
}

// Default initial system profile for Cortex
const initialProfiles: Profile[] = [
  {
    id: 'user-cortex-admin-1',
    full_name: 'Administrador Cortex',
    role: 'admin',
    avatar_url: null,
    phone: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Official Cortex pipeline stages (fully customizable in Settings)
const initialStages: PipelineStage[] = [
  { id: 'stage-1', name: 'Prospecção', order_position: 1, color: '#8b5cf6', created_at: new Date().toISOString() },
  { id: 'stage-2', name: 'Qualificação', order_position: 2, color: '#3b82f6', created_at: new Date().toISOString() },
  { id: 'stage-3', name: 'Demonstração', order_position: 3, color: '#06b6d4', created_at: new Date().toISOString() },
  { id: 'stage-4', name: 'Proposta', order_position: 4, color: '#f59e0b', created_at: new Date().toISOString() },
  { id: 'stage-5', name: 'Negociação', order_position: 5, color: '#f97316', created_at: new Date().toISOString() },
  { id: 'stage-6', name: 'Fechamento', order_position: 6, color: '#10b981', created_at: new Date().toISOString() },
];

function getStoredData(): CRMDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading CRM database from storage:', e);
  }

  // ZERADO: Zero leads, zero follow-ups, zero demos, zero propostas, zero vendas
  const cleanDb: CRMDatabase = {
    profiles: initialProfiles,
    pipelineStages: initialStages,
    leads: [],
    leadActivities: [],
    followUps: [],
    demonstrations: [],
    proposals: [],
    sales: [],
    settings: {
      company_name: 'Cortex Soluções',
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
    },
  };

  saveStoredData(cleanDb);
  return cleanDb;
}

function saveStoredData(db: CRMDatabase) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(EVENT_NAME));
    }
  } catch (e) {
    console.error('Error saving CRM database:', e);
  }
}

export const mockStore = {
  get: getStoredData,
  save: saveStoredData,

  // Reset/Zerar banco de dados para iniciar limpo
  clearAllData: () => {
    const db = getStoredData();
    db.leads = [];
    db.leadActivities = [];
    db.followUps = [];
    db.demonstrations = [];
    db.proposals = [];
    db.sales = [];
    saveStoredData(db);
  },

  subscribe: (callback: () => void) => {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(EVENT_NAME, callback);
    window.addEventListener('storage', callback);
    return () => {
      window.removeEventListener(EVENT_NAME, callback);
      window.removeEventListener('storage', callback);
    };
  },

  // Helpers com joins
  getPopulatedLeads: (): Lead[] => {
    const db = getStoredData();
    return db.leads.map((l) => ({
      ...l,
      stage: db.pipelineStages.find((s) => s.id === l.stage_id),
      assignee: db.profiles.find((p) => p.id === l.assigned_to),
    }));
  },

  getPopulatedFollowUps: (): FollowUp[] => {
    const db = getStoredData();
    const leads = mockStore.getPopulatedLeads();
    return db.followUps.map((fu) => ({
      ...fu,
      lead: leads.find((l) => l.id === fu.lead_id),
      user: db.profiles.find((p) => p.id === fu.user_id),
    }));
  },

  getPopulatedDemos: (): Demonstration[] => {
    const db = getStoredData();
    const leads = mockStore.getPopulatedLeads();
    return db.demonstrations.map((d) => ({
      ...d,
      lead: leads.find((l) => l.id === d.lead_id),
      user: db.profiles.find((p) => p.id === d.user_id),
    }));
  },

  getPopulatedProposals: (): Proposal[] => {
    const db = getStoredData();
    const leads = mockStore.getPopulatedLeads();
    return db.proposals.map((prop) => ({
      ...prop,
      lead: leads.find((l) => l.id === prop.lead_id),
      user: db.profiles.find((p) => p.id === prop.user_id),
    }));
  },

  getPopulatedSales: (): Sale[] => {
    const db = getStoredData();
    const leads = mockStore.getPopulatedLeads();
    return db.sales.map((s) => ({
      ...s,
      lead: leads.find((l) => l.id === s.lead_id),
      proposal: db.proposals.find((p) => p.id === s.proposal_id),
      user: db.profiles.find((p) => p.id === s.user_id),
    }));
  },
};
