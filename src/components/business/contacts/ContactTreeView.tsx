import { useMemo, useState } from 'react';
import { Contact, ContactConnection, RELATIONSHIP_TYPES, STATUS_CONFIG, ContactStatus } from './types';
import { Badge } from '@/components/ui/badge';
import { Building2, User, ChevronDown, ChevronRight, Mail, Phone, Link2 } from 'lucide-react';
import { EditConnectionDialog } from './EditConnectionDialog';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ContactTreeViewProps {
  contacts: Contact[];
  connections: ContactConnection[];
  onContactClick?: (contact: Contact) => void;
  onUpdateConnection?: (id: string, type: string, description: string) => void;
  onDeleteConnection?: (id: string) => void;
}

interface TreeNode {
  contact: Contact;
  children: { node: TreeNode; connection: ContactConnection }[];
  depth: number;
  connectionCount: number;
}

const getStatusConfig = (status: ContactStatus) => {
  return STATUS_CONFIG[status] || { 
    label: status, 
    color: 'text-muted-foreground', 
    bgColor: 'bg-muted/50', 
    borderColor: 'border-muted',
    dotColor: 'bg-muted-foreground',
    order: 99 
  };
};

function buildTree(contacts: Contact[], connections: ContactConnection[]): TreeNode[] {
  // Count connections per contact
  const connectionCounts: Record<string, number> = {};
  connections.forEach(conn => {
    connectionCounts[conn.from_contact_id] = (connectionCounts[conn.from_contact_id] || 0) + 1;
    connectionCounts[conn.to_contact_id] = (connectionCounts[conn.to_contact_id] || 0) + 1;
  });

  // Find root nodes (most connected contacts that aren't "to" in any connection, or fallback to most connected)
  const toContactIds = new Set(connections.map(c => c.to_contact_id));
  
  let rootContacts = contacts.filter(c => !toContactIds.has(c.id));
  
  // If no root contacts found, use the most connected ones
  if (rootContacts.length === 0) {
    rootContacts = [...contacts].sort((a, b) => 
      (connectionCounts[b.id] || 0) - (connectionCounts[a.id] || 0)
    ).slice(0, Math.max(1, Math.ceil(contacts.length / 3)));
  }

  // Build adjacency list
  const adjacency: Record<string, { contactId: string; connection: ContactConnection }[]> = {};
  connections.forEach(conn => {
    if (!adjacency[conn.from_contact_id]) {
      adjacency[conn.from_contact_id] = [];
    }
    adjacency[conn.from_contact_id].push({ 
      contactId: conn.to_contact_id, 
      connection: conn 
    });
  });

  const contactMap = new Map(contacts.map(c => [c.id, c]));
  const visited = new Set<string>();

  function buildNode(contactId: string, depth: number): TreeNode | null {
    if (visited.has(contactId)) return null;
    const contact = contactMap.get(contactId);
    if (!contact) return null;
    
    visited.add(contactId);
    
    const children: { node: TreeNode; connection: ContactConnection }[] = [];
    const childLinks = adjacency[contactId] || [];
    
    childLinks.forEach(({ contactId: childId, connection }) => {
      const childNode = buildNode(childId, depth + 1);
      if (childNode) {
        children.push({ node: childNode, connection });
      }
    });

    return {
      contact,
      children,
      depth,
      connectionCount: connectionCounts[contactId] || 0,
    };
  }

  const trees: TreeNode[] = [];
  
  // Build trees from root contacts
  rootContacts.forEach(contact => {
    const node = buildNode(contact.id, 0);
    if (node) trees.push(node);
  });

  // Add any remaining unvisited contacts as separate trees
  contacts.forEach(contact => {
    if (!visited.has(contact.id)) {
      const node = buildNode(contact.id, 0);
      if (node) trees.push(node);
    }
  });

  return trees;
}

