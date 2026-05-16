import React, { useCallback, useRef, useState, useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  MiniMap, 
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  SelectionMode
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Lock } from 'lucide-react';
import useStore from './store/useStore';

// 새로 분리된 UI 컴포넌트들
import TopNavigationBar from './components/ui/TopNavigationBar';
import TacticalControlBar from './components/ui/TacticalControlBar';
import ProjectLibrarySidebar from './components/ui/ProjectLibrarySidebar';
import NodeDetailModal from './components/ui/NodeDetailModal';
import TacticalLegend from './components/ui/TacticalLegend';
import LoginOverlay from './components/ui/LoginOverlay';

// 캔버스 노드 컴포넌트
import TacticalNode from './components/TacticalNode';
import AuraGroup from './components/AuraGroup';
import SummaryNode from './components/nodes/SummaryNode';
import TacticalEdge from './components/TacticalEdge';

const nodeTypes = {
  tactical: TacticalNode,
  auraGroup: AuraGroup,
  summary: SummaryNode,
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
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('aura_token'));
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const onNodesChange = useStore((state) => state.onNodesChange);
  const onEdgesChange = useStore((state) => state.onEdgesChange);
  const onConnect = useStore((state) => state.onConnect);
  const addNode = useStore((state) => state.addNode);
  const deleteSelection = useStore((state) => state.deleteSelection);
  const loadFromBackend = useStore((state) => state.loadFromBackend);
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);
  const currentProjectId = useStore((state) => state.currentProjectId);
  const projectList = useStore((state) => state.projectList);
  const createNewProject = useStore((state) => state.createNewProject);
  const multiSelectMode = useStore((state) => state.multiSelectMode);
  const setMultiSelectMode = useStore((state) => state.setMultiSelectMode);
  const copySelection = useStore((state) => state.copySelection);
  const pasteSelection = useStore((state) => state.pasteSelection);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

    // 🛡️ [v4.7.2-STABLE] 실시간 전술 동기화 엔진 (Auto-Sync Engine)
    useEffect(() => {
      if (!isAuthenticated) return;
  
      // 1. 주기적 폴링 (30초 간격으로 단축 - 반응성 강화)
      const syncInterval = setInterval(() => {
        console.log('🔄 [Auto-Sync] 정기 데이터 대조 중 (30s)...');
        loadFromBackend({ force: false });
      }, 30000);
  
      // 2. 윈도우 포커스 감지 (기기 간 전환 시 즉시 동기화)
      const handleFocus = () => {
        console.log('✨ [Auto-Sync] 윈도우 포커스 감지: 서버 데이터 즉시 대조');
        loadFromBackend({ force: true }); // 포커스 시에는 강제 동기화 수행
      };
      window.addEventListener('focus', handleFocus);
  
      return () => {
        clearInterval(syncInterval);
        window.removeEventListener('focus', handleFocus);
      };
  }, [loadFromBackend, isAuthenticated]);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadFromBackend();
    }
  }, [loadFromBackend, isAuthenticated]);

  // 키보드 단축키 처리 (Undo/Redo)
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          undo();
        } else if (e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);
  
  const { screenToFlowPosition, getNodes } = useReactFlow();
  const reactFlowWrapper = useRef(null);
  
  const [helperLines, setHelperLines] = useState({ x: null, y: null });
  const [showLibrary, setShowLibrary] = useState(false);
  const [isToolboxOpen, setIsToolboxOpen] = useState(true);

  const setSelectedNodeId = useStore((state) => state.setSelectedNodeId);

  const onNodeDrag = useCallback((_, node) => {
    const allNodes = getNodes();
    const threshold = 10;
    const lines = { x: null, y: null };
    allNodes.forEach((otherNode) => {
      if (otherNode.id === node.id || otherNode.type === 'auraGroup') return;
      if (Math.abs(otherNode.position.x - node.position.x) < threshold) lines.x = otherNode.position.x;
      if (Math.abs(otherNode.position.y - node.position.y) < threshold) lines.y = otherNode.position.y;
    });
    setHelperLines(lines);
  }, [getNodes]);

  const onNodeDragStop = () => setHelperLines({ x: null, y: null });

  const onNodesDelete = useCallback((deletedNodes) => {
    deleteSelection(deletedNodes, []);
  }, [deleteSelection]);

  const onEdgesDelete = useCallback((deletedEdges) => {
    deleteSelection([], deletedEdges);
  }, [deleteSelection]);


  const toggleNodeSelection = useStore((state) => state.toggleNodeSelection);

  const toggleTacticalSelection = useStore((state) => state.toggleTacticalSelection);

  const onNodeClick = useCallback((e, node) => {
    if (multiSelectMode) {
      toggleTacticalSelection(node.id);
    }
  }, [multiSelectMode, toggleTacticalSelection]);

  const onPaneClick = useCallback((e) => {
    if (multiSelectMode) {
      e.preventDefault();
      return;
    }
    if (e.detail === 2) { 
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addNode(position, '새 전술 거점', 'process');
    }
  }, [screenToFlowPosition, addNode, multiSelectMode]);

  const onPaneContextMenu = useCallback((e) => {
    e.preventDefault();
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    addNode(position, '전술 명령', 'process');
  }, [screenToFlowPosition, addNode]);

  const currentProject = projectList.find(p => p.id === currentProjectId);
  const isLocked = currentProject?.isLocked;

  // 🛡️ 인증되지 않은 경우 로그인 오버레이 표시
  if (!isAuthenticated) {
    return <LoginOverlay onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div ref={reactFlowWrapper} style={{ width: '100vw', height: '100vh', background: '#030712', position: 'relative', overflow: 'hidden' }}>
      
      {/* 1. 상단 네비게이션 바 */}
      <TopNavigationBar 
        showLibrary={showLibrary} 
        setShowLibrary={setShowLibrary}
        isToolboxOpen={isToolboxOpen}
        setIsToolboxOpen={setIsToolboxOpen}
      />

      {/* 2. 전술 아카이브 (도서관) */}
      <ProjectLibrarySidebar showLibrary={showLibrary} setShowLibrary={setShowLibrary} />

      {currentProjectId ? (
        <>
          {isLocked && (
            <div style={{
              position: 'absolute',
              top: '70px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 100,
              background: 'rgba(251, 191, 36, 0.2)',
              border: '1px solid #fbbf24',
              color: '#fbbf24',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backdropFilter: 'blur(10px)',
              pointerEvents: 'none',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
            }}>
              <Lock size={14} /> 편집 잠금 모드 가동 중
            </div>
          )}
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
            onNodeClick={onNodeClick}
            onNodeDoubleClick={(e, node) => {
              setSelectedNodeId(node.id);
            }}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            nodesDraggable={!isLocked}
            nodesConnectable={!isLocked}
            elementsSelectable={true}
            nodesSelectable={true}
            selectNodesOnDrag={multiSelectMode}
            unselectNodesOnDrag={!multiSelectMode}
            panOnDrag={!multiSelectMode}
            selectionOnDrag={multiSelectMode}
            selectionMode={SelectionMode.Partial}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            connectionMode="loose"
            colorMode="dark"
            zoomOnDoubleClick={false}
          >
            <Background variant="dots" gap={25} size={1.5} color="rgba(255, 255, 255, 0.2)" />
            
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

            <TacticalControlBar 
              isToolboxOpen={isToolboxOpen} 
              onOpenDetail={() => {
                const selectedNode = getNodes().find(n => n.selected);
                if (selectedNode) setSelectedNodeId(selectedNode.id);
              }}
            />

            <NodeDetailModal />
          </ReactFlow>
        </>
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at center, #0f172a 0%, #030712 100%)',
          color: '#fff',
          textAlign: 'center',
          padding: '20px',
          zIndex: 5
        }}>
          <div style={{
            padding: '50px',
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(30px)',
            borderRadius: '40px',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '25px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
            maxWidth: '500px'
          }}>
            <h1 style={{ fontSize: '3rem', margin: 0, filter: 'drop-shadow(0 0 20px #00e5ff)', color: '#00e5ff', fontFamily: 'Outfit, sans-serif' }}>Agent Canvas</h1>
            <div style={{ marginTop: '10px' }}>
              <p style={{ fontSize: '1.4rem', fontWeight: '700', color: '#e2e8f0', margin: '0 0 10px 0' }}>
                지휘관님, 다시 캔버스로 오신 것을 환영합니다.
              </p>
              <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>
                현재 활성화된 프로젝트가 없습니다.<br/>
                새로운 아이디어를 캔버스에 펼치거나 저장소에서 불러오세요! 🚀
              </p>
            </div>
            <button 
              onClick={() => {
                const now = new Date();
                const dateStr = now.toLocaleDateString();
                const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                createNewProject(`신규 프로젝트-${dateStr} (${timeStr})`);
              }}
              style={{
                marginTop: '15px',
                padding: '18px 50px',
                background: 'linear-gradient(135deg, #00e5ff 0%, #00b4d8 100%)',
                color: '#030712',
                border: 'none',
                borderRadius: '20px',
                fontWeight: '900',
                fontSize: '1.2rem',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 10px 30px rgba(0,229,255,0.3)',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              새 프로젝트 시작하기
            </button>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '5px' }}>
              TIP: 좌측 상단 도서관 아이콘을 클릭하여 작전 목록을 확인하세요.
            </p>
          </div>
        </div>
      )}

      {/* 5. 전술 기호 가이드 (범례) */}
      <TacticalLegend />
    </div>
  );
};

const App = () => (
  <ReactFlowProvider>
    <FlowCanvas />
  </ReactFlowProvider>
);

export default App;
