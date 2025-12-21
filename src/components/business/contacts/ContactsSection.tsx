import { useState, useEffect } from 'react';
import { Plus, Users, Search, Filter, Building2, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Contact, Order, ContactStatus, STATUS_CONFIG } from './types';
import { ContactCard } from './ContactCard';
import { AddContactDialog } from './AddContactDialog';
import { motion, AnimatePresence } from 'framer-motion';

export function ContactsSection() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [contactsRes, ordersRes] = await Promise.all([
      supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('name'),
      supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id),
    ]);

    if (contactsRes.error) {
      toast.error('Fehler beim Laden der Kontakte');
      console.error(contactsRes.error);
    } else {
      setContacts(contactsRes.data as Contact[]);
    }

    if (ordersRes.error) {
      console.error(ordersRes.error);
    } else {
      setOrders(ordersRes.data as Order[]);
    }

    setLoading(false);
  };

  const handleSaveContact = async (contactData: Partial<Contact>) => {
    if (!user) return;

    if (contactData.id) {
      // Update existing
      const { error } = await supabase
        .from('contacts')
        .update({
          name: contactData.name,
          company: contactData.company,
          email: contactData.email,
          phone: contactData.phone,
          address: contactData.address,
          notes: contactData.notes,
          status: contactData.status,
        })
        .eq('id', contactData.id);

      if (error) {
        toast.error('Fehler beim Aktualisieren');
        console.error(error);
      } else {
        toast.success('Kontakt aktualisiert');
        fetchData();
      }
    } else {
      // Create new
      const { error } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          name: contactData.name!,
          company: contactData.company,
          email: contactData.email,
          phone: contactData.phone,
          address: contactData.address,
          notes: contactData.notes,
          status: contactData.status || 'idea',
        });

      if (error) {
        toast.error('Fehler beim Erstellen');
        console.error(error);
      } else {
        toast.success('Kontakt erstellt');
        fetchData();
      }
    }
    setEditContact(null);
  };

  const handleDeleteContact = async (contact: Contact) => {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contact.id);

    if (error) {
      toast.error('Fehler beim Löschen');
      console.error(error);
    } else {
      toast.success('Kontakt gelöscht');
      fetchData();
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditContact(contact);
    setDialogOpen(true);
  };

  const handleViewOrders = (contact: Contact) => {
    // TODO: Navigate to orders page with filter
    toast.info(`Aufträge für ${contact.name} anzeigen`);
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group contacts by status
  const groupedContacts = {
    has_orders: filteredContacts.filter(c => c.status === 'has_orders'),
    in_exchange: filteredContacts.filter(c => c.status === 'in_exchange'),
    contacted: filteredContacts.filter(c => c.status === 'contacted'),
    idea: filteredContacts.filter(c => c.status === 'idea'),
  };

  const stats = {
    total: contacts.length,
    companies: contacts.filter(c => c.company).length,
    withOrders: contacts.filter(c => c.status === 'has_orders').length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 rounded-xl bg-muted/30 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="glass-card p-4 text-center"
        >
          <div className="flex justify-center mb-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <Users className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Kontakte</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 text-center"
        >
          <div className="flex justify-center mb-2">
            <div className="p-2 rounded-lg bg-info/20">
              <Building2 className="w-5 h-5 text-info" />
            </div>
          </div>
          <p className="text-2xl font-bold">{stats.companies}</p>
          <p className="text-xs text-muted-foreground">Unternehmen</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4 text-center"
        >
          <div className="flex justify-center mb-2">
            <div className="p-2 rounded-lg bg-success/20">
              <UserCircle className="w-5 h-5 text-success" />
            </div>
          </div>
          <p className="text-2xl font-bold">{stats.withOrders}</p>
          <p className="text-xs text-muted-foreground">Mit Aufträgen</p>
        </motion.div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Kontakte durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as ContactStatus | 'all')}>
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="all" className="text-xs">Alle</TabsTrigger>
            <TabsTrigger value="has_orders" className="text-xs">Aufträge</TabsTrigger>
            <TabsTrigger value="in_exchange" className="text-xs">Austausch</TabsTrigger>
            <TabsTrigger value="contacted" className="text-xs">Kontaktiert</TabsTrigger>
            <TabsTrigger value="idea" className="text-xs">Idee</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => { setEditContact(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Kontakt
        </Button>
      </div>

      {/* Contacts Grid */}
      {filteredContacts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium text-muted-foreground mb-2">Keine Kontakte gefunden</h3>
          <p className="text-sm text-muted-foreground/70 mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'Versuche andere Suchkriterien'
              : 'Erstelle deinen ersten Kontakt'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Button onClick={() => { setEditContact(null); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Kontakt erstellen
            </Button>
          )}
        </motion.div>
      ) : statusFilter === 'all' ? (
        // Grouped view
        <div className="space-y-6">
          {Object.entries(groupedContacts).map(([status, contactGroup]) => {
            if (contactGroup.length === 0) return null;
            const config = STATUS_CONFIG[status as ContactStatus];
            return (
              <div key={status}>
                <h3 className={`text-sm font-medium mb-3 ${config.color}`}>
                  {config.label} ({contactGroup.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {contactGroup.map((contact) => (
                      <ContactCard
                        key={contact.id}
                        contact={contact}
                        orders={orders}
                        onEdit={handleEditContact}
                        onDelete={handleDeleteContact}
                        onViewOrders={handleViewOrders}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Flat view for filtered
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                orders={orders}
                onEdit={handleEditContact}
                onDelete={handleDeleteContact}
                onViewOrders={handleViewOrders}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AddContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveContact}
        editContact={editContact}
      />
    </div>
  );
}
