import React, { useCallback, useRef, useState, useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  MiniMap, 
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  SelectionMode
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Lock } from 'lucide-react';

// 스토어 및 커스텀 훅
import useStore from './store/useStore';
import { useHelperLines } from './hooks/useHelperLines';
import { useHotkeys } from './hooks/useHotkeys';

// UI 컴포넌트
import TopNavigationBar from './components/ui/TopNavigationBar';
import TacticalControlBar from './components/ui/TacticalControlBar';
import ProjectLibrarySidebar from './components/ui/ProjectLibrarySidebar';
import NodeDetailModal from './components/ui/NodeDetailModal';
import TacticalLegend from './components/ui/TacticalLegend';

// 캔버스 노드 컴포넌트
import TacticalNode from './components/TacticalNode';
import AuraGroup from './components/AuraGroup';
import SummaryNode from './components/SummaryNode';
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
  // 스토어 상태 및 액션
  const {
    nodes, edges, onNodesChange, onEdgesChange, onConnect,
    addNode, deleteSelection, loadFromBackend, undo, redo,
    currentProjectId, projectList, createNewProject,
    multiSelectMode, isLegendOpen, setIsLegendOpen,
    toggleTacticalSelection, setTacticalSelection
  } = useStore();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [showLibrary, setShowLibrary] = useState(false);
  const [isToolboxOpen, setIsToolboxOpen] = useState(true);
  const [detailModal, setDetailModal] = useState({ isOpen: false, nodeId: null });

  const { screenToFlowPosition, getNodes } = useReactFlow();
  const reactFlowWrapper = useRef(null);

  // 반응형 처리
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    loadFromBackend();
  }, [loadFromBackend]);

  // 커스텀 훅 적용 (헬퍼 라인 및 단축키)
  const { helperLines, onNodeDrag, onNodeDragStop } = useHelperLines(getNodes);
  useHotkeys(undo, redo);

  const openDetail = useCallback((id) => {
    setDetailModal({ isOpen: true, nodeId: id });
  }, []);

  const onNodesDelete = useCallback((deletedNodes) => {
    deleteSelection(deletedNodes, []);
  }, [deleteSelection]);

  const onEdgesDelete = useCallback((deletedEdges) => {
    deleteSelection([], deletedEdges);
  }, [deleteSelection]);

  const onPaneClick = useCallback((e) => {
    if (e.detail === 2) { 
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addNode(position, '새 전술 거점', 'process');
    }
  }, [screenToFlowPosition, addNode]);

  const onPaneContextMenu = useCallback((e) => {
    e.preventDefault();
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    addNode(position, '전술 명령', 'process');
  }, [screenToFlowPosition, addNode]);

  const currentProject = projectList.find(p => p.id === currentProjectId);
  const isLocked = currentProject?.isLocked;

  // 📊 프로젝트 전체 총액 계산 (Canvas Global Total)
  const projectTotal = React.useMemo(() => {
    return nodes.reduce((acc, node) => {
      if (node.type !== 'tactical' || node.data?.mode === 'note') return acc;
      
      const sheet = node.data?.sheet;
      if (!sheet || !sheet.rows || !sheet.columns) return acc;
      
      const columns = sheet.columns;
      const rows = sheet.rows;

      const targetColumn = columns.find(c => 
        c.name.includes('소계') || 
        c.name.includes('합계') || 
        c.name.toLowerCase().includes('total') || 
        c.name.toLowerCase().includes('amount') ||
        c.name.toLowerCase().includes('subtotal')
      ) || columns.filter(c => c.type === 'number' || c.type === 'formula').slice(-1)[0];

      if (!targetColumn) return acc;

      const nodeSum = rows.reduce((rAcc, row) => {
        let val = 0;
        if (targetColumn.type === 'number') {
          val = parseFloat(row[targetColumn.id]) || 0;
        } else if (targetColumn.type === 'formula') {
          // 간이 수식 계산 (AuraGroup과 동일 로직)
          try {
            let expr = targetColumn.formula;
            columns.forEach(c => {
              const v = parseFloat(row[c.id]) || 0;
              const r = new RegExp(`\\b${c.id}\\b`, 'g');
              expr = expr.replace(r, v);
            });
            val = Function(`"use strict"; return (${expr})`)() || 0;
          } catch { val = 0; }
        }
        return rAcc + val;
      }, 0);
      
      return acc + nodeSum;
    }, 0);
  }, [nodes]);

  const onNodeClick = useCallback((event, node) => {
    if (multiSelectMode) {
      toggleTacticalSelection(node.id);
    }
  }, [multiSelectMode, toggleTacticalSelection]);

  const onSelectionChange = useCallback(({ nodes: selectedNodes }) => {
    if (multiSelectMode && selectedNodes.length > 0) {
      const selectedIds = selectedNodes.map(n => n.id);
      const currentSelection = useStore.getState().tacticalSelection;
      const newSelection = Array.from(new Set([...currentSelection, ...selectedIds]));
      setTacticalSelection(newSelection);
    }
  }, [multiSelectMode, setTacticalSelection]);

  return (
    <div ref={reactFlowWrapper} style={{ width: '100vw', height: '100vh', background: '#030712', position: 'relative', overflow: 'hidden', touchAction: 'none' }}>
      
      <TopNavigationBar 
        showLibrary={showLibrary} 
        setShowLibrary={setShowLibrary}
        isToolboxOpen={isToolboxOpen}
        setIsToolboxOpen={setIsToolboxOpen}
        isLegendOpen={isLegendOpen}
        setIsLegendOpen={setIsLegendOpen}
        projectTotal={projectTotal}
      />

      <ProjectLibrarySidebar showLibrary={showLibrary} setShowLibrary={setShowLibrary} />

      {currentProjectId ? (
        <>
          {isLocked && (
            <div style={{
              position: 'absolute', top: '70px', left: '50%', transform: 'translateX(-50%)',
              zIndex: 100, background: 'rgba(251, 191, 36, 0.2)', border: '1px solid #fbbf24',
              color: '#fbbf24', padding: '6px 16px', borderRadius: '20px', fontSize: '12px',
              fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px',
              backdropFilter: 'blur(10px)', pointerEvents: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
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
            onSelectionChange={onSelectionChange}
            onNodeDoubleClick={(e, node) => setDetailModal({ isOpen: true, nodeId: node.id })}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            nodesDraggable={!isLocked}
            nodesConnectable={!isLocked}
            elementsSelectable={true}
            nodesSelectable={!multiSelectMode}
            selectNodesOnDrag={true}
            panOnDrag={!multiSelectMode}
            selectionOnDrag={multiSelectMode}
            selectionMode={SelectionMode.Partial}
            unselectNodesOnContextMenu={false} 
            unselectNodesOnDrag={false} 
            snapToGrid
            snapGrid={[15, 15]}
            connectionMode="loose"
            colorMode="dark"
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
                if (selectedNode) openDetail(selectedNode.id);
              }}
            />

            <NodeDetailModal 
              isOpen={detailModal.isOpen}
              nodeId={detailModal.nodeId}
              onClose={() => setDetailModal({ isOpen: false, nodeId: null })}
            />
          </ReactFlow>
        </>
      ) : (
        <div style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #0f172a 0%, #030712 100%)',
          color: '#fff', textAlign: 'center', padding: '20px', zIndex: 5
        }}>
          <div style={{
            padding: '50px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(30px)',
            borderRadius: '40px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex',
            flexDirection: 'column', alignItems: 'center', gap: '25px', boxShadow: '0 25px 60px rgba(0,0,0,0.6)', maxWidth: '500px'
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
                marginTop: '15px', padding: '18px 50px', background: 'linear-gradient(135deg, #00e5ff 0%, #00b4d8 100%)',
                color: '#030712', border: 'none', borderRadius: '20px', fontWeight: '900', fontSize: '1.2rem',
                cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 10px 30px rgba(0,229,255,0.3)',
                textTransform: 'uppercase', letterSpacing: '1px'
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

      <TacticalLegend isOpen={isLegendOpen} onClose={() => setIsLegendOpen(false)} />
    </div>
  );
};

const App = () => (
  <ReactFlowProvider>
    <FlowCanvas />
  </ReactFlowProvider>
);

export default App;
