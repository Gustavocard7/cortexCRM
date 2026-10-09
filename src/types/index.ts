// ============================================
// Cortex CRM — Type Definitions
// ============================================

export type UserRole = 'admin' | 'manager' | 'sales_rep';

export type LeadSource = 'website' | 'referral' | 'social_media' | 'cold_call' | 'event' | 'other';

export type LeadStatus = 'active' | 'won' | 'lost' | 'archived';

export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'stage_change' | 'status_change';

export type FollowUpPriority = 'low' | 'medium' | 'high' | 'urgent';

export type FollowUpStatus = 'pending' | 'completed' | 'overdue' | 'cancelled';

export type DemoStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';

export type SaleStatus = 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled';

export type PaymentMethod = 'pix' | 'credit_card' | 'bank_transfer' | 'invoice';

// ============================================
// Database Models
// ============================================

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  order_position: number;
  color: string;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  source: LeadSource;
  stage_id: string;
  assigned_to: string;
  status: LeadStatus;
  estimated_value: number;
  notes: string;
  next_action_date: string;
  next_action_description: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  stage?: PipelineStage;
  assignee?: Profile;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string;
  type: ActivityType;
  description: string;
  created_at: string;
  // Joined
  user?: Profile;
}

export interface FollowUp {
  id: string;
  lead_id: string;
  user_id: string;
  title: string;
  description: string;
  due_date: string;
  priority: FollowUpPriority;
  status: FollowUpStatus;
  completed_at: string | null;
  created_at: string;
  // Joined
  lead?: Lead;
  user?: Profile;
}

export interface Demonstration {
  id: string;
  lead_id: string;
  user_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: DemoStatus;
  meeting_link: string;
  notes: string;
  feedback: string;
  created_at: string;
  // Joined
  lead?: Lead;
  user?: Profile;
}

export interface Proposal {
  id: string;
  lead_id: string;
  user_id: string;
  title: string;
  value: number;
  status: ProposalStatus;
  valid_until: string;
  sent_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  // Joined
  lead?: Lead;
  user?: Profile;
}

export interface Sale {
  id: string;
  lead_id: string;
  proposal_id: string | null;
  user_id: string;
  value: number;
  recurring_value: number;
  payment_method: PaymentMethod;
  installments: number;
  status: SaleStatus;
  closed_at: string;
  notes: string;
  created_at: string;
  // Joined
  lead?: Lead;
  proposal?: Proposal;
  user?: Profile;
}

export interface Setting {
  id: string;
  key: string;
  value: unknown;
  updated_by: string;
  updated_at: string;
}

// ============================================
// Form Types (for create/update)
// ============================================

export interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  source: LeadSource;
  stage_id: string;
  assigned_to: string;
  estimated_value: number;
  notes: string;
  next_action_date: string;
  next_action_description: string;
}

export interface FollowUpFormData {
  lead_id: string;
  title: string;
  description: string;
  due_date: string;
  priority: FollowUpPriority;
}

export interface DemoFormData {
  lead_id: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string;
  notes: string;
}

export interface ProposalFormData {
  lead_id: string;
  title: string;
  value: number;
  valid_until: string;
  notes: string;
}

export interface SaleFormData {
  lead_id: string;
  proposal_id?: string;
  value: number;
  recurring_value: number;
  payment_method: PaymentMethod;
  installments: number;
  notes: string;
}

// ============================================
// Dashboard / Stats types
// ============================================

export interface DashboardStats {
  totalLeads: number;
  activeLeads: number;
  wonLeads: number;
  lostLeads: number;
  conversionRate: number;
  pipelineValue: number;
  monthlySales: number;
  monthlyRecurring: number;
  averageTicket: number;
  overdueFollowUps: number;
  leadsWithoutAction: number;
  todayFollowUps: number;
}

export interface StageStats {
  stage: PipelineStage;
  count: number;
  value: number;
}

export interface PerformanceData {
  userId: string;
  userName: string;
  totalLeads: number;
  wonDeals: number;
  lostDeals: number;
  conversionRate: number;
  totalRevenue: number;
  averageCycleTime: number;
}

export interface MonthlySalesData {
  month: string;
  revenue: number;
  deals: number;
}
