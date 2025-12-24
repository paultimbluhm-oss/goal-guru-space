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

export const STATUS_CONFIG: Record<ContactStatus, { label: string; color: string; bgColor: string; order: number }> = {
  idea: { label: 'Idee', color: 'text-muted-foreground', bgColor: 'bg-muted/50', order: 1 },
  first_contact: { label: 'Erstmals angeschrieben', color: 'text-info', bgColor: 'bg-info/20', order: 2 },
  received_reply: { label: 'Antwort erhalten', color: 'text-success', bgColor: 'bg-success/20', order: 3 },
  need_to_reply: { label: 'Muss antworten', color: 'text-warning', bgColor: 'bg-warning/20', order: 4 },
  waiting_for_reply: { label: 'Warte auf Antwort', color: 'text-info', bgColor: 'bg-info/20', order: 5 },
  has_orders: { label: 'Hat Aufträge', color: 'text-primary', bgColor: 'bg-primary/20', order: 6 },
  completed: { label: 'Abgeschlossen', color: 'text-muted-foreground', bgColor: 'bg-muted/30', order: 7 },
};

export const STATUS_OPTIONS: { value: ContactStatus; label: string }[] = [
  { value: 'idea', label: 'Idee' },
  { value: 'first_contact', label: 'Erstmals angeschrieben' },
  { value: 'received_reply', label: 'Antwort erhalten' },
  { value: 'need_to_reply', label: 'Muss antworten' },
  { value: 'waiting_for_reply', label: 'Warte auf Antwort' },
  { value: 'has_orders', label: 'Hat Aufträge' },
  { value: 'completed', label: 'Abgeschlossen' },
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
