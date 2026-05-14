import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileText } from 'lucide-react';
import useStore from '../store/useStore';

const TacticalNode = ({ id, data, selected }) => {
  const onCycleShape = useStore((state) => state.onCycleShape);
  const tacticalSelection = useStore((state) => state.tacticalSelection);
  const multiSelectMode = useStore((state) => state.multiSelectMode);
  
  // 🛡️ 지니어스 엔진: 전술적 주권 (Sovereignty) 확립
  // 다중 선택 모드일 때는 라이브러리의 selected 속성을 무시하고 우리의 tacticalSelection 명부만 따름
  const isTacticallySelected = multiSelectMode 
    ? tacticalSelection.includes(id) 
    : selected;
  
  const shape = data.shape || 'process'; 

  // 배지에 들어갈 도형 SVG 렌더링 함수
  const renderShapeBadge = () => {
    const color = isTacticallySelected ? '#030712' : '#00e5ff';
    switch (shape) {
      case 'decision': 
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3"><path d="M12 2l10 10-10 10L2 12z"/></svg>;
      case 'io': 
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3"><path d="M6 4h16l-4 16H2z"/></svg>;
      case 'database': 
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>;
      case 'terminal': 
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3"><rect x="2" y="6" width="20" height="12" rx="6"/></svg>;
      case 'subroutine': 
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3"><rect x="2" y="4" width="20" height="16"/><line x1="6" y1="4" x2="6" y2="20"/><line x1="18" y1="4" x2="18" y2="20"/></svg>;
      default: 
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>;
    }
  };

  return (
    <div 
      className={`tactical-node-wrapper glass-panel ${isTacticallySelected ? 'selected' : ''}`}
      style={{
        padding: '16px 12px 12px 12px',
        minWidth: '200px',
        minHeight: '70px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: isTacticallySelected ? '2.5px solid #00e5ff' : '1.5px solid rgba(255, 255, 255, 0.5)',
        boxShadow: isTacticallySelected 
          ? '0 0 30px rgba(0, 229, 255, 0.6)' 
          : '0 0 15px rgba(255, 255, 255, 0.1)',
        borderRadius: '14px',
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
      }}
    >
      {/* 전술 기호 배지 (기호 클릭 시 순환) */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onCycleShape(id);
        }}
        className="shape-badge nodrag"
        style={{
          position: 'absolute',
          top: '-14px',
          left: '12px',
          background: isTacticallySelected ? '#00e5ff' : '#1e293b',
          color: isTacticallySelected ? '#030712' : '#ffffff',
          border: `1.5px solid ${isTacticallySelected ? '#00e5ff' : 'rgba(255,255,255,0.4)'}`,
          borderRadius: '8px',
          padding: '4px 8px',
          cursor: 'pointer',
          zIndex: 1000, // 우선순위 최상위 보장
          boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="기호 변경"
      >
        {renderShapeBadge()}
      </div>

      {/* 모든 방향 핸들 */}
      <Handle type="target" position={Position.Top} id="t-top" style={{ background: '#00e5ff', left: '35%', width: '10px', height: '10px', border: '2px solid #0f172a', zIndex: 50 }} />
      <Handle type="source" position={Position.Top} id="s-top" style={{ background: '#a855f7', left: '65%', width: '10px', height: '10px', border: '2px solid #0f172a', zIndex: 50 }} />
      
      <Handle type="target" position={Position.Bottom} id="t-bottom" style={{ background: '#00e5ff', left: '35%', width: '10px', height: '10px', border: '2px solid #0f172a', zIndex: 50 }} />
      <Handle type="source" position={Position.Bottom} id="s-bottom" style={{ background: '#a855f7', left: '65%', width: '10px', height: '10px', border: '2px solid #0f172a', zIndex: 50 }} />
      
      <Handle type="target" position={Position.Left} id="t-left" style={{ background: '#00e5ff', top: '35%', width: '10px', height: '10px', border: '2px solid #0f172a', zIndex: 50 }} />
      <Handle type="source" position={Position.Left} id="s-left" style={{ background: '#a855f7', top: '65%', width: '10px', height: '10px', border: '2px solid #0f172a', zIndex: 50 }} />
      
      <Handle type="target" position={Position.Right} id="t-right" style={{ background: '#00e5ff', top: '35%', width: '10px', height: '10px', border: '2px solid #0f172a', zIndex: 50 }} />
      <Handle type="source" position={Position.Right} id="s-right" style={{ background: '#a855f7', top: '65%', width: '10px', height: '10px', border: '2px solid #0f172a', zIndex: 50 }} />

      {/* 📊 실시간 시트 데이터 합산 배지 */}
      {data.sheet && data.sheet.rows && data.sheet.rows.length > 0 && (() => {
        const columns = data.sheet.columns || [];
        const rows = data.sheet.rows || [];

        // 수식 계산 헬퍼 (최신 엔진 이식)
        const evalFormula = (formula, row) => {
          if (!formula || typeof formula !== 'string') return 0;
          try {
            let expr = formula.trim();
            columns.forEach(c => {
              let val = 0;
              if (c.type === 'date') {
                if (row[c.id]) {
                  const d = new Date(row[c.id].replace(/-/g, '/'));
                  val = d.getTime();
                  if (isNaN(val)) val = 0;
                }
              } else {
                val = parseFloat(row[c.id]);
                if (isNaN(val)) val = 0;
              }
              const r = new RegExp(`\\b${c.id}\\b`, 'g');
              expr = expr.replace(r, val);
            });
            
            const days = (ms) => {
              if (typeof ms !== 'number' || isNaN(ms)) return 0;
              return Math.abs(Math.round(ms / 86400000));
            };

            // eslint-disable-next-line no-new-func
            const result = new Function('days', `try { return (${expr}); } catch(e) { return 0; }`)(days);
            return (typeof result === 'number' && !isNaN(result)) ? result : 0;
          } catch { return 0; }
        };

        const total = rows.reduce((acc, row) => {
          // 1. 대표 수식 필드(c4 또는 '계', '합' 포함)가 있으면 해당 값만 합산 (중복 합산 방지)
          const targetCol = columns.find(c => 
            (c.type === 'formula' || c.type === 'number') && 
            (c.id === 'c4' || c.name.includes('계') || c.name.includes('합') || c.name.includes('소계'))
          );

          if (targetCol) {
            if (targetCol.type === 'formula') {
              return acc + evalFormula(targetCol.formula, row);
            } else {
              return acc + (parseFloat(row[targetCol.id]) || 0);
            }
          }
          
          // 2. 대표 필드가 없으면 모든 숫자 필드를 합산 (Legacy 지원)
          return acc + columns.reduce((rAcc, col) => {
            if (col.type === 'number') return rAcc + (parseFloat(row[col.id]) || 0);
            return rAcc;
          }, 0);
        }, 0);

        if (total === 0) return null;

        return (
          <div style={{ 
            position: 'absolute', top: '-14px', right: '12px', 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', 
            fontSize: '11px', fontWeight: '900', padding: '4px 10px', borderRadius: '8px',
            border: '1.5px solid #10b981', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
            display: 'flex', alignItems: 'center', gap: '4px', zIndex: 1000
          }}>
            <span style={{ opacity: 0.8 }}>TOTAL</span>
            <span>{total.toLocaleString()}</span>
          </div>
        );
      })()}

      <div className="node-content" style={{ textAlign: 'center', width: '100%', zIndex: 20 }}>
        <div 
          style={{ 
            fontSize: '15px', 
            fontWeight: '900', 
            color: '#ffffff', 
            textAlign: 'center',
            width: '100%', 
            wordBreak: 'break-word',
            lineHeight: '1.2',
            letterSpacing: '-0.3px',
            textShadow: '0 2px 8px rgba(0,0,0,1), 0 0 10px rgba(0,0,0,0.8)'
          }}
        >
          {data.label || '이름 없음'}
        </div>
      </div>

      {/* 상세 내용 존재 아이콘 */}
      <div style={{ position: 'absolute', bottom: '6px', right: '10px', display: 'flex', gap: '6px', alignItems: 'center' }}>
        {data.memo && (
          <div style={{ color: '#e879f9', opacity: 0.8, display: 'flex' }} title="메모 존재">
            <FileText size={12} />
          </div>
        )}
        {data.sheet && (
          <div style={{ color: '#00e5ff', opacity: 0.8, display: 'flex' }} title="장부 데이터 존재">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>
          </div>
        )}
      </div>

      {/* 전술 장식 (코너 조명) */}
      <div style={{ position: 'absolute', top: '0', left: '0', width: '4px', height: '4px', background: '#00e5ff', borderRadius: '50%', margin: '4px' }}></div>
    </div>
  );
};

export default TacticalNode;
