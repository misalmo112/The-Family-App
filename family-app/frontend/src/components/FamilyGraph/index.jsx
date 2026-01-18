import React, { useMemo, useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Avatar, Typography, Chip } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

/**
 * Custom Node Component for Family Graph
 */
const FamilyNode = ({ data }) => {
  const { person, isEgo, relationLabel } = data;
  const fullName = `${person.first_name || ''} ${person.last_name || ''}`.trim() || `Person ${person.id}`;
  
  const getInitials = (person) => {
    const firstName = person?.first_name || '';
    const lastName = person?.last_name || '';
    if (firstName && lastName) {
      return (firstName[0] + lastName[0]).toUpperCase();
    }
    if (firstName) return firstName.substring(0, 2).toUpperCase();
    return '?';
  };

  return (
    <Box
      sx={{
        minWidth: 150,
        p: 1.5,
        borderRadius: 2,
        border: isEgo ? 3 : 2,
        borderColor: isEgo ? 'primary.main' : 'divider',
        backgroundColor: isEgo ? 'primary.light' : 'background.paper',
        boxShadow: isEgo ? 4 : 2,
        textAlign: 'center',
      }}
    >
      <Avatar
        sx={{
          bgcolor: isEgo ? 'primary.main' : 'secondary.main',
          width: isEgo ? 56 : 48,
          height: isEgo ? 56 : 48,
          mx: 'auto',
          mb: 1,
        }}
      >
        {getInitials(person)}
      </Avatar>
      <Typography variant="subtitle2" fontWeight={600} noWrap>
        {fullName}
      </Typography>
      {isEgo && (
        <Chip label="You" size="small" color="primary" sx={{ mt: 0.5 }} />
      )}
      {relationLabel && !isEgo && (
        <Chip
          label={relationLabel}
          size="small"
          color="info"
          sx={{ mt: 0.5 }}
        />
      )}
    </Box>
  );
};

const nodeTypes = {
  familyNode: FamilyNode,
};

/**
 * Family Graph Component
 * Displays family relationships as a visual graph using React Flow
 */
