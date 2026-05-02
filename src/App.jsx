import React, { useCallback, useRef, useState } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  Panel,
  useReactFlow,
  ReactFlowProvider,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useStore from './store/useStore';
import { Plus, Target, MousePointer2, Smartphone, Square, Diamond, Database, Circle, Users, Download, Upload, Trash2, X, Library, FilePlus, Edit3 } from 'lucide-react';
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
    addNode, updateNodeShape, createGroup, loadFromData, 
    clearAll, deleteSelection, autoLayout,
    projectList, currentProjectId, currentProjectName,
    createNewProject, loadProject, deleteProject, renameProject
  } = useStore();
  
  const { screenToFlowPosition, setCenter, getNodes, getEdges } = useReactFlow();
  const reactFlowWrapper = useRef(null);
  const fileInputRef = useRef(null);
  
  const [helperLines, setHelperLines] = useState({ x: null, y: null });
  const [showLibrary, setShowLibrary] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState(currentProjectName);

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

  // 정밀 제거 (선택된 항목 삭제)
  const handleDelete = () => {
    const selectedNodes = getNodes().filter(n => n.selected);
    const selectedEdges = getEdges().filter(e => e.selected);
    
    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      deleteSelection(selectedNodes, selectedEdges);
    } else {
      alert('삭제할 항목(노드 또는 선)을 먼저 선택해 주세요!');
    }
  };

  // 키보드로 삭제 시 동기화
  const onNodesDelete = useCallback((deletedNodes) => {
    deleteSelection(deletedNodes, []);
  }, [deleteSelection]);

  const onEdgesDelete = useCallback((deletedEdges) => {
    deleteSelection([], deletedEdges);
  }, [deleteSelection]);

  // 데이터 내보내기 (JSON 파일 다운로드)
  const handleExport = () => {
    const data = { nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Aura-Map-Tactical-Export-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 데이터 가져오기 (JSON 파일 읽기)
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          loadFromData(data);
          alert('작전 지도를 성공적으로 복구했습니다!');
        } catch (err) {
          alert('잘못된 파일 형식입니다.');
        }
      };
      reader.readAsText(file);
    }
  };

  // 부대 편성 명령 하달
  const handleCreateGroup = () => {
    const selectedNodes = getNodes().filter(n => n.selected && n.type !== 'auraGroup');
    if (selectedNodes.length > 0) {
      createGroup(selectedNodes);
    } else {
      alert('편성할 노드들을 먼저 선택해 주세요! (Shift + 드래그)');
    }
  };


  const handleCreateNew = () => {
    const name = prompt('새 작전 계획의 이름을 입력하세요:', '신규 작전-' + new Date().toLocaleDateString());
    if (name) createNewProject(name);
  };

  const handleRename = () => {
    renameProject(currentProjectId, tempName);
    setIsRenaming(false);
  };

  // 패널 클릭 시 처리 (더블 클릭 감지 포함)
  const onPaneClick = useCallback((e) => {
    if (e.detail === 2) { // 더블 클릭 감지
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

  const handleAddNodeAtCenter = () => {
    // 캔버스 중앙(화면 중심)에 노드 투하
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const position = screenToFlowPosition({ x: centerX, y: centerY });
    addNode(position, '중앙 거점', 'process');
  };

  const focusCenter = () => {
    setCenter(250, 250, { zoom: 1, duration: 800 });
  };

  return (
    <div ref={reactFlowWrapper} style={{ width: '100vw', height: '100vh', background: '#030712', position: 'relative' }}>
      
      {/* 상단 작전명 바 */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1.5px solid rgba(0, 229, 255, 0.4)',
        borderRadius: '16px',
        padding: '8px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        boxShadow: '0 0 20px rgba(0, 229, 255, 0.2)'
      }}>
        {isRenaming ? (
          <input 
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            autoFocus
            style={{
              background: 'transparent',
              border: 'none',
              color: '#00e5ff',
              fontSize: '18px',
              fontWeight: '900',
              outline: 'none',
              textAlign: 'center',
              width: '200px'
            }}
          />
        ) : (
          <h2 
            onClick={() => { setTempName(currentProjectName); setIsRenaming(true); }}
            style={{ 
              color: '#00e5ff', 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: '900', 
              letterSpacing: '1px',
              cursor: 'text'
            }}
          >
            {currentProjectName}
          </h2>
        )}
        <div style={{ width: '1.5px', height: '20px', background: 'rgba(255,255,255,0.1)' }}></div>
        <button 
          onClick={() => setShowLibrary(!showLibrary)}
          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
          title="작전 도서관 열기"
        >
          <Library size={20} />
        </button>
      </div>

      {/* 작전 도서관 사이드바 (Library) */}
      {showLibrary && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '320px',
          height: '100%',
          zIndex: 200,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.1)',
          padding: '30px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '10px 0 30px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Library size={22} color="#00e5ff" /> 전술 아카이브
            </h3>
            <button onClick={() => setShowLibrary(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={22} />
            </button>
          </div>

          <button 
            onClick={handleCreateNew}
            style={{
              width: '100%',
              padding: '12px',
              background: '#00e5ff',
              color: '#030712',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            <FilePlus size={18} /> 새 작전 수립
          </button>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            {projectList.map(proj => (
              <div 
                key={proj.id}
                onClick={() => loadProject(proj.id)}
                style={{
                  padding: '15px',
                  background: proj.id === currentProjectId ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${proj.id === currentProjectId ? '#00e5ff' : 'transparent'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  position: 'relative',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ color: proj.id === currentProjectId ? '#00e5ff' : '#e2e8f0', fontWeight: '700', fontSize: '14px' }}>
                    {proj.name}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); if(confirm('이 작전 계획을 영구 삭제하시겠습니까?')) deleteProject(proj.id); }}
                    style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '0' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <span style={{ color: '#64748b', fontSize: '10px' }}>
                  최종 수정: {new Date(proj.lastModified).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
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

        {/* 중앙 하단 전술 컨트롤 바 (미니멀 최적화) */}
        <Panel position="bottom-center" style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <div className="glass-panel" style={{ display: 'flex', gap: '8px', padding: '8px' }}>
            <button 
              onClick={handleAddNodeAtCenter}
              style={{ padding: '12px 20px', background: '#00e5ff', color: '#030712', border: 'none', borderRadius: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <Plus size={20} /> <span>노드 추가</span>
            </button>
            <button 
              onClick={handleCreateGroup}
              style={{ 
                padding: '12px 20px', 
                background: 'rgba(168, 85, 247, 0.2)', 
                color: '#a855f7', 
                border: '1.5px solid #a855f7', 
                borderRadius: '12px', 
                fontWeight: '800', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                cursor: 'pointer' 
              }}
            >
              <Users size={20} /> <span>부대 편성</span>
            </button>
            <button 
              onClick={() => autoLayout('TB')}
              style={{ 
                padding: '12px 20px', 
                background: 'rgba(0, 229, 255, 0.15)', 
                color: '#00e5ff', 
                border: '1.5px solid #00e5ff', 
                borderRadius: '12px', 
                fontWeight: '800', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                cursor: 'pointer' 
              }}
              title="지능형 자동 정렬"
            >
              <MousePointer2 size={20} style={{ transform: 'rotate(45deg)' }} /> <span>자동 정렬</span>
            </button>
            <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }}></div>
            <button 
              onClick={focusCenter}
              style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer' }}
              title="원점으로 이동"
            >
              <Target size={20} />
            </button>
            
            <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }}></div>

            {/* 데이터 관리 도구 */}
            <button 
              onClick={handleExport}
              style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', cursor: 'pointer' }}
              title="파일로 저장"
            >
              <Download size={20} />
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', cursor: 'pointer' }}
              title="파일 불러오기"
            >
              <Upload size={20} />
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} accept=".json" />
            </button>
            <button 
              onClick={handleDelete}
              style={{ padding: '12px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1.5px solid #f43f5e', borderRadius: '12px', cursor: 'pointer' }}
              title="선택 항목 삭제"
            >
              <X size={20} />
            </button>
            <button 
              onClick={clearAll}
              style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.05)', color: '#64748b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', cursor: 'pointer' }}
              title="전체 초기화"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </Panel>
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
