import { Building2, Mail, Phone, MapPin, MoreVertical, Pencil, Trash2, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Contact, Order, STATUS_CONFIG } from './types';
import { motion } from 'framer-motion';

interface ContactCardProps {
  contact: Contact;
  orders: Order[];
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onViewOrders: (contact: Contact) => void;
}

export function ContactCard({ contact, orders, onEdit, onDelete, onViewOrders }: ContactCardProps) {
  const statusConfig = STATUS_CONFIG[contact.status];
  const contactOrders = orders.filter(o => o.contact_id === contact.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-card hover:border-primary/50 transition-all duration-300 group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg truncate">{contact.name}</h3>
                <Badge variant="outline" className={`${statusConfig.bgColor} ${statusConfig.color} border-0 text-xs`}>
                  {statusConfig.label}
                </Badge>
              </div>
              
              {contact.company && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">{contact.company}</span>
                </div>
              )}

              <div className="space-y-1.5">
                {contact.email && (
                  <a 
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="w-4 h-4 shrink-0" />
                    <span className="truncate">{contact.email}</span>
                  </a>
                )}
                
                {contact.phone && (
                  <a 
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{contact.phone}</span>
                  </a>
                )}
                
                {contact.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate">{contact.address}</span>
                  </div>
                )}
              </div>

              {contact.notes && (
                <p className="text-xs text-muted-foreground mt-3 line-clamp-2 italic">
                  {contact.notes}
                </p>
              )}

              {contactOrders.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <button 
                    onClick={() => onViewOrders(contact)}
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{contactOrders.length} Auftrag{contactOrders.length > 1 ? 'e' : ''}</span>
                  </button>
                </div>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(contact)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Bearbeiten
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewOrders(contact)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Aufträge anzeigen
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(contact)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