function TreeNodeComponent({ 
  node, 
  parentConnection,
  onContactClick,
  onConnectionClick,
  isLast = false,
}: { 
  node: TreeNode;
  parentConnection?: ContactConnection;
  onContactClick: (contact: Contact) => void;
  onConnectionClick: (connection: ContactConnection) => void;
  isLast?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const statusConfig = getStatusConfig(node.contact.status);
  const hasChildren = node.children.length > 0;
  const relationshipLabel = parentConnection 
    ? RELATIONSHIP_TYPES.find(r => r.value === parentConnection.relationship_type)?.label || parentConnection.relationship_type
    : null;

  return (
    <div className="relative">
      {/* Vertical line from parent */}
      {node.depth > 0 && (
        <div 
          className="absolute left-0 top-0 w-px bg-border"
          style={{ 
            height: isLast ? '24px' : '100%',
            left: '-20px',
          }}
        />
      )}
      
      {/* Horizontal connector line */}
      {node.depth > 0 && (
        <div 
          className="absolute top-6 h-px bg-border"
          style={{ 
            left: '-20px',
            width: '20px',
          }}
        />
      )}

      {/* Connection label */}
      {parentConnection && (
        <button
          onClick={() => onConnectionClick(parentConnection)}
          className="absolute text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border hover:border-primary hover:text-primary transition-colors"
          style={{ 
            left: '-18px',
            top: '-6px',
            transform: 'translateX(-100%)',
          }}
        >
          {relationshipLabel}
        </button>
      )}

      {/* Node content */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "rounded-lg border-2 p-3 mb-2 transition-all cursor-pointer hover:shadow-md",
          statusConfig.bgColor,
          statusConfig.borderColor,
        )}
        onClick={() => onContactClick(node.contact)}
      >
        <div className="flex items-center gap-3">
          {/* Status dot */}
          <div className={cn("w-4 h-4 rounded-full flex-shrink-0", statusConfig.dotColor)} />
          
          {/* Name and company */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{node.contact.name}</span>
              {node.connectionCount > 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-primary/10 text-primary border-primary/30">
                  <Link2 className="w-2.5 h-2.5 mr-1" />
                  {node.connectionCount}
                </Badge>
              )}
            </div>
            {node.contact.company && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Building2 className="w-3 h-3" />
                <span>{node.contact.company}</span>
              </div>
            )}
          </div>

          {/* Status badge */}
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs font-medium whitespace-nowrap",
              statusConfig.bgColor,
              statusConfig.color,
              statusConfig.borderColor
            )}
          >
            {statusConfig.label}
          </Badge>

          {/* Expand/collapse button */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 hover:bg-black/10 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Contact details */}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground pl-7">
          {node.contact.email && (
            <a 
              href={`mailto:${node.contact.email}`} 
              className="flex items-center gap-1 hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{node.contact.email}</span>
            </a>
          )}
          {node.contact.phone && (
            <a 
              href={`tel:${node.contact.phone}`} 
              className="flex items-center gap-1 hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="w-3 h-3" />
              {node.contact.phone}
            </a>
          )}
        </div>
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-10 relative"
          >
            {node.children.map(({ node: childNode, connection }, idx) => (
              <TreeNodeComponent
                key={childNode.contact.id}
                node={childNode}
                parentConnection={connection}
                onContactClick={onContactClick}
                onConnectionClick={onConnectionClick}
                isLast={idx === node.children.length - 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ContactTreeView({ 
  contacts, 
  connections, 
  onContactClick,
  onUpdateConnection,
  onDeleteConnection 
}: ContactTreeViewProps) {
  const [selectedConnection, setSelectedConnection] = useState<ContactConnection | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const trees = useMemo(() => buildTree(contacts, connections), [contacts, connections]);

  if (contacts.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Keine Kontakte zum Anzeigen</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-6 overflow-auto max-h-[700px]">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-border">
          <h3 className="font-semibold text-lg">Kontakt-Netzwerk</h3>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-medium text-foreground">{contacts.length}</span> Kontakte • 
            <span className="font-medium text-foreground ml-1">{connections.length}</span> Verbindungen
          </p>
        </div>

        {/* Status legend */}
        <div className="flex flex-wrap gap-2 mb-6 p-3 bg-secondary/30 rounded-lg">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs">
              <span className={cn("w-3 h-3 rounded-full", config.dotColor)} />
              <span className={config.color}>{config.label}</span>
            </div>
          ))}
        </div>

        {/* Tree structure */}
        <div className="space-y-6">
          {trees.map((tree, idx) => (
            <div key={tree.contact.id} className="relative">
              {idx > 0 && <div className="border-t border-dashed border-border mb-4" />}
              <TreeNodeComponent
                node={tree}
                onContactClick={(contact) => onContactClick?.(contact)}
                onConnectionClick={(connection) => {
                  setSelectedConnection(connection);
                  setEditDialogOpen(true);
                }}
              />
            </div>
          ))}
        </div>
      </div>
      
      <EditConnectionDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        connection={selectedConnection}
        contacts={contacts}
        onUpdate={(id, type, description) => {
          onUpdateConnection?.(id, type, description);
          setSelectedConnection(null);
        }}
        onDelete={(id) => {
          onDeleteConnection?.(id);
          setSelectedConnection(null);
        }}
      />
    </>
  );
}