import React, { useRef } from 'react';
import { Plus, Target, MousePointer2, Users, Download, Upload, Trash2, X } from 'lucide-react';
import { Panel, useReactFlow } from '@xyflow/react';
import useStore from '../../store/useStore';
import './UIControls.css';

const TacticalControlBar = ({ isToolboxOpen }) => {
  const { getNodes, getEdges, addNode, createGroup, autoLayout, deleteSelection, clearAll, loadFromData, nodes, edges } = useStore();
  const { screenToFlowPosition, setCenter } = useReactFlow();
  const fileInputRef = useRef(null);

  const handleAddNodeAtCenter = () => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const position = screenToFlowPosition({ x: centerX, y: centerY });
    addNode(position, '중앙 거점', 'process');
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
    const selectedNodes = getNodes().filter(n => n.selected);
    const selectedEdges = getEdges().filter(e => e.selected);
    
    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      deleteSelection(selectedNodes, selectedEdges);
    } else {
      alert('삭제할 항목(노드 또는 선)을 먼저 선택해 주세요!');
    }
  };

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
      {/* 애니메이션 래퍼 */}
      <div className={`tactical-control-bar-wrapper ${isToolboxOpen ? '' : 'closed'}`}>
        <div className="tactical-control-bar">
          
          {/* 기본 전술 도구 */}
        <button 
          onClick={handleAddNodeAtCenter}
          className="control-btn"
          style={{ background: '#00e5ff', color: '#030712' }}
          title="노드 추가"
        >
          <Plus size={20} /> <span className="btn-text">노드 추가</span>
        </button>
        <button 
          onClick={handleCreateGroup}
          className="control-btn"
          style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', border: '1.5px solid #a855f7' }}
          title="부대 편성"
        >
          <Users size={20} /> <span className="btn-text">부대 편성</span>
        </button>
        <button 
          onClick={() => autoLayout('TB')}
          className="control-btn"
          style={{ background: 'rgba(0, 229, 255, 0.15)', color: '#00e5ff', border: '1.5px solid #00e5ff' }}
          title="지능형 자동 정렬"
        >
          <MousePointer2 size={20} style={{ transform: 'rotate(45deg)' }} /> <span className="btn-text">자동 정렬</span>
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
          onClick={() => fileInputRef.current?.click()}
          className="control-btn-icon"
          style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}
          title="파일 불러오기"
        >
          <Upload size={20} />
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} accept=".json" />
        </button>
        
        <button 
          onClick={handleDelete}
          className="control-btn-icon"
          style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1.5px solid #f43f5e' }}
          title="선택 항목 삭제"
        >
          <X size={20} />
        </button>
        <button 
          onClick={clearAll}
          className="control-btn-icon"
          style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#64748b', border: '1px solid rgba(255, 255, 255, 0.1)' }}
          title="전체 초기화"
        >
          <Trash2 size={20} />
        </button>
        
        </div>
      </div>
    </Panel>
  );
};

export default TacticalControlBar;
