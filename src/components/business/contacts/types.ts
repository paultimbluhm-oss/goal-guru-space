export type ContactStatus = 'idea' | 'contacted' | 'in_exchange' | 'has_orders';

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  status: ContactStatus;
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
