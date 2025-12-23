import { useMemo, useState } from 'react';
import { Contact, ContactConnection, RELATIONSHIP_TYPES, STATUS_CONFIG, POSITION_OPTIONS } from './types';
import { Badge } from '@/components/ui/badge';
import { Building2, User, ChevronDown, ChevronUp, Mail, Phone, MapPin } from 'lucide-react';
import { EditConnectionDialog } from './EditConnectionDialog';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ContactNetworkViewProps {
  contacts: Contact[];
  connections: ContactConnection[];
  onContactClick?: (contact: Contact) => void;
  onUpdateConnection?: (id: string, type: string, description: string) => void;
  onDeleteConnection?: (id: string) => void;
}

interface NodePosition {
  x: number;
  y: number;
  contact: Contact;
  connectionCount: number;
}

// Calculate optimal static layout with no overlaps
function calculateStaticLayout(contacts: Contact[], connections: ContactConnection[], containerWidth: number, containerHeight: number) {
  const nodeWidth = 140;
  const nodeHeight = 60;
  const minSpacing = 80;
  
  // Count connections per contact
  const connectionCounts: Record<string, number> = {};
  connections.forEach(conn => {
    connectionCounts[conn.from_contact_id] = (connectionCounts[conn.from_contact_id] || 0) + 1;
    connectionCounts[conn.to_contact_id] = (connectionCounts[conn.to_contact_id] || 0) + 1;
  });

  // Sort contacts by connection count (most connected first)
  const sortedContacts = [...contacts].sort((a, b) => {
    return (connectionCounts[b.id] || 0) - (connectionCounts[a.id] || 0);
  });

  const positions: NodePosition[] = [];
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;

  if (sortedContacts.length === 0) return { positions, connectionCounts };

  // Group contacts by connection tier
  const tiers: Contact[][] = [];
  let currentTier: Contact[] = [];
  let lastCount = -1;

  sortedContacts.forEach(contact => {
    const count = connectionCounts[contact.id] || 0;
    if (count !== lastCount && currentTier.length > 0) {
      tiers.push(currentTier);
      currentTier = [];
    }
    currentTier.push(contact);
    lastCount = count;
  });
  if (currentTier.length > 0) tiers.push(currentTier);

  // Place each tier in concentric rings
  let currentRadius = 0;
  
  tiers.forEach((tier, tierIndex) => {
    if (tierIndex === 0 && tier.length === 1) {
      // Single most-connected contact at center
      positions.push({
        x: centerX,
        y: centerY,
        contact: tier[0],
        connectionCount: connectionCounts[tier[0].id] || 0,
      });
      currentRadius = Math.max(nodeWidth, nodeHeight) + minSpacing;
    } else {
      // Calculate radius for this tier to avoid overlaps
      const circumference = tier.length * (nodeWidth + minSpacing);
      const neededRadius = Math.max(currentRadius + nodeHeight + minSpacing, circumference / (2 * Math.PI));
      
      tier.forEach((contact, i) => {
        const angle = (2 * Math.PI * i) / tier.length - Math.PI / 2;
        positions.push({
          x: centerX + neededRadius * Math.cos(angle),
          y: centerY + neededRadius * Math.sin(angle),
          contact,
          connectionCount: connectionCounts[contact.id] || 0,
        });
      });
      
      currentRadius = neededRadius + nodeHeight / 2;
    }
  });

  // Final pass: ensure no overlaps
  const iterations = 100;
  for (let iter = 0; iter < iterations; iter++) {
    let moved = false;
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[j].x - positions[i].x;
        const dy = positions[j].y - positions[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = nodeWidth + minSpacing;
        
        if (dist < minDist && dist > 0) {
          const overlap = (minDist - dist) / 2;
          const moveX = (dx / dist) * overlap;
          const moveY = (dy / dist) * overlap;
          
          positions[i].x -= moveX;
          positions[i].y -= moveY;
          positions[j].x += moveX;
          positions[j].y += moveY;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }

  return { positions, connectionCounts };
}

// Calculate edge path that curves around nodes
function calculateEdgePath(
  from: NodePosition,
  to: NodePosition,
  allPositions: NodePosition[],
  nodeWidth: number,
  nodeHeight: number
): string {
  const startX = from.x;
  const startY = from.y;
  const endX = to.x;
  const endY = to.y;
  
  // Calculate control point for curved line
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  
  // Curve away from center to avoid overlapping with nodes
  const dx = endX - startX;
  const dy = endY - startY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // Perpendicular offset for curve
  const perpX = -dy / dist;
  const perpY = dx / dist;
  const curveAmount = Math.min(dist * 0.2, 40);
  
  const controlX = midX + perpX * curveAmount;
  const controlY = midY + perpY * curveAmount;
  
  return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
}

// Compact contact node component
function CompactContactNode({ 
  position, 
  onClick,
  isExpanded,
  onToggleExpand 
}: { 
  position: NodePosition;
  onClick: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const { contact, connectionCount } = position;
  const statusConfig = STATUS_CONFIG[contact.status];
  const positionLabel = POSITION_OPTIONS.find(p => p.value === contact.position)?.label || contact.position;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{ left: position.x, top: position.y, zIndex: isExpanded ? 100 : 10 }}
    >
      <div 
        className={cn(
          "rounded-lg bg-card border shadow-md transition-all duration-200 cursor-pointer",
          isExpanded ? "border-primary shadow-lg" : "border-border hover:border-primary/50 hover:shadow-lg"
        )}
        style={{ minWidth: isExpanded ? 200 : 120 }}
      >
        {/* Compact Header - Always visible */}
        <div 
          className="px-3 py-2 flex items-center gap-2"
          onClick={onClick}
        >
          <div className={cn("p-1.5 rounded-md", statusConfig.bgColor)}>
            <User className={cn("w-3 h-3", statusConfig.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-xs truncate">{contact.name}</p>
            {connectionCount > 0 && (
              <p className="text-[10px] text-primary">{connectionCount} Verb.</p>
            )}
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
            className="p-1 hover:bg-secondary/50 rounded"
          >
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
        
        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border"
            >
              <div className="px-3 py-2 space-y-1.5 text-xs">
                {contact.company && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="w-3 h-3" />
                    <span className="truncate">{contact.company}</span>
                  </div>
                )}
                {positionLabel && (
                  <p className="text-muted-foreground truncate">{positionLabel}</p>
                )}
                {contact.email && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    <span>{contact.phone}</span>
                  </div>
                )}
                <div className="pt-1">
                  <Badge variant="outline" className={cn(statusConfig.bgColor, statusConfig.color, "border-0 text-[10px]")}>
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Connection line component
function ConnectionLine({ 
  connection, 
  fromPos, 
  toPos,
  allPositions,
  onClick,
  isSelected 
}: { 
  connection: ContactConnection;
  fromPos: NodePosition;
  toPos: NodePosition;
  allPositions: NodePosition[];
  onClick: () => void;
  isSelected: boolean;
}) {
  const relationshipLabel = RELATIONSHIP_TYPES.find(r => r.value === connection.relationship_type)?.label || connection.relationship_type;
  const path = calculateEdgePath(fromPos, toPos, allPositions, 140, 60);
  
  // Calculate label position
  const midX = (fromPos.x + toPos.x) / 2;
  const midY = (fromPos.y + toPos.y) / 2;
  
  // Slight offset for label
  const dx = toPos.x - fromPos.x;
  const dy = toPos.y - fromPos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const perpX = -dy / dist;
  const perpY = dx / dist;
  const labelOffset = 12;
  const labelX = midX + perpX * labelOffset;
  const labelY = midY + perpY * labelOffset;

  return (
    <g className="cursor-pointer" onClick={onClick}>
      {/* Invisible wider path for easier clicking */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
      />
      {/* Visible path */}
      <path
        d={path}
        fill="none"
        stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.5)"}
        strokeWidth={isSelected ? 3 : 2}
        strokeDasharray={isSelected ? "none" : "5,5"}
        className="transition-all duration-200"
      />
      {/* Arrow marker */}
      <circle
        cx={toPos.x}
        cy={toPos.y}
        r={4}
        fill="hsl(var(--primary))"
        className="opacity-70"
      />
      {/* Label */}
      <foreignObject
        x={labelX - 50}
        y={labelY - 10}
        width={100}
        height={20}
        className="pointer-events-none"
      >
        <div className="flex justify-center">
          <span className="bg-card/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] text-muted-foreground border border-border whitespace-nowrap">
            {relationshipLabel}
          </span>
        </div>
      </foreignObject>
    </g>
  );
}

export function ContactNetworkView({ 
  contacts, 
  connections, 
  onContactClick,
  onUpdateConnection,
  onDeleteConnection 
}: ContactNetworkViewProps) {
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<ContactConnection | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Calculate container dimensions based on contact count
  const containerHeight = Math.max(500, Math.min(800, 300 + contacts.length * 50));
  const containerWidth = 1200;

  const { positions, connectionCounts } = useMemo(() => {
    return calculateStaticLayout(contacts, connections, containerWidth, containerHeight);
  }, [contacts, connections, containerWidth, containerHeight]);

  // Calculate viewBox to fit all nodes with padding
  const viewBox = useMemo(() => {
    if (positions.length === 0) return { minX: 0, minY: 0, width: containerWidth, height: containerHeight };
    
    const padding = 100;
    const xs = positions.map(p => p.x);
    const ys = positions.map(p => p.y);
    const minX = Math.min(...xs) - padding;
    const maxX = Math.max(...xs) + padding;
    const minY = Math.min(...ys) - padding;
    const maxY = Math.max(...ys) + padding;
    
    return {
      minX,
      minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [positions, containerWidth, containerHeight]);

  if (contacts.length === 0) {
    return (
      <div className="h-[500px] flex items-center justify-center text-muted-foreground">
        <p>Keine Kontakte zum Anzeigen</p>
      </div>
    );
  }

  return (
    <>
      <div 
        className="rounded-xl border border-border bg-gradient-to-br from-card/80 to-secondary/20 overflow-hidden relative"
        style={{ height: containerHeight }}
      >
        {/* Header */}
        <div className="absolute top-3 left-3 z-20 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-muted-foreground border border-border">
          <span className="font-medium text-foreground">{contacts.length}</span> Kontakte • 
          <span className="font-medium text-foreground ml-1">{connections.length}</span> Verbindungen
          <br />
          <span className="opacity-70">Klicke zum Bearbeiten</span>
        </div>

        {/* SVG for connections - rendered FIRST so it's behind nodes */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ zIndex: 1 }}
        >
          <g className="pointer-events-auto">
            {connections.map(conn => {
              const fromPos = positions.find(p => p.contact.id === conn.from_contact_id);
              const toPos = positions.find(p => p.contact.id === conn.to_contact_id);
              if (!fromPos || !toPos) return null;
              
              return (
                <ConnectionLine
                  key={conn.id}
                  connection={conn}
                  fromPos={fromPos}
                  toPos={toPos}
                  allPositions={positions}
                  onClick={() => {
                    setSelectedConnection(conn);
                    setEditDialogOpen(true);
                  }}
                  isSelected={selectedConnection?.id === conn.id}
                />
              );
            })}
          </g>
        </svg>

        {/* Nodes container with same viewBox transformation */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ 
            transform: `scale(${Math.min(1, containerWidth / viewBox.width, containerHeight / viewBox.height)})`,
            transformOrigin: 'center center',
          }}
        >
          <div 
            className="relative w-full h-full"
            style={{
              transform: `translate(${-viewBox.minX + (containerWidth - viewBox.width) / 2}px, ${-viewBox.minY + (containerHeight - viewBox.height) / 2}px)`,
            }}
          >
            {positions.map(pos => (
              <CompactContactNode
                key={pos.contact.id}
                position={pos}
                onClick={() => onContactClick?.(pos.contact)}
                isExpanded={expandedContactId === pos.contact.id}
                onToggleExpand={() => setExpandedContactId(
                  expandedContactId === pos.contact.id ? null : pos.contact.id
                )}
              />
            ))}
          </div>
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