import React, { useState, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import useStore from '../store/useStore';

const TacticalNode = ({ id, data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(data.label);
  const updateNodeLabel = useStore((state) => state.updateNodeLabel);
  const updateNodeShape = useStore((state) => state.updateNodeShape);

  const shape = data.shape || 'process'; 
  const shapes = ['process', 'decision', 'io', 'subroutine', 'database', 'terminal'];

  // 배지 클릭 시 다음 도형으로 순환
  const handleBadgeClick = (e) => {
    e.stopPropagation(); // 노드 선택 방해 금지
    const currentIndex = shapes.indexOf(shape);
    const nextIndex = (currentIndex + 1) % shapes.length;
    updateNodeShape(id, shapes[nextIndex]);
  };

  const onTitleChange = (evt) => setTitle(evt.target.value);
  const onTitleBlur = () => {
    setIsEditing(false);
    updateNodeLabel(id, title);
  };

  // 배지에 들어갈 도형 SVG 렌더링 함수 (생략 없음)
  const renderShapeBadge = () => {
    const color = '#00e5ff';
    switch (shape) {
      case 'decision': 
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><path d="M12 2l10 10-10 10L2 12z"/></svg>;
      case 'io': 
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><path d="M6 4h16l-4 16H2z"/></svg>;
      case 'database': 
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>;
      case 'terminal': 
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><rect x="2" y="6" width="20" height="12" rx="6"/></svg>;
      case 'subroutine': 
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><rect x="2" y="4" width="20" height="16"/><line x1="6" y1="4" x2="6" y2="20"/><line x1="18" y1="4" x2="18" y2="20"/></svg>;
      default: 
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>;
    }
  };

  return (
    <div 
      className={`tactical-node-wrapper glass-panel ${selected ? 'selected' : ''}`}
      style={{
        padding: '16px 12px 12px 12px',
        minWidth: '200px',
        minHeight: '70px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: selected ? '2px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: selected ? '0 0 20px rgba(0, 229, 255, 0.4)' : 'none',
        borderRadius: '12px',
        background: 'rgba(15, 23, 42, 0.85)',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      {/* 전술 기호 배지 (클릭 시 형태 순환) */}
      <div 
        onClick={handleBadgeClick}
        title="기호 변경"
        style={{
          position: 'absolute',
          top: '-10px',
          left: '10px',
          background: '#0f172a',
          border: `1.5px solid ${selected ? '#00e5ff' : 'rgba(255,255,255,0.2)'}`,
          borderRadius: '6px',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 20,
          cursor: 'pointer',
          transition: 'transform 0.1s active',
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#00e5ff'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = selected ? '#00e5ff' : 'rgba(255,255,255,0.2)'}
      >
        {renderShapeBadge()}
      </div>

      <Handle type="target" position={Position.Top} style={{ background: '#00e5ff' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#00e5ff' }} />
      <Handle type="target" position={Position.Left} style={{ background: '#a855f7' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#a855f7' }} />

      <div className="node-content" style={{ width: '100%', marginTop: '4px' }}>
        {isEditing ? (
          <textarea 
            value={title} 
            onChange={onTitleChange} 
            onBlur={onTitleBlur}
            autoFocus
            rows={2}
            style={{
              background: 'transparent', border: 'none', color: '#fff',
              width: '100%', fontSize: '14px', fontWeight: '600', textAlign: 'center', outline: 'none',
              fontFamily: 'inherit', resize: 'none'
            }}
          />
        ) : (
          <div 
            onDoubleClick={() => setIsEditing(true)}
            style={{ 
              fontSize: '14px', fontWeight: '600', color: '#f1f5f9', textAlign: 'center',
              cursor: 'text', userSelect: 'none', width: '100%', wordBreak: 'break-word',
              lineHeight: '1.4'
            }}
          >
            {data.label}
          </div>
        )}
      </div>

      {/* 전술 장식 (코너 조명) */}
      <div style={{ position: 'absolute', top: '0', left: '0', width: '4px', height: '4px', background: '#00e5ff', borderRadius: '50%', margin: '4px' }}></div>
    </div>
  );
};

export default TacticalNode;
