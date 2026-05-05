import React, { useRef } from 'react';
import { Plus, Target, MousePointer2, Users, Download, Upload, Trash2, X, Undo2, Redo2, Copy, Clipboard, MousePointerSquareDashed } from 'lucide-react';
import { Panel, useReactFlow } from '@xyflow/react';
import useStore from '../../store/useStore';
import './UIControls.css';

const TacticalControlBar = ({ isToolboxOpen, onOpenDetail }) => {
  const addNode = useStore((state) => state.addNode);
  const createGroup = useStore((state) => state.createGroup);
  const autoLayout = useStore((state) => state.autoLayout);
  const deleteSelection = useStore((state) => state.deleteSelection);
  const clearAll = useStore((state) => state.clearAll);
  const loadFromData = useStore((state) => state.loadFromData);
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);
  const past = useStore((state) => state.past);
  const future = useStore((state) => state.future);
  const currentProjectId = useStore((state) => state.currentProjectId);
  const projectList = useStore((state) => state.projectList);
  const multiSelectMode = useStore((state) => state.multiSelectMode);
  const setMultiSelectMode = useStore((state) => state.setMultiSelectMode);
  const copySelection = useStore((state) => state.copySelection);
  const pasteSelection = useStore((state) => state.pasteSelection);
  const copiedNodes = useStore((state) => state.copiedNodes);
  
  const isLocked = projectList.find(p => p.id === currentProjectId)?.isLocked;
  
  const { screenToFlowPosition, setCenter, getNodes } = useReactFlow();
  const fileInputRef = useRef(null);

  const selectedNodeCount = nodes.filter(n => n.selected).length;
  
  const handleAddNodeAtCenter = () => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const position = screenToFlowPosition({ x: centerX, y: centerY });
    addNode(position, '새 전술 거점', 'process');
  };

  const handleCreateGroup = () => {
    const selectedNodes = getNodes().filter(n => n.selected && n.type !== 'auraGroup');
    if (selectedNodes.length > 0) {
      createGroup(selectedNodes);
    } else {
      alert('편성할 노드들을 먼저 선택해 주세요! (Shift + 드래그)');
    }
  };

  const handleDelete = () => {
    const selectedNodes = nodes.filter(n => n.selected);
    const selectedEdges = edges.filter(e => e.selected);
    
    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      deleteSelection(selectedNodes, selectedEdges);
    } else {
      alert('삭제할 항목(노드 또는 선)을 먼저 선택해 주세요!');
    }
  };

  const handleExport = () => {
    let exportNodes = nodes;
    let exportEdges = edges;

    const selectedNodes = nodes.filter(n => n.selected);
    
    if (selectedNodes.length > 0) {
      const selectedIds = new Set(selectedNodes.map(n => n.id));
      
      let added;
      do {
        added = false;
        for (const n of nodes) {
          if (!selectedIds.has(n.id) && n.parentId && selectedIds.has(n.parentId)) {
            selectedIds.add(n.id);
            added = true;
          }
        }
      } while (added);

      exportNodes = nodes.filter(n => selectedIds.has(n.id));
      exportEdges = edges.filter(e => selectedIds.has(e.source) && selectedIds.has(e.target));
    }

    const data = { nodes: exportNodes, edges: exportEdges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Aura-Map-Tactical-Export-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

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

  const focusCenter = () => {
    setCenter(250, 250, { zoom: 1, duration: 800 });
  };

  return (
    <Panel position="bottom-center" className="tactical-control-panel">
      <div className={`tactical-control-bar-wrapper ${isToolboxOpen ? '' : 'closed'}`}>
        <div className="tactical-control-bar">
          
        <button 
          onClick={handleAddNodeAtCenter}
          disabled={isLocked}
          className="control-btn"
          style={{ 
            background: isLocked ? 'rgba(255,255,255,0.05)' : '#00e5ff', 
            color: isLocked ? '#64748b' : '#030712',
            opacity: isLocked ? 0.5 : 1,
            cursor: isLocked ? 'not-allowed' : 'pointer'
          }}
          title={isLocked ? "잠금 모드에서는 추가할 수 없습니다" : "노드 추가"}
        >
          <Plus size={20} /> <span className="btn-text">노드 추가</span>
        </button>

        <div className="divider"></div>

        {/* 편집 편의 도구 */}
        <button 
          onClick={() => setMultiSelectMode(!multiSelectMode)}
          className="control-btn-icon"
          style={{ 
            background: multiSelectMode ? '#00e5ff' : 'rgba(255, 255, 255, 0.05)', 
            color: multiSelectMode ? '#030712' : '#94a3b8', 
            border: `1px solid ${multiSelectMode ? '#00e5ff' : 'rgba(255, 255, 255, 0.1)'}`,
            boxShadow: multiSelectMode ? '0 0 15px rgba(0, 229, 255, 0.4)' : 'none'
          }}
          title={multiSelectMode ? "다중 선택 모드 꺼짐" : "다중 선택 모드 켜기 (모바일용)"}
        >
          <MousePointerSquareDashed size={20} />
        </button>

        <button 
          onClick={copySelection}
          disabled={selectedNodeCount === 0}
          className="control-btn-icon"
          style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            color: selectedNodeCount > 0 ? '#fff' : '#4b5563', 
            border: '1px solid rgba(255, 255, 255, 0.1)',
            opacity: selectedNodeCount > 0 ? 1 : 0.5
          }}
          title="복사하기"
        >
          <Copy size={18} />
        </button>

        <button 
          onClick={() => pasteSelection()}
          disabled={copiedNodes.length === 0 || isLocked}
          className="control-btn-icon"
          style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            color: (copiedNodes.length > 0 && !isLocked) ? '#fff' : '#4b5563', 
            border: '1px solid rgba(255, 255, 255, 0.1)',
            opacity: (copiedNodes.length > 0 && !isLocked) ? 1 : 0.5
          }}
          title="붙여넣기"
        >
          <Clipboard size={18} />
        </button>

        <div className="divider"></div>

        <button 
          onClick={handleCreateGroup}
          disabled={isLocked}
          className="control-btn"
          style={{ 
            background: isLocked ? 'rgba(255,255,255,0.05)' : 'rgba(168, 85, 247, 0.2)', 
            color: isLocked ? '#64748b' : '#a855f7', 
            border: `1.5px solid ${isLocked ? 'rgba(255,255,255,0.1)' : '#a855f7'}`,
            opacity: isLocked ? 0.5 : 1,
            cursor: isLocked ? 'not-allowed' : 'pointer'
          }}
          title={isLocked ? "잠금 모드에서는 편성할 수 없습니다" : "부대 편성"}
        >
          <Users size={20} /> <span className="btn-text">부대 편성</span>
        </button>
        <button 
          onClick={onOpenDetail}
          className="control-btn"
          disabled={selectedNodeCount === 0}
          style={{ 
            background: selectedNodeCount > 0 ? 'rgba(232, 121, 249, 0.2)' : 'rgba(255, 255, 255, 0.05)', 
            color: selectedNodeCount > 0 ? '#e879f9' : '#64748b', 
            border: `1.5px solid ${selectedNodeCount > 0 ? '#e879f9' : 'rgba(255,255,255,0.1)'}`,
            opacity: selectedNodeCount > 0 ? 1 : 0.5,
            cursor: selectedNodeCount > 0 ? 'pointer' : 'not-allowed'
          }}
          title="전술 상세 편집"
        >
          <Plus size={20} style={{ transform: 'rotate(45deg)' }} /> <span className="btn-text">상세 계획</span>
        </button>
        <button 
          onClick={() => autoLayout('TB')}
          disabled={isLocked}
          className="control-btn"
          style={{ 
            background: isLocked ? 'rgba(255,255,255,0.05)' : 'rgba(0, 229, 255, 0.15)', 
            color: isLocked ? '#64748b' : '#00e5ff', 
            border: `1.5px solid ${isLocked ? 'rgba(255,255,255,0.1)' : '#00e5ff'}`,
            opacity: isLocked ? 0.5 : 1,
            cursor: isLocked ? 'not-allowed' : 'pointer'
          }}
          title={isLocked ? "잠금 모드에서는 정렬할 수 없습니다" : "지능형 자동 정렬"}
        >
          <MousePointer2 size={20} style={{ transform: 'rotate(45deg)' }} /> <span className="btn-text">자동 정렬</span>
        </button>
        
        <div className="divider"></div>
        
        {/* 타임라인 도구 (Undo/Redo) */}
        <button 
          onClick={undo}
          disabled={isLocked || past.length === 0}
          className="control-btn-icon"
          style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            color: (past.length > 0 && !isLocked) ? '#fff' : '#4b5563', 
            border: '1px solid rgba(255, 255, 255, 0.1)',
            opacity: (past.length > 0 && !isLocked) ? 1 : 0.5,
            cursor: (past.length > 0 && !isLocked) ? 'pointer' : 'not-allowed'
          }}
          title="작전 취소 (Ctrl+Z)"
        >
          <Undo2 size={18} />
        </button>
        <button 
          onClick={redo}
          disabled={isLocked || future.length === 0}
          className="control-btn-icon"
          style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            color: (future.length > 0 && !isLocked) ? '#fff' : '#4b5563', 
            border: '1px solid rgba(255, 255, 255, 0.1)',
            opacity: (future.length > 0 && !isLocked) ? 1 : 0.5,
            cursor: (future.length > 0 && !isLocked) ? 'pointer' : 'not-allowed'
          }}
          title="작전 재개 (Ctrl+Y)"
        >
          <Redo2 size={18} />
        </button>

        <div className="divider"></div>

        <button 
          onClick={focusCenter}
          className="control-btn-icon"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
          title="원점으로 이동"
        >
          <Target size={20} />
        </button>
        
        <div className="divider"></div>

        {/* 데이터 관리 도구 */}
        <button 
          onClick={handleExport}
          className="control-btn-icon"
          style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}
          title="파일로 저장"
        >
          <Download size={20} />
        </button>
        <button 
          onClick={() => !isLocked && fileInputRef.current?.click()}
          disabled={isLocked}
          className="control-btn-icon"
          style={{ 
            background: isLocked ? 'rgba(255,255,255,0.05)' : 'rgba(59, 130, 246, 0.1)', 
            color: isLocked ? '#64748b' : '#3b82f6', 
            border: `1px solid ${isLocked ? 'rgba(255,255,255,0.1)' : 'rgba(59, 130, 246, 0.2)'}`,
            opacity: isLocked ? 0.5 : 1,
            cursor: isLocked ? 'not-allowed' : 'pointer'
          }}
          title={isLocked ? "잠금 모드에서는 불러올 수 없습니다" : "파일 불러오기"}
        >
          <Upload size={20} />
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} accept=".json" />
        </button>
        
        <button 
          onClick={handleDelete}
          disabled={isLocked}
          className="control-btn-icon"
          style={{ 
            background: isLocked ? 'rgba(255,255,255,0.05)' : 'rgba(244, 63, 94, 0.1)', 
            color: isLocked ? '#64748b' : '#f43f5e', 
            border: `1.5px solid ${isLocked ? 'rgba(255,255,255,0.1)' : '#f43f5e'}`,
            opacity: isLocked ? 0.5 : 1,
            cursor: isLocked ? 'not-allowed' : 'pointer'
          }}
          title={isLocked ? "잠금 모드에서는 삭제할 수 없습니다" : "선택 항목 삭제"}
        >
          <X size={20} />
        </button>
        <button 
          onClick={clearAll}
          disabled={isLocked}
          className="control-btn-icon"
          style={{ 
            background: isLocked ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.05)', 
            color: isLocked ? '#4b5563' : '#64748b', 
            border: '1px solid rgba(255, 255, 255, 0.1)',
            opacity: isLocked ? 0.5 : 1,
            cursor: isLocked ? 'not-allowed' : 'pointer'
          }}
          title={isLocked ? "잠금 모드에서는 초기화할 수 없습니다" : "전체 초기화"}
        >
          <Trash2 size={20} />
        </button>
        
        </div>
      </div>
    </Panel>
  );
};

export default TacticalControlBar;
