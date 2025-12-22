import { useMemo, useCallback } from 'react';
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
import { Contact, ContactConnection, RELATIONSHIP_TYPES, STATUS_CONFIG } from './types';
import { Badge } from '@/components/ui/badge';
import { Building2, User } from 'lucide-react';

interface ContactNetworkViewProps {
  contacts: Contact[];
  connections: ContactConnection[];
  onContactClick?: (contact: Contact) => void;
}

// Custom node component for contacts
function ContactNode({ data }: { data: { contact: Contact; connectionCount: number } }) {
  const { contact, connectionCount } = data;
  const statusConfig = STATUS_CONFIG[contact.status];

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
            {contact.position && (
              <p className="text-xs text-muted-foreground truncate">{contact.position}</p>
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

export function ContactNetworkView({ contacts, connections, onContactClick }: ContactNetworkViewProps) {
  const { nodes, edges } = useMemo(() => {
    // Count connections per contact
    const connectionCounts: Record<string, number> = {};
    connections.forEach(conn => {
      connectionCounts[conn.from_contact_id] = (connectionCounts[conn.from_contact_id] || 0) + 1;
      connectionCounts[conn.to_contact_id] = (connectionCounts[conn.to_contact_id] || 0) + 1;
    });

    // Create nodes in a circular layout
    const centerX = 400;
    const centerY = 300;
    const radius = Math.min(250, 50 + contacts.length * 30);

    const nodes: Node[] = contacts.map((contact, index) => {
      const angle = (2 * Math.PI * index) / contacts.length - Math.PI / 2;
      return {
        id: contact.id,
        type: 'contact',
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
        data: {
          contact,
          connectionCount: connectionCounts[contact.id] || 0,
        },
      };
    });

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

  if (contacts.length === 0) {
    return (
      <div className="h-[500px] flex items-center justify-center text-muted-foreground">
        <p>Keine Kontakte zum Anzeigen</p>
      </div>
    );
  }

  return (
    <div className="h-[500px] rounded-xl border border-border bg-card/50 overflow-hidden">
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
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
  );
}
