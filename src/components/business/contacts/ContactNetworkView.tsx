import { useMemo, useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Contact, ContactConnection, RELATIONSHIP_TYPES, STATUS_CONFIG, POSITION_OPTIONS } from './types';
import { Badge } from '@/components/ui/badge';
import { Building2, User, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditConnectionDialog } from './EditConnectionDialog';

interface ContactNetworkViewProps {
  contacts: Contact[];
  connections: ContactConnection[];
  onContactClick?: (contact: Contact) => void;
  onUpdateConnection?: (id: string, type: string, description: string) => void;
  onDeleteConnection?: (id: string) => void;
}

// Custom node component for contacts
function ContactNode({ data }: { data: { contact: Contact; connectionCount: number } }) {
  const { contact, connectionCount } = data;
  const statusConfig = STATUS_CONFIG[contact.status];
  const positionLabel = POSITION_OPTIONS.find(p => p.value === contact.position)?.label || contact.position;

  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
      <Handle type="target" position={Position.Left} className="!bg-primary" />
      <Handle type="source" position={Position.Right} className="!bg-primary" />
      
      <div className="px-4 py-3 rounded-xl bg-card border border-border shadow-lg hover:shadow-xl hover:border-primary/50 transition-all cursor-pointer min-w-[180px]">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
            <User className={`w-4 h-4 ${statusConfig.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{contact.name}</p>
            {positionLabel && (
              <p className="text-xs text-muted-foreground truncate">{positionLabel}</p>
            )}
          </div>
        </div>
        
        {contact.company && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <Building2 className="w-3 h-3" />
            <span className="truncate">{contact.company}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${statusConfig.bgColor} ${statusConfig.color} border-0 text-[10px]`}>
            {statusConfig.label}
          </Badge>
          {connectionCount > 0 && (
            <Badge variant="outline" className="bg-primary/20 text-primary border-0 text-[10px]">
              {connectionCount} Verbindungen
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

const nodeTypes = {
  contact: ContactNode,
};

// Force-directed layout algorithm
function calculateForceDirectedLayout(contacts: Contact[], connections: ContactConnection[]) {
  const width = 800;
  const height = 600;
  
  // Count connections per contact for importance
  const connectionCounts: Record<string, number> = {};
  connections.forEach(conn => {
    connectionCounts[conn.from_contact_id] = (connectionCounts[conn.from_contact_id] || 0) + 1;
    connectionCounts[conn.to_contact_id] = (connectionCounts[conn.to_contact_id] || 0) + 1;
  });

  // Sort contacts by connection count (most connected first)
  const sortedContacts = [...contacts].sort((a, b) => {
    return (connectionCounts[b.id] || 0) - (connectionCounts[a.id] || 0);
  });

  // Initialize positions
  const positions: Record<string, { x: number; y: number }> = {};
  
  // Place the most connected contact in the center
  if (sortedContacts.length > 0) {
    const centerContact = sortedContacts[0];
    positions[centerContact.id] = { x: width / 2, y: height / 2 };
    
    // Place connected contacts around it
    const connectedIds = new Set<string>();
    connections.forEach(conn => {
      if (conn.from_contact_id === centerContact.id) connectedIds.add(conn.to_contact_id);
      if (conn.to_contact_id === centerContact.id) connectedIds.add(conn.from_contact_id);
    });
    
    // Arrange connected contacts in a circle around center
    const connectedContacts = sortedContacts.filter(c => connectedIds.has(c.id));
    const radius = Math.min(250, 150 + connectedContacts.length * 20);
    connectedContacts.forEach((contact, i) => {
      const angle = (2 * Math.PI * i) / connectedContacts.length - Math.PI / 2;
      positions[contact.id] = {
        x: width / 2 + radius * Math.cos(angle),
        y: height / 2 + radius * Math.sin(angle),
      };
    });
    
    // Place remaining contacts in outer ring
    const remaining = sortedContacts.filter(c => c.id !== centerContact.id && !connectedIds.has(c.id));
    const outerRadius = radius + 180;
    remaining.forEach((contact, i) => {
      const angle = (2 * Math.PI * i) / remaining.length - Math.PI / 2;
      positions[contact.id] = {
        x: width / 2 + outerRadius * Math.cos(angle),
        y: height / 2 + outerRadius * Math.sin(angle),
      };
    });
  }

  // Apply force-directed refinement
  const iterations = 50;
  const repulsionStrength = 5000;
  const attractionStrength = 0.1;
  const minDistance = 200;

  for (let iter = 0; iter < iterations; iter++) {
    const forces: Record<string, { fx: number; fy: number }> = {};
    
    // Initialize forces
    contacts.forEach(c => {
      forces[c.id] = { fx: 0, fy: 0 };
    });

    // Repulsion between all nodes
    for (let i = 0; i < contacts.length; i++) {
      for (let j = i + 1; j < contacts.length; j++) {
        const c1 = contacts[i];
        const c2 = contacts[j];
        const p1 = positions[c1.id];
        const p2 = positions[c2.id];
        
        if (!p1 || !p2) continue;
        
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        
        if (dist < minDistance) {
          const force = repulsionStrength / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          
          forces[c1.id].fx -= fx;
          forces[c1.id].fy -= fy;
          forces[c2.id].fx += fx;
          forces[c2.id].fy += fy;
        }
      }
    }

    // Attraction along edges
    connections.forEach(conn => {
      const p1 = positions[conn.from_contact_id];
      const p2 = positions[conn.to_contact_id];
      
      if (!p1 || !p2) return;
      
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const force = dist * attractionStrength;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      
      if (forces[conn.from_contact_id]) {
        forces[conn.from_contact_id].fx += fx;
        forces[conn.from_contact_id].fy += fy;
      }
      if (forces[conn.to_contact_id]) {
        forces[conn.to_contact_id].fx -= fx;
        forces[conn.to_contact_id].fy -= fy;
      }
    });

    // Apply forces with damping
    const damping = 0.8 - (iter / iterations) * 0.5;
    contacts.forEach(c => {
      if (positions[c.id]) {
        positions[c.id].x += forces[c.id].fx * damping;
        positions[c.id].y += forces[c.id].fy * damping;
        
        // Keep within bounds
        positions[c.id].x = Math.max(100, Math.min(width - 100, positions[c.id].x));
        positions[c.id].y = Math.max(80, Math.min(height - 80, positions[c.id].y));
      }
    });
  }

  return { positions, connectionCounts };
}

export function ContactNetworkView({ 
  contacts, 
  connections, 
  onContactClick,
  onUpdateConnection,
  onDeleteConnection 
}: ContactNetworkViewProps) {
  const [selectedConnection, setSelectedConnection] = useState<ContactConnection | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { nodes, edges } = useMemo(() => {
    const { positions, connectionCounts } = calculateForceDirectedLayout(contacts, connections);

    const nodes: Node[] = contacts.map((contact) => ({
      id: contact.id,
      type: 'contact',
      position: positions[contact.id] || { x: 400, y: 300 },
      data: {
        contact,
        connectionCount: connectionCounts[contact.id] || 0,
      },
    }));

    // Create edges
    const edges: Edge[] = connections.map(conn => {
      const relationshipLabel = RELATIONSHIP_TYPES.find(r => r.value === conn.relationship_type)?.label || conn.relationship_type;
      return {
        id: conn.id,
        source: conn.from_contact_id,
        target: conn.to_contact_id,
        label: relationshipLabel,
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
        labelStyle: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
        labelBgStyle: { fill: 'hsl(var(--card))', fillOpacity: 0.9 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(var(--primary))',
        },
      };
    });

    return { nodes, edges };
  }, [contacts, connections]);

  const [nodesState, setNodes, onNodesChange] = useNodesState(nodes);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(edges);

  // Update nodes when data changes
  useMemo(() => {
    setNodes(nodes);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const contact = contacts.find(c => c.id === node.id);
    if (contact && onContactClick) {
      onContactClick(contact);
    }
  }, [contacts, onContactClick]);

  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    const connection = connections.find(c => c.id === edge.id);
    if (connection) {
      setSelectedConnection(connection);
      setEditDialogOpen(true);
    }
  }, [connections]);

  if (contacts.length === 0) {
    return (
      <div className="h-[500px] flex items-center justify-center text-muted-foreground">
        <p>Keine Kontakte zum Anzeigen</p>
      </div>
    );
  }

  return (
    <>
      <div className="h-[500px] rounded-xl border border-border bg-card/50 overflow-hidden relative">
        <div className="absolute top-3 left-3 z-10 bg-card/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-muted-foreground">
          Klicke auf Kontakte zum Bearbeiten • Klicke auf Verbindungen zum Bearbeiten/Löschen
        </div>
        <ReactFlow
          nodes={nodesState}
          edges={edgesState}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          minZoom={0.3}
          maxZoom={1.5}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        >
          <Background color="hsl(var(--muted-foreground))" gap={20} size={1} />
          <Controls className="!bg-card !border-border" />
        </ReactFlow>
      </div>
      
      <EditConnectionDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        connection={selectedConnection}
        contacts={contacts}
        onUpdate={(id, type, description) => {
          onUpdateConnection?.(id, type, description);
        }}
        onDelete={(id) => {
          onDeleteConnection?.(id);
        }}
      />
    </>
  );
}
