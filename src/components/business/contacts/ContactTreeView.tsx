import { useMemo, useState } from 'react';
import { Contact, ContactConnection, RELATIONSHIP_TYPES, STATUS_CONFIG, ContactStatus } from './types';
import { User, ChevronDown, ChevronRight } from 'lucide-react';
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
  // Find root nodes (contacts that aren't "to" in any connection)
  const toContactIds = new Set(connections.map(c => c.to_contact_id));
  
  let rootContacts = contacts.filter(c => !toContactIds.has(c.id));
  
  // If no root contacts found, use all contacts without connections as roots
  if (rootContacts.length === 0) {
    const hasConnection = new Set([
      ...connections.map(c => c.from_contact_id),
      ...connections.map(c => c.to_contact_id)
    ]);
    rootContacts = contacts.filter(c => !hasConnection.has(c.id));
  }
  
  // If still none, use the first contact
  if (rootContacts.length === 0 && contacts.length > 0) {
    rootContacts = [contacts[0]];
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

function ContactBlock({ 
  contact, 
  onClick,
}: { 
  contact: Contact;
  onClick: () => void;
}) {
  const statusConfig = getStatusConfig(contact.status);

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "px-3 py-2 rounded-lg font-medium text-sm border-2 transition-all",
        "hover:shadow-md active:shadow-sm",
        "min-w-[80px] max-w-[160px] truncate text-center",
        statusConfig.bgColor,
        statusConfig.borderColor,
        statusConfig.color,
      )}
    >
      {contact.name}
    </motion.button>
  );
}

function ConnectionLabel({ 
  connection,
  onClick,
}: {
  connection: ContactConnection;
  onClick: () => void;
}) {
  const label = RELATIONSHIP_TYPES.find(r => r.value === connection.relationship_type)?.label 
    || connection.relationship_type;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
    >
      {label}
    </button>
  );
}

function TreeBranch({ 
  node, 
  parentConnection,
  onContactClick,
  onConnectionClick,
  isRoot = false,
}: { 
  node: TreeNode;
  parentConnection?: ContactConnection;
  onContactClick: (contact: Contact) => void;
  onConnectionClick: (connection: ContactConnection) => void;
  isRoot?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Connection line from parent */}
      {!isRoot && (
        <div className="flex flex-col items-center">
          <div className="w-px h-3 bg-border" />
          {parentConnection && (
            <ConnectionLabel 
              connection={parentConnection}
              onClick={() => onConnectionClick(parentConnection)}
            />
          )}
          <div className="w-px h-3 bg-border" />
        </div>
      )}

      {/* Contact block */}
      <div className="relative">
        <ContactBlock 
          contact={node.contact}
          onClick={() => onContactClick(node.contact)}
        />
        
        {/* Expand/collapse button */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-background border border-border rounded-full flex items-center justify-center hover:bg-secondary transition-colors z-10"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        )}
      </div>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col items-center mt-2"
          >
            {/* Vertical line to children */}
            <div className="w-px h-4 bg-border" />
            
            {/* Horizontal connector if multiple children */}
            {node.children.length > 1 && (
              <div 
                className="h-px bg-border" 
                style={{ 
                  width: `${Math.min(node.children.length * 120, 300)}px` 
                }} 
              />
            )}
            
            {/* Children row */}
            <div className="flex flex-wrap justify-center gap-4 mt-0">
              {node.children.map(({ node: childNode, connection }) => (
                <TreeBranch
                  key={childNode.contact.id}
                  node={childNode}
                  parentConnection={connection}
                  onContactClick={onContactClick}
                  onConnectionClick={onConnectionClick}
                />
              ))}
            </div>
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
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Keine Kontakte zum Anzeigen</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 overflow-x-auto">
        {/* Header */}
        <div className="mb-4 pb-3 border-b border-border">
          <h3 className="font-semibold text-base sm:text-lg">Kontakt-Struktur</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {contacts.length} Kontakte, {connections.length} Verbindungen
          </p>
        </div>

        {/* Status legend - compact for mobile */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 p-2 sm:p-3 bg-secondary/30 rounded-lg">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1 text-[10px] sm:text-xs">
              <span className={cn("w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full", config.dotColor)} />
              <span className={config.color}>{config.label}</span>
            </div>
          ))}
        </div>

        {/* Tree structure */}
        <div className="flex flex-col items-center gap-8 py-4 min-w-fit">
          {trees.map((tree, idx) => (
            <div key={tree.contact.id} className="w-full">
              {idx > 0 && (
                <div className="border-t border-dashed border-border my-6" />
              )}
              <div className="flex justify-center">
                <TreeBranch
                  node={tree}
                  isRoot
                  onContactClick={(contact) => onContactClick?.(contact)}
                  onConnectionClick={(connection) => {
                    setSelectedConnection(connection);
                    setEditDialogOpen(true);
                  }}
                />
              </div>
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