const FamilyGraph = ({ 
  topology, 
  viewerPersonId, 
  currentUserPersonId,
  edgeCreationMode = false,
  onEdgeCreate,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [draggingFrom, setDraggingFrom] = useState(null);
  const [previewEdge, setPreviewEdge] = useState(null);

  // Build person map
  const personMap = useMemo(() => {
    const map = new Map();
    if (topology?.nodes) {
      topology.nodes.forEach((node) => {
        map.set(node.id, node);
      });
    }
    return map;
  }, [topology]);

  // Calculate hierarchical positions for nodes
  const calculatePositions = useCallback(() => {
    if (!topology?.nodes || !topology?.edges) return { nodes: [], edges: [] };

    const nodePositions = new Map();
    const nodeLevels = new Map();
    const processed = new Set();

    // Find ego node (viewer)
    const egoNode = topology.nodes.find((n) => n.id === viewerPersonId);
    if (!egoNode) return { nodes: [], edges: [] };

    // BFS to assign levels
    const queue = [{ nodeId: egoNode.id, level: 0 }];
    nodeLevels.set(egoNode.id, 0);
    processed.add(egoNode.id);

    while (queue.length > 0) {
      const { nodeId, level } = queue.shift();

      // Find children (this person is parent of)
      topology.edges
        .filter((e) => e.from === nodeId && e.type === 'PARENT_OF')
        .forEach((e) => {
          if (!processed.has(e.to)) {
            nodeLevels.set(e.to, level + 1);
            processed.add(e.to);
            queue.push({ nodeId: e.to, level: level + 1 });
          }
        });

      // Find parents (this person is child of)
      topology.edges
        .filter((e) => e.to === nodeId && e.type === 'PARENT_OF')
        .forEach((e) => {
          if (!processed.has(e.from)) {
            nodeLevels.set(e.from, level - 1);
            processed.add(e.from);
            queue.push({ nodeId: e.from, level: level - 1 });
          }
        });

      // Find spouses
      topology.edges
        .filter((e) => (e.from === nodeId || e.to === nodeId) && e.type === 'SPOUSE_OF')
        .forEach((e) => {
          const spouseId = e.from === nodeId ? e.to : e.from;
          if (!processed.has(spouseId)) {
            nodeLevels.set(spouseId, level);
            processed.add(spouseId);
            queue.push({ nodeId: spouseId, level });
          }
        });
    }

    // Group nodes by level
    const levelGroups = new Map();
    nodeLevels.forEach((level, nodeId) => {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level).push(nodeId);
    });

    // Calculate positions
    const nodeWidth = 180;
    const nodeHeight = 120;
    const horizontalSpacing = 200;
    const verticalSpacing = 200;

    levelGroups.forEach((nodeIds, level) => {
      const startX = -(nodeIds.length - 1) * horizontalSpacing / 2;
      nodeIds.forEach((nodeId, index) => {
        const x = startX + index * horizontalSpacing;
        const y = level * verticalSpacing;
        nodePositions.set(nodeId, { x, y });
      });
    });

    return nodePositions;
  }, [topology, viewerPersonId]);

  // Generate React Flow nodes and edges
  useMemo(() => {
    if (!topology?.nodes || !topology?.edges) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const positions = calculatePositions();
    if (positions.size === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Create nodes
    const flowNodes = topology.nodes.map((node) => {
      const position = positions.get(node.id) || { x: 0, y: 0 };
      const isEgo = node.id === viewerPersonId;
      const isCurrentUser = node.id === currentUserPersonId;

      return {
        id: String(node.id),
        type: 'familyNode',
        position,
        data: {
          person: node,
          isEgo: isEgo || isCurrentUser,
          relationLabel: node.relation_to_viewer,
        },
      };
    });

    // Create edges
    const flowEdges = topology.edges.map((edge, index) => {
      const isParentChild = edge.type === 'PARENT_OF';
      const isSpouse = edge.type === 'SPOUSE_OF';

      return {
        id: `e${edge.from}-${edge.to}-${index}`,
        source: String(edge.from),
        target: String(edge.to),
        type: isSpouse ? 'smoothstep' : 'default',
        animated: false,
        style: {
          stroke: isParentChild ? '#1976d2' : '#9c27b0',
          strokeWidth: isParentChild ? 2 : 2,
          strokeDasharray: isSpouse ? '5,5' : '0',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isParentChild ? '#1976d2' : '#9c27b0',
        },
        label: isSpouse ? 'Spouse' : '',
        labelStyle: {
          fill: isSpouse ? '#9c27b0' : '#1976d2',
          fontWeight: 600,
        },
      };
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [topology, viewerPersonId, currentUserPersonId, calculatePositions, setNodes, setEdges]);

  // Handle node drag start for edge creation
  const onNodeDragStart = useCallback((event, node) => {
    if (edgeCreationMode) {
      setDraggingFrom(node.id);
    }
  }, [edgeCreationMode]);

  // Handle node drag to create preview edge
  const onNodeDrag = useCallback((event, node) => {
    if (edgeCreationMode && draggingFrom && draggingFrom !== node.id) {
      setPreviewEdge({
        id: 'preview',
        source: draggingFrom,
        target: node.id,
        type: 'default',
        style: { stroke: '#ff6b6b', strokeWidth: 2, strokeDasharray: '5,5' },
        animated: true,
      });
    }
  }, [edgeCreationMode, draggingFrom]);

  // Handle node drop to create relationship
  const onNodeDragStop = useCallback((event, node) => {
    if (edgeCreationMode && draggingFrom && draggingFrom !== node.id && onEdgeCreate) {
      // Get person objects for the dialog
      const fromPerson = topology?.nodes?.find(n => String(n.id) === draggingFrom);
      const toPerson = topology?.nodes?.find(n => String(n.id) === node.id);
      
      if (fromPerson && toPerson) {
        onEdgeCreate(fromPerson, toPerson);
      }
    }
    setDraggingFrom(null);
    setPreviewEdge(null);
  }, [edgeCreationMode, draggingFrom, onEdgeCreate, topology]);

  // Combine edges with preview edge
  const displayEdges = useMemo(() => {
    if (previewEdge) {
      return [...edges, previewEdge];
    }
    return edges;
  }, [edges, previewEdge]);

  if (!topology?.nodes || topology.nodes.length === 0) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No family members to display
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {edgeCreationMode && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 10,
            bgcolor: 'warning.light',
            color: 'warning.contrastText',
            p: 1,
            borderRadius: 1,
            fontSize: '0.875rem',
          }}
        >
          Edge creation mode: Drag from one person to another to create a relationship
        </Box>
      )}
      <ReactFlow
        nodes={nodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        nodesDraggable={edgeCreationMode}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </Box>
  );
};

export default FamilyGraph;
