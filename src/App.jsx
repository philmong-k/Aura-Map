import React, { useCallback, useRef, useState } from 'react';
import { 
  ReactFlow, 
  Background, 
  MiniMap, 
  useReactFlow,
  ReactFlowProvider,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useStore from './store/useStore';

// 새로 분리된 UI 컴포넌트들
import TopNavigationBar from './components/ui/TopNavigationBar';
import TacticalControlBar from './components/ui/TacticalControlBar';
import ProjectLibrarySidebar from './components/ui/ProjectLibrarySidebar';

// 캔버스 노드 컴포넌트
import TacticalNode from './components/TacticalNode';
import AuraGroup from './components/AuraGroup';
import TacticalEdge from './components/TacticalEdge';

const nodeTypes = {
  tactical: TacticalNode,
  auraGroup: AuraGroup,
};

const edgeTypes = {
  tactical: TacticalEdge,
};

const defaultEdgeOptions = {
  type: 'tactical',
  animated: true,
  style: { stroke: '#00e5ff', strokeWidth: 2 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#00e5ff',
  },
};

const FlowCanvas = () => {
  const { 
    nodes, edges, onNodesChange, onEdgesChange, onConnect, 
    addNode, deleteSelection
  } = useStore();
  
  const { screenToFlowPosition, getNodes, getEdges } = useReactFlow();
  const reactFlowWrapper = useRef(null);
  
  const [helperLines, setHelperLines] = useState({ x: null, y: null });
  const [showLibrary, setShowLibrary] = useState(false);
  const [isToolboxOpen, setIsToolboxOpen] = useState(true);

  // 스마트 스냅 라인 계산 (정밀 정렬 보조)
  const onNodeDrag = useCallback((_, node) => {
    const allNodes = getNodes();
    const threshold = 10;
    const lines = { x: null, y: null };

    allNodes.forEach((otherNode) => {
      if (otherNode.id === node.id || otherNode.type === 'auraGroup') return;

      // 수평 정렬 체크
      if (Math.abs(otherNode.position.x - node.position.x) < threshold) {
        lines.x = otherNode.position.x;
      }
      // 수직 정렬 체크
      if (Math.abs(otherNode.position.y - node.position.y) < threshold) {
        lines.y = otherNode.position.y;
      }
    });

    setHelperLines(lines);
  }, [getNodes]);

  const onNodeDragStop = () => setHelperLines({ x: null, y: null });

  // 키보드로 삭제 시 동기화
  const onNodesDelete = useCallback((deletedNodes) => {
    deleteSelection(deletedNodes, []);
  }, [deleteSelection]);

  const onEdgesDelete = useCallback((deletedEdges) => {
    deleteSelection([], deletedEdges);
  }, [deleteSelection]);

  // 패널 더블클릭 노드 추가
  const onPaneClick = useCallback((e) => {
    if (e.detail === 2) { 
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addNode(position, '새 전술 거점', 'process');
    }
  }, [screenToFlowPosition, addNode]);

  // 우클릭 시에도 노드 추가 지원
  const onPaneContextMenu = useCallback((e) => {
    e.preventDefault();
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    addNode(position, '전술 명령', 'process');
  }, [screenToFlowPosition, addNode]);

  return (
    <div ref={reactFlowWrapper} style={{ width: '100vw', height: '100vh', background: '#030712', position: 'relative' }}>
      
      {/* 1. 상단 네비게이션 바 */}
      <TopNavigationBar 
        showLibrary={showLibrary} 
        setShowLibrary={setShowLibrary}
        isToolboxOpen={isToolboxOpen}
        setIsToolboxOpen={setIsToolboxOpen}
      />

      {/* 2. 전술 아카이브 (도서관) */}
      <ProjectLibrarySidebar showLibrary={showLibrary} setShowLibrary={setShowLibrary} />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneContextMenu={onPaneContextMenu}
        onPaneClick={onPaneClick}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        colorMode="dark"
      >
        <Background color="#1e293b" gap={20} size={1} />
        
        {/* 스마트 스냅 라인 (SVG Overlay) */}
        <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
          {helperLines.x !== null && (
            <line x1={helperLines.x} y1="0" x2={helperLines.x} y2="100%" stroke="#00e5ff" strokeWidth="1" strokeDasharray="5,5" opacity="0.5" />
          )}
          {helperLines.y !== null && (
            <line x1="0" y1={helperLines.y} x2="100%" y2={helperLines.y} stroke="#00e5ff" strokeWidth="1" strokeDasharray="5,5" opacity="0.5" />
          )}
        </svg>
        
        <MiniMap 
          style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
          nodeColor={(n) => n.style?.color || '#94a3b8'}
          maskColor="rgba(0,0,0,0.4)"
        />

        {/* 3. 하단 전술 통제 패널 */}
        <TacticalControlBar isToolboxOpen={isToolboxOpen} />
      </ReactFlow>
    </div>
  );
};

const App = () => (
  <ReactFlowProvider>
    <FlowCanvas />
  </ReactFlowProvider>
);

export default App;
