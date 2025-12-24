export type ContactStatus = 
  | 'idea' 
  | 'first_contact' 
  | 'received_reply' 
  | 'need_to_reply' 
  | 'waiting_for_reply' 
  | 'has_orders' 
  | 'completed';

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

export const STATUS_CONFIG: Record<ContactStatus, { label: string; color: string; bgColor: string; borderColor: string; dotColor: string; order: number }> = {
  idea: { 
    label: '💡 Idee', 
    color: 'text-slate-600 dark:text-slate-300', 
    bgColor: 'bg-slate-100 dark:bg-slate-800', 
    borderColor: 'border-slate-300 dark:border-slate-600',
    dotColor: 'bg-slate-400',
    order: 1 
  },
  first_contact: { 
    label: '📤 Angeschrieben', 
    color: 'text-blue-700 dark:text-blue-300', 
    bgColor: 'bg-blue-100 dark:bg-blue-900/50', 
    borderColor: 'border-blue-400 dark:border-blue-600',
    dotColor: 'bg-blue-500',
    order: 2 
  },
  received_reply: { 
    label: '📥 Antwort erhalten', 
    color: 'text-emerald-700 dark:text-emerald-300', 
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/50', 
    borderColor: 'border-emerald-400 dark:border-emerald-600',
    dotColor: 'bg-emerald-500',
    order: 3 
  },
  need_to_reply: { 
    label: '⚠️ Muss antworten!', 
    color: 'text-amber-700 dark:text-amber-300', 
    bgColor: 'bg-amber-100 dark:bg-amber-900/50', 
    borderColor: 'border-amber-400 dark:border-amber-600',
    dotColor: 'bg-amber-500',
    order: 4 
  },
  waiting_for_reply: { 
    label: '⏳ Warte auf Antwort', 
    color: 'text-violet-700 dark:text-violet-300', 
    bgColor: 'bg-violet-100 dark:bg-violet-900/50', 
    borderColor: 'border-violet-400 dark:border-violet-600',
    dotColor: 'bg-violet-500',
    order: 5 
  },
  has_orders: { 
    label: '✅ Hat Aufträge', 
    color: 'text-green-700 dark:text-green-300', 
    bgColor: 'bg-green-100 dark:bg-green-900/50', 
    borderColor: 'border-green-400 dark:border-green-600',
    dotColor: 'bg-green-500',
    order: 6 
  },
  completed: { 
    label: '✔️ Abgeschlossen', 
    color: 'text-gray-500 dark:text-gray-400', 
    bgColor: 'bg-gray-100 dark:bg-gray-800', 
    borderColor: 'border-gray-300 dark:border-gray-600',
    dotColor: 'bg-gray-400',
    order: 7 
  },
};

export const STATUS_OPTIONS: { value: ContactStatus; label: string }[] = [
  { value: 'idea', label: '💡 Idee' },
  { value: 'first_contact', label: '📤 Angeschrieben' },
  { value: 'received_reply', label: '📥 Antwort erhalten' },
  { value: 'need_to_reply', label: '⚠️ Muss antworten!' },
  { value: 'waiting_for_reply', label: '⏳ Warte auf Antwort' },
  { value: 'has_orders', label: '✅ Hat Aufträge' },
  { value: 'completed', label: '✔️ Abgeschlossen' },
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
