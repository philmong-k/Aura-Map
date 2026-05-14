import React, { useCallback, useState, useEffect } from 'react';
import { ReactFlow, Background, BackgroundVariant, MiniMap, useReactFlow, MarkerType, Panel, SelectionMode } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFlowStore } from '../store/useFlowStore';
import { useAuthStore } from '../store/useAuthStore';
import AgentNode from './AgentNode';
import GroupNode from './GroupNode';
import TacticalTableView from './TacticalTableView';
import { TacticalIO } from './TacticalIO';
import { ZoomIn, ZoomOut, Maximize, LayoutList, Monitor } from 'lucide-react';
import NodeEditorModal from './NodeEditorModal';
import VaultActionModal from './VaultActionModal';

import { usePermissions } from '../logic/usePermissions';

const nodeTypes = {
  viewer: AgentNode,
  group: GroupNode,
};

export default function CanvasBoard() {
  const { canEdit: globalCanEdit } = usePermissions();
  const currentDoc = useFlowStore((state) => state.currentDoc);
  const user = useAuthStore((state) => state.user);
  
  const isTableView = useFlowStore(state => state.isTableView);
  const setIsTableView = useFlowStore(state => state.setIsTableView);
  const isSelectMode = useFlowStore(state => state.isSelectMode);
  
  const isOwner = currentDoc ? currentDoc.user_id === user?.email : true;
  const isAdmin = user?.role === 'admin';
  const canEdit = globalCanEdit && (isOwner || isAdmin);

  const nodes = useFlowStore((state) => state.nodes);
  const rawEdges = useFlowStore((state) => state.edges);
  const { 
    onNodesChange, onEdgesChange, onConnect, addNode, updateNodeData, 
    updateEdgeLabel, undo, redo, setNodes 
  } = useFlowStore();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'prompt' | 'confirm';
    title: string;
    initialValue?: string;
    targetId?: string;
  }>({
    isOpen: false,
    type: 'prompt',
    title: '',
  });

  const edges = rawEdges.map(edge => ({
    ...edge,
    animated: true,
    style: {
      stroke: edge.selected ? '#ff9800' : '#00e5ff',
      strokeWidth: edge.selected ? 3 : 2,
      filter: edge.selected ? 'drop-shadow(0 0 8px #ff9800)' : 'drop-shadow(0 0 5px rgba(0, 229, 255, 0.4))',
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: edge.selected ? '#ff9800' : '#00e5ff',
    }
  }));

  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();

  useEffect(() => {
    if (!canEdit) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); }
      if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canEdit]);
  
  const onNodeClick = useCallback((_event: any, node: any) => {
    if (isSelectMode) {
      setNodes(nodes.map((n) => (n.id === node.id ? { ...n, selected: !n.selected } : n)));
    }
  }, [isSelectMode, nodes, setNodes]);

  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: any) => {
    if (!canEdit) return;
    setSelectedNode(node);
    setIsEditorOpen(true);
  }, [canEdit]);

  const handleSaveNode = (newData: any) => {
    if (selectedNode) {
      updateNodeData(selectedNode.id, newData);
      setIsEditorOpen(false);
      setSelectedNode(null);
    }
  };

  const onEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: any) => {
    if (!canEdit) return;
    event.stopPropagation();
    setModal({
      isOpen: true,
      type: 'prompt',
      title: 'UPDATE EDGE IDENTIFIER',
      initialValue: edge.label || '',
      targetId: edge.id
    });
  }, [canEdit]);

  const onModalConfirm = (newLabel: string) => {
    if (modal.targetId) {
      updateEdgeLabel(modal.targetId, newLabel);
    }
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  const onPaneDoubleClick = useCallback((event: React.MouseEvent) => {
    if (!canEdit) return;
    if ((event.target as Element).closest('.react-flow__node')) return;
    event.preventDefault();
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    addNode({
      id: `node-${Date.now()}`,
      type: 'viewer',
      position,
      data: { label: 'New Agent', description: '', symbolType: 'process' },
    });
  }, [screenToFlowPosition, addNode, canEdit]);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} onDoubleClick={onPaneDoubleClick}>
      {!isMobile && (
        <button
          onClick={() => setIsTableView(!isTableView)}
          style={{
            position: 'fixed', bottom: '25px', right: '360px', zIndex: 9999,
            background: isTableView ? '#00e5ff' : 'rgba(15, 15, 20, 0.8)',
            backdropFilter: 'blur(10px)', color: isTableView ? '#000' : '#00e5ff',
            border: '1px solid #00e5ff', borderRadius: '12px', padding: '12px 20px',
            display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '900',
            fontSize: '13px', letterSpacing: '1px', cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)', transition: 'all 0.3s'
          }}
        >
          {isTableView ? <><Monitor size={18} /> CANVAS</> : <><LayoutList size={18} /> TABLE</>}
        </button>
      )}

      {isTableView ? (
        <TacticalTableView />
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={canEdit ? onConnect : undefined}
          onEdgeDoubleClick={onEdgeDoubleClick}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          zoomOnDoubleClick={false}
          deleteKeyCode={canEdit ? ['Backspace', 'Delete'] : null}
          nodeTypes={nodeTypes}
          nodesDraggable={canEdit}
          nodesConnectable={canEdit}
          nodesFocusable={canEdit}
          elementsSelectable={true} 
          fitView
          fitViewOptions={{ padding: isMobile ? 0.2 : 0.1 }}
          minZoom={isMobile ? 0.2 : 0.5}
          maxZoom={2}
          selectionOnDrag={isSelectMode}
          panOnDrag={!isSelectMode}
          selectionMode={SelectionMode.Partial}
          zoomOnPinch={!isSelectMode}
          zoomOnDoubleTap={!isSelectMode}
          panOnScroll={!isSelectMode}
          preventScrolling={isSelectMode}
          connectionRadius={isMobile ? 60 : 30}
          style={{ width: '100%', height: '100%' }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="rgba(255, 255, 255, 0.2)" />
          <Panel
            position="bottom-right"
            style={{ marginBottom: isMobile ? '20px' : '160px', marginRight: isMobile ? '10px' : '320px' }}
            className="flex flex-col gap-2 z-50"
          >
            <button
              onClick={() => fitView({ duration: 800 })}
              style={{ width: isMobile ? '35px' : '40px', height: isMobile ? '35px' : '40px' }}
              className="bg-[#1e1e1e] border border-gray-600 rounded-lg shadow-lg flex items-center justify-center text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <Maximize size={isMobile ? 16 : 20} />
            </button>
            <div className="flex flex-col bg-[#1e1e1e] border border-gray-600 rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={() => zoomIn({ duration: 300 })}
                style={{ width: isMobile ? '35px' : '40px', height: isMobile ? '35px' : '40px' }}
                className="flex items-center justify-center text-gray-300 hover:bg-gray-700 border-b border-gray-600"
              >
                <ZoomIn size={isMobile ? 16 : 20} />
              </button>
              <button
                onClick={() => zoomOut({ duration: 300 })}
                style={{ width: isMobile ? '35px' : '40px', height: isMobile ? '35px' : '40px' }}
                className="flex items-center justify-center text-gray-300 hover:bg-gray-700"
              >
                <ZoomOut size={isMobile ? 16 : 20} />
              </button>
            </div>
          </Panel>
          {!isMobile && (
            <MiniMap
              style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
              nodeColor="#444" maskColor="rgba(0, 0, 0, 0.7)"
            />
          )}
          {!isMobile && (
            <Panel position="top-left" style={{ margin: '20px' }}>
              <TacticalIO />
            </Panel>
          )}
        </ReactFlow>
      )}

      <NodeEditorModal 
        isOpen={isEditorOpen} initialData={selectedNode?.data} 
        onSave={handleSaveNode} onClose={() => setIsEditorOpen(false)} 
      />

      <VaultActionModal 
        isOpen={modal.isOpen} mode={modal.type === 'confirm' ? 'delete' : 'update'}
        initialValue={modal.initialValue} onConfirm={onModalConfirm}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}