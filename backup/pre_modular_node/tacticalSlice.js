import { applyNodeChanges, applyEdgeChanges, addEdge, MarkerType } from '@xyflow/react';
import dagre from 'dagre';
import { migrateNodes, migrateEdges } from '../../utils/tacticalEngine';
import { loadProjectData } from '../storeHelpers';

export const createTacticalSlice = (set, get) => ({
  nodes: [],
  edges: [],
  past: [],
  future: [],
  copiedNodes: [],
  copiedEdges: [],
  tacticalSelection: [],

  setTacticalSelection: (selection) => set({ tacticalSelection: selection }),
  
  toggleTacticalSelection: (nodeId) => {
    set((state) => {
      const isSelected = state.tacticalSelection.includes(nodeId);
      const newSelection = isSelected
        ? state.tacticalSelection.filter(id => id !== nodeId)
        : [...state.tacticalSelection, nodeId];
      
      const updatedNodes = state.nodes.map(node => 
        node.id === nodeId ? { ...node, selected: !isSelected } : node
      );

      return { 
        tacticalSelection: newSelection,
        nodes: updatedNodes
      };
    });
    get().saveToStorage(true);
  },

  clearTacticalSelection: () => set({ tacticalSelection: [] }),

  takeSnapshot: () => {
    const { nodes, edges, past } = get();
    const newPast = [...past.slice(-49), { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }];
    set({ past: newPast, future: [] });
  },

  undo: () => {
    const { nodes, edges, past, future } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    
    set({
      nodes: previous.nodes,
      edges: previous.edges,
      past: newPast,
      future: [{ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }, ...future].slice(0, 50)
    });
    get().saveToStorage();
  },

  redo: () => {
    const { nodes, edges, past, future } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      nodes: next.nodes,
      edges: next.edges,
      past: [...past, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }].slice(-50),
      future: newFuture
    });
    get().saveToStorage();
  },

  onNodesChange: (changes) => {
    const { currentProjectId, projectList, nodes, multiSelectMode } = get();
    const project = projectList.find(p => p.id === currentProjectId);
    
    if (multiSelectMode) {
      const filteredChanges = changes.filter(c => c.type !== 'select');
      if (filteredChanges.length > 0) {
        set({ nodes: applyNodeChanges(filteredChanges, nodes) });
        get().saveToStorage();
      }
      return;
    }

    if (project?.isLocked) {
      const selectionOnlyChanges = changes.filter(c => c.type === 'select');
      if (selectionOnlyChanges.length === 0) return;
      set({ nodes: applyNodeChanges(selectionOnlyChanges, nodes) });
      return;
    }

    set({ nodes: applyNodeChanges(changes, nodes) });
    get().saveToStorage();
  },

  onEdgesChange: (changes) => {
    const { currentProjectId, projectList, edges } = get();
    const project = projectList.find(p => p.id === currentProjectId);
    
    if (project?.isLocked) {
      const selectionOnlyChanges = changes.filter(c => c.type === 'select');
      if (selectionOnlyChanges.length === 0) return;
      set({ edges: applyEdgeChanges(selectionOnlyChanges, edges) });
      return;
    }

    set({ edges: applyEdgeChanges(changes, edges) });
    get().saveToStorage();
  },

  onConnect: (connection) => {
    const { currentProjectId, projectList } = get();
    const project = projectList.find(p => p.id === currentProjectId);
    if (project?.isLocked) return;

    get().takeSnapshot();
    set((state) => ({
      edges: addEdge({ 
        ...connection, 
        type: 'tactical', 
        animated: true,
        style: { stroke: '#00e5ff', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#00e5ff' }
      }, state.edges),
    }));
    get().saveToStorage();
  },

  addNode: (position, label = '새 전술 거점', shape = 'process', type = 'tactical') => {
    const { currentProjectId, projectList } = get();
    const project = projectList.find(p => p.id === currentProjectId);
    if (project?.isLocked) return;

    get().takeSnapshot();
    const newNode = {
      id: `node-${Date.now()}`,
      type,
      position,
      data: { 
        label, 
        shape, 
        memo: '',
        sheet: {
          columns: [
            { id: 'c1', name: '품명', type: 'text' },
            { id: 'c2', name: '단가', type: 'number' },
            { id: 'c3', name: '수량', type: 'number' },
            { id: 'c4', name: '소계', type: 'formula', formula: '(c2 * c3)' }
          ],
          rows: []
        }
      },
      measured: { width: 200, height: 70 }
    };
    set((state) => ({
      nodes: [...state.nodes, newNode],
    }));
    get().saveToStorage();
  },

  updateNodeLabel: (id, label) => {
    get().takeSnapshot();
    set((state) => ({
      nodes: state.nodes.map((node) => 
        node.id === id ? { ...node, data: { ...node.data, label } } : node
      ),
    }));
    get().saveToStorage();
  },

  updateNodeShape: (id, shape) => {
    set((state) => ({
      nodes: state.nodes.map((node) => 
        node.id === id ? { ...node, data: { ...node.data, shape } } : node
      ),
    }));
    get().saveToStorage();
  },

  onCycleShape: (id) => {
    get().takeSnapshot();
    const { nodes } = get();
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    
    const shapes = ['process', 'decision', 'io', 'subroutine', 'database', 'terminal'];
    const currentShape = node.data?.shape || 'process';
    const currentIndex = shapes.indexOf(currentShape);
    const nextIndex = (currentIndex + 1) % shapes.length;
    const nextShape = shapes[nextIndex];
    
    set({
      nodes: nodes.map(n => n.id === id ? { ...n, data: { ...n.data, shape: nextShape } } : n)
    });
    get().saveToStorage();
  },

  updateNodeMemo: (id, memo) => {
    set((state) => ({
      nodes: state.nodes.map((node) => 
        node.id === id ? { ...node, data: { ...node.data, memo } } : node
      ),
    }));
    get().saveToStorage();
  },

  createGroup: (selectedNodes) => {
    if (selectedNodes.length === 0) return;
    const minX = Math.min(...selectedNodes.map(n => n.position.x));
    const minY = Math.min(...selectedNodes.map(n => n.position.y));
    const maxX = Math.max(...selectedNodes.map(n => n.position.x + (n.width || 200)));
    const maxY = Math.max(...selectedNodes.map(n => n.position.y + (n.height || 70)));
    const padding = 60;
    const groupId = `group-${Date.now()}`;
    const groupNode = {
      id: groupId, type: 'auraGroup', position: { x: minX - padding, y: minY - padding },
      style: { width: (maxX - minX) + padding * 2, height: (maxY - minY) + padding * 2 },
      data: { label: '새 전술 구역' }, zIndex: -1,
    };
    const updatedNodes = get().nodes.map(node => {
      const isSelected = selectedNodes.find(sn => sn.id === node.id);
      if (isSelected) {
        return { ...node, parentId: groupId, extent: 'parent', position: { x: node.position.x - (minX - padding), y: node.position.y - (minY - padding) } };
      }
      return node;
    });
    set({ nodes: [groupNode, ...updatedNodes] });
    get().saveToStorage();
  },

  ungroup: (groupId) => {
    const state = get();
    const groupNode = state.nodes.find(n => n.id === groupId);
    if (!groupNode) return;
    const groupPos = groupNode.position;
    
    const updatedNodes = state.nodes.map(node => {
      if (node.parentId === groupId) {
        return {
          ...node,
          parentId: null,
          position: { x: groupPos.x + node.position.x, y: groupPos.y + node.position.y },
          hidden: false
        };
      }
      return node;
    }).filter(n => n.id !== groupId);

    const updatedEdges = state.edges.map(edge => ({ ...edge, hidden: false }));

    set({ nodes: updatedNodes, edges: updatedEdges });
    get().saveToStorage();
  },

  toggleGroupCollapse: (groupId) => {
    const state = get();
    const groupNode = state.nodes.find(n => n.id === groupId);
    if (!groupNode) return;

    const isCollapsing = !groupNode.data.collapsed;
    const childIds = state.nodes.filter(n => n.parentId === groupId).map(n => n.id);
    
    const updatedNodes = state.nodes.map(node => {
      if (node.id === groupId) {
        return {
          ...node,
          data: { 
            ...node.data, 
            collapsed: isCollapsing,
            prevWidth: isCollapsing ? node.style.width : node.data.prevWidth,
            prevHeight: isCollapsing ? node.style.height : node.data.prevHeight,
          },
          style: {
            ...node.style,
            width: isCollapsing ? 200 : (node.data.prevWidth || 200),
            height: isCollapsing ? 50 : (node.data.prevHeight || 150),
          }
        };
      }
      if (node.parentId === groupId) return { ...node, hidden: isCollapsing };
      return node;
    });

    const updatedEdges = state.edges.map(edge => {
      const isSourceInside = childIds.includes(edge.source);
      const isTargetInside = childIds.includes(edge.target);

      if (isCollapsing) {
        if (isSourceInside && isTargetInside) return { ...edge, hidden: true };
        if (isSourceInside || isTargetInside) {
          return {
            ...edge,
            data: { ...edge.data, originalSource: edge.source, originalTarget: edge.target },
            source: isSourceInside ? groupId : edge.source,
            target: isTargetInside ? groupId : edge.target,
          };
        }
      } else {
        if (edge.data?.originalSource || edge.data?.originalTarget) {
          return {
            ...edge,
            source: edge.data.originalSource || edge.source,
            target: edge.data.originalTarget || edge.target,
            hidden: false,
            data: { ...edge.data, originalSource: null, originalTarget: null }
          };
        }
        if (isSourceInside && isTargetInside) return { ...edge, hidden: false };
      }
      return edge;
    });

    set({ nodes: updatedNodes, edges: updatedEdges });
    get().saveToStorage();
  },

  deleteSelection: (selectedNodes, selectedEdges) => {
    get().takeSnapshot();
    const nodeIdsToDelete = selectedNodes.map(n => n.id);
    const edgeIdsToDelete = selectedEdges.map(e => e.id);

    set((state) => ({
      nodes: state.nodes.filter(node => !nodeIdsToDelete.includes(node.id)),
      edges: state.edges.filter(edge => !edgeIdsToDelete.includes(edge.id)),
    }));
    get().saveToStorage();
  },

  autoLayout: (direction = 'TB') => {
    const { nodes, edges } = get();
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    const nodeWidth = 220;
    const nodeHeight = 80;

    dagreGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: 100 });

    nodes.forEach((node) => {
      if (node.type !== 'auraGroup') dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const updatedNodes = nodes.map((node) => {
      if (node.type !== 'auraGroup') {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
          ...node,
          position: { x: nodeWithPosition.x - nodeWidth / 2, y: nodeWithPosition.y - nodeHeight / 2 },
        };
      }
      return node;
    });

    set({ nodes: updatedNodes });
    get().saveToStorage();
  },

  copySelection: () => {
    const { nodes, edges } = get();
    const selectedNodes = nodes.filter(n => n.selected);
    const selectedNodeIds = selectedNodes.map(n => n.id);
    const selectedEdges = edges.filter(e => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target));
    set({ copiedNodes: JSON.parse(JSON.stringify(selectedNodes)), copiedEdges: JSON.parse(JSON.stringify(selectedEdges)) });
  },

  pasteSelection: (position = null) => {
    const { copiedNodes, copiedEdges, nodes, edges } = get();
    if (copiedNodes.length === 0) return;
    get().takeSnapshot();
    const idMap = {};
    const timestamp = Date.now();
    const newNodes = copiedNodes.map((node, index) => {
      const newId = `node-${timestamp}-${index}`;
      idMap[node.id] = newId;
      const newPos = position ? { x: position.x + (node.position.x - copiedNodes[0].position.x), y: position.y + (node.position.y - copiedNodes[0].position.y) } : { x: node.position.x + 40, y: node.position.y + 40 };
      return { ...node, id: newId, position: newPos, selected: true, dragging: false };
    });
    const newEdges = copiedEdges.map((edge, index) => ({ ...edge, id: `edge-${timestamp}-${index}`, source: idMap[edge.source], target: idMap[edge.target], selected: false }));
    const deselectedNodes = nodes.map(n => ({ ...n, selected: false }));
    const deselectedEdges = edges.map(e => ({ ...e, selected: false }));
    set({ nodes: [...deselectedNodes, ...newNodes], edges: [...deselectedEdges, ...newEdges] });
    get().saveToStorage();
  },

  updateNodeSheet: (id, sheetData) => {
    set((state) => {
      const newNodes = state.nodes.map((node) => 
        node.id === id ? { ...node, data: { ...node.data, sheet: sheetData } } : node
      );
      return { nodes: newNodes };
    });
    get().saveToStorage(true);
  },

  updatePendingRow: (id, rowData) => {
    set((state) => ({
      nodes: state.nodes.map((node) => 
        node.id === id ? { ...node, data: { ...node.data, pendingRow: rowData } } : node
      ),
    }));
  },

  loadFromData: (data) => {
    if (!data || !data.nodes) return;
    const newProjectId = `import-${Date.now()}`;
    const newProjectName = data.projectName || `이관된 작전_${new Date().toLocaleTimeString()}`;

    const migratedNodes = migrateNodes(data.nodes);
    const migratedEdges = migrateEdges(data.edges || [], migratedNodes);

    set({ 
      currentProjectId: newProjectId,
      currentProjectName: newProjectName,
      nodes: migratedNodes, 
      edges: migratedEdges,
      past: [],
      future: []
    });
    
    get().saveToStorage(); 
  },
});
