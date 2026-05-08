import React, { useState } from 'react';
import { NodeResizer, Handle, Position } from '@xyflow/react';
import { ChevronUp, ChevronDown, Layers } from 'lucide-react';
import useStore from '../store/useStore';

const AuraGroup = ({ id, data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label || 'TACTICAL SECTOR');
  const updateNodeLabel = useStore((state) => state.updateNodeLabel);
  const toggleGroupCollapse = useStore((state) => state.toggleGroupCollapse);
  const ungroup = useStore((state) => state.ungroup);
  const updateNodeMemo = useStore((state) => state.updateNodeMemo);
  const nodes = useStore((state) => state.nodes);

  const isCollapsed = data.collapsed;
  const memo = data.memo || '';

  // 📊 하위 노드들의 시트 데이터 합산 계산 (지능형 집계 - 수식 대응)
  const groupTotal = React.useMemo(() => {
    const childNodes = nodes.filter(n => n.parentId === id);
    
    return childNodes.reduce((acc, node) => {
      const sheet = node.data.sheet;
      if (!sheet || !sheet.rows || !sheet.columns) return acc;
      
      const columns = sheet.columns;
      const rows = sheet.rows;

      const evalFormula = (formula, row) => {
        if (!formula) return 0;
        try {
          let expr = formula;
          columns.forEach(c => {
            const v = parseFloat(row[c.id]) || 0;
            const r = new RegExp(`\\b${c.id}\\b`, 'g');
            expr = expr.replace(r, v);
          });
          // eslint-disable-next-line no-new-func
          return Function(`"use strict"; return (${expr})`)() || 0;
        } catch { return 0; }
      };

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
          val = evalFormula(targetColumn.formula, row);
        }
        return rAcc + val;
      }, 0);

      return acc + nodeSum;
    }, 0);
  }, [nodes, id]);

  const onLabelChange = (evt) => setLabel(evt.target.value);
  const onLabelBlur = () => {
    setIsEditing(false);
    updateNodeLabel(id, label);
  };

  const handleMemoChange = (e) => {
    updateNodeMemo(id, e.target.value);
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    toggleGroupCollapse(id);
  };

  const handleUngroup = (e) => {
    e.stopPropagation();
    if (confirm('이 구역의 부대 편성을 해제하시겠습니까? (부대원들은 유지됩니다)')) {
      ungroup(id);
    }
  };

  return (
    <div 
      className={`aura-group-sector ${selected ? 'selected' : ''} ${isCollapsed ? 'collapsed' : ''}`}
      style={{
        width: '100%',
        height: '100%',
        background: isCollapsed ? 'rgba(0, 229, 255, 0.12)' : (selected ? 'rgba(0, 229, 255, 0.05)' : 'rgba(0, 229, 255, 0.02)'),
        border: isCollapsed ? '2.5px solid #00e5ff' : `2px dashed ${selected ? '#00e5ff' : 'rgba(0, 229, 255, 0.3)'}`,
        borderRadius: isCollapsed ? '12px' : '24px',
        position: 'relative',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        boxShadow: isCollapsed ? '0 0 25px rgba(0, 229, 255, 0.4)' : (selected ? 'inset 0 0 20px rgba(0, 229, 255, 0.1)' : 'none'),
      }}
    >
      {/* 전술 접속 포트 (압축 시 에지 연결용 - 4방향) */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0, top: '50%' }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, top: '50%' }} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0, left: '50%' }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, left: '50%' }} />

      {/* 부대 이름표 및 조작 클러스터 */}
      <div 
        onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
        style={{
          position: 'absolute',
          top: isCollapsed ? '50%' : '15px',
          left: isCollapsed ? '50%' : '20px',
          transform: isCollapsed ? 'translate(-50%, -50%)' : 'none',
          background: 'rgba(15, 23, 42, 0.95)',
          border: `1.5px solid ${selected || isCollapsed ? '#00e5ff' : 'rgba(0, 229, 255, 0.4)'}`,
          padding: '6px 12px',
          borderRadius: '10px',
          pointerEvents: 'all',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'text',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap',
          transition: 'all 0.4s ease'
        }}
      >
        {isEditing ? (
          <input 
            value={label}
            onChange={onLabelChange}
            onBlur={onLabelBlur}
            autoFocus
            style={{
              background: 'transparent',
              border: 'none',
              color: '#00e5ff',
              fontSize: '12px',
              fontWeight: '900',
              outline: 'none',
              width: '100px',
              textTransform: 'uppercase'
            }}
          />
        ) : (
          <span style={{ 
            color: '#00e5ff', 
            fontSize: '12px', 
            fontWeight: '900', 
            textTransform: 'uppercase',
            letterSpacing: '1.5px'
          }}>
            {data.label || 'TACTICAL SECTOR'}
          </span>
        )}

        {/* 📊 그룹 전체 데이터 합산 배지 (글로벌 현황판) */}
        {groupTotal > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            fontSize: '10px',
            fontWeight: '900',
            padding: '2px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ opacity: 0.8 }}>GLOBAL</span>
            <span>{groupTotal.toLocaleString()}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '4px' }}>
          {/* 압축/펼치기 버튼 */}
          <button 
            onClick={handleToggle}
            title={isCollapsed ? '펼치기' : '압축'}
            style={{
              background: 'rgba(0, 229, 255, 0.1)',
              border: '1px solid rgba(0, 229, 255, 0.2)',
              borderRadius: '4px',
              color: '#00e5ff',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          {/* 그룹 해제 버튼 */}
          <button 
            onClick={handleUngroup}
            title="편성 해제 (Ungroup)"
            style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              borderRadius: '4px',
              color: '#f43f5e',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Layers size={14} />
          </button>
        </div>
      </div>

      {/* 섹터 외부 하단 메모장 (상시 노출) */}
      <div 
        className="nodrag nopan"
        style={{
          position: 'absolute',
          bottom: isCollapsed ? '-65px' : '-70px', // 상태에 따라 위치 미세 조정
          left: '0',
          width: '100%',
          zIndex: 20,
          display: 'flex',
          justifyContent: 'center',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        <textarea 
          placeholder="작전 지침 입력..."
          value={memo}
          onChange={handleMemoChange}
          style={{
            width: '90%',
            height: isCollapsed ? '40px' : '50px', // 압축 시 메모장 크기 소폭 축소
            background: 'rgba(15, 23, 42, 0.85)',
            border: `1.5px solid ${selected ? '#00e5ff' : 'rgba(0, 229, 255, 0.3)'}`,
            borderRadius: '10px',
            padding: '8px 12px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '11px',
            resize: 'none',
            outline: 'none',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            transition: 'all 0.3s ease',
          }}
          onFocus={(e) => e.target.style.borderColor = '#00e5ff'}
          onBlur={(e) => e.target.style.borderColor = selected ? '#00e5ff' : 'rgba(0, 229, 255, 0.3)'}
        />
      </div>

      {/* 크기 조절 핸들 (지휘관 전용, 압축 시 숨김) */}
      {!isCollapsed && (
        <NodeResizer 
          minWidth={200} 
          minHeight={150} 
          isVisible={selected} 
          lineStyle={{ border: '2px solid #00e5ff', opacity: 0.5 }}
          handleStyle={{ 
            background: '#030712', 
            border: '2px solid #00e5ff', 
            width: '12px', 
            height: '12px', 
            borderRadius: '3px' 
          }}
        />
      )}
    </div>
  );
};

export default AuraGroup;
