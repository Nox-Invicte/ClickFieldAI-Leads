export type LeadSource =
  | 'WEBSITE'
  | 'EMAIL'
  | 'REFERRAL'
  | 'LINKEDIN'
  | 'COLD_OUTREACH'
  | 'EVENT'
  | 'OTHER';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'WON' | 'LOST';
export type LeadScore = 'HOT' | 'WARM' | 'COLD';
export type InteractionType = 'EMAIL' | 'CHAT' | 'NOTE' | 'CALL';
export type UserRole = 'ADMIN' | 'MANAGER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface Interaction {
  id: string;
  leadId: string;
  type: InteractionType;
  content: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  source: LeadSource;
  status: LeadStatus;
  score?: LeadScore | null;
  estimatedValue?: number | null;
  convertedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  aiSummary?: string | null;
  aiFollowUp?: string | null;
  assignedTo?: { id: string; name: string; email: string } | null;
  interactions?: Interaction[];
  _count?: { interactions: number };
}

export interface AnalyticsOverview {
  totalLeads: number;
  wonLeads: number;
  conversionRate: number;
  totalRevenue: number;
}

export interface RevenueBySource {
  source: LeadSource;
  count: number;
  totalValue: number;
}

export interface Analytics {
  overview: AnalyticsOverview;
  revenueBySource: RevenueBySource[];
  leadsByScore: Array<{ score: LeadScore | null; count: number }>;
  leadsByStatus: Array<{ status: LeadStatus; count: number }>;
  recentLeads: Lead[];
}

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  WEBSITE: 'Website',
  EMAIL: 'Email',
  REFERRAL: 'Referral',
  LINKEDIN: 'LinkedIn',
  COLD_OUTREACH: 'Cold Outreach',
  EVENT: 'Event',
  OTHER: 'Other',
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal',
  WON: 'Won',
  LOST: 'Lost',
};
