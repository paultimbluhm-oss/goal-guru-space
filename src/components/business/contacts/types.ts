export type ContactStatus = 'idea' | 'contacted' | 'in_exchange' | 'has_orders';

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  position: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  status: ContactStatus;
  created_at: string;
}

export interface ContactConnection {
  id: string;
  user_id: string;
  from_contact_id: string;
  to_contact_id: string;
  relationship_type: string;
  description: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  amount: number | null;
  due_date: string | null;
  contact_id: string | null;
  created_at: string;
}

export const STATUS_CONFIG: Record<ContactStatus, { label: string; color: string; bgColor: string }> = {
  idea: { label: 'Idee', color: 'text-muted-foreground', bgColor: 'bg-muted/50' },
  contacted: { label: 'Kontaktiert', color: 'text-info', bgColor: 'bg-info/20' },
  in_exchange: { label: 'Im Austausch', color: 'text-warning', bgColor: 'bg-warning/20' },
  has_orders: { label: 'Hat Aufträge', color: 'text-success', bgColor: 'bg-success/20' },
};

export const STATUS_OPTIONS: { value: ContactStatus; label: string }[] = [
  { value: 'idea', label: 'Idee' },
  { value: 'contacted', label: 'Kontaktiert' },
  { value: 'in_exchange', label: 'Im Austausch' },
  { value: 'has_orders', label: 'Hat Aufträge' },
];

export const RELATIONSHIP_TYPES = [
  { value: 'recommended', label: 'Empfohlen von' },
  { value: 'works_with', label: 'Arbeitet zusammen mit' },
  { value: 'knows', label: 'Kennt' },
  { value: 'introduced', label: 'Vorgestellt durch' },
  { value: 'partner', label: 'Partner' },
  { value: 'supplier', label: 'Lieferant' },
  { value: 'customer', label: 'Kunde' },
];

export const POSITION_OPTIONS = [
  { value: 'ceo', label: 'Geschäftsführer/CEO' },
  { value: 'cto', label: 'CTO' },
  { value: 'cfo', label: 'CFO' },
  { value: 'coo', label: 'COO' },
  { value: 'founder', label: 'Gründer/Inhaber' },
  { value: 'director', label: 'Direktor' },
  { value: 'manager', label: 'Manager' },
  { value: 'team_lead', label: 'Teamleiter' },
  { value: 'employee', label: 'Mitarbeiter' },
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'consultant', label: 'Berater' },
  { value: 'sales', label: 'Vertrieb' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'developer', label: 'Entwickler' },
  { value: 'designer', label: 'Designer' },
  { value: 'other', label: 'Andere' },
];
