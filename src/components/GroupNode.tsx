import React from 'react';
import { useFlowStore } from '../store/useFlowStore';
import { Handle, Position } from '@xyflow/react';

export default function GroupNode({ id, data, selected }: any) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const toggleGroupCollapse = useFlowStore((state) => state.toggleGroupCollapse);
  const searchTerm = useFlowStore((state) => state.searchTerm);

  // --- 🚀 모바일 감지 ---
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 1024);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 레이더 매칭 로직
  const isMatch = searchTerm === '' || 
                  data.label?.toLowerCase().includes(searchTerm.toLowerCase());

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleGroupCollapse(id);
  };

  const isCollapsed = !!data.isCollapsed;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 1. 외부 브리핑 패널 (설명 영역) */}
      <div style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        width: '100%',
        marginBottom: '12px',
        padding: isMobile ? '8px 12px' : '12px 16px',
        backgroundColor: 'rgba(0, 229, 255, 0.12)',
        backdropFilter: 'blur(20px)',
        borderRadius: '12px',
        border: '1px solid rgba(0, 229, 255, 0.5)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        color: '#ffffff',
        fontSize: isMobile ? '11px' : '13px',
        lineHeight: '1.5',
        zIndex: 20,
        pointerEvents: 'auto',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{ fontSize: '9px', color: '#00e5ff', fontWeight: 'bold', letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.8 }}>
          Strategic Directive // {data.label}
        </div>
        <div style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: 500 }}>
          {data.description ? data.description : (
            <span style={{ color: 'rgba(255, 255, 255, 0.3)', fontStyle: 'italic' }}>
              지휘관님의 세부 작전 지침을 입력해주세요. (더블클릭)
            </span>
          )}
        </div>
      </div>

      {/* 2. 전술 구역 (그룹 본체) */}
      <div 
        style={{
          backgroundColor: isCollapsed 
            ? 'rgba(25, 27, 30, 0.95)' 
            : (selected ? 'rgba(0, 229, 255, 0.12)' : 'rgba(0, 229, 255, 0.03)'),
          backdropFilter: 'blur(12px)',
          border: selected 
            ? '2px solid #00e5ff' 
            : (isCollapsed ? '1px solid rgba(0, 229, 255, 0.4)' : '1px dashed rgba(0, 229, 255, 0.25)'),
          borderRadius: '16px',
          width: '100%',
          height: '100%',
          position: 'relative',
          minWidth: isCollapsed ? '160px' : '220px',
          minHeight: isCollapsed ? '60px' : '100px',
          cursor: 'pointer',
          boxShadow: selected 
            ? '0 0 30px rgba(0, 229, 255, 0.3), inset 0 0 15px rgba(0, 229, 255, 0.1)' 
            : (isMatch && searchTerm !== '') ? '0 0 20px rgba(0, 229, 255, 0.3)' : '0 10px 30px rgba(0,0,0,0.3)',
          opacity: isMatch ? 1 : 0.15,
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          display: isCollapsed ? 'flex' : 'block',
          alignItems: isCollapsed ? 'center' : 'initial',
          justifyContent: isCollapsed ? 'center' : 'initial',
          padding: isCollapsed ? '0' : '20px'
        }}
      >
        {/* 상단 라벨 및 제어 버튼 - 본체에 부착 */}
        <div style={{
          position: 'absolute',
          top: '-12px',
          left: isCollapsed ? '50%' : '16px',
          transform: isCollapsed ? 'translateX(-50%)' : 'none',
          backgroundColor: 'rgba(10, 10, 15, 0.95)',
          backdropFilter: 'blur(20px)',
          padding: '4px 12px',
          borderRadius: '8px',
          border: '1px solid rgba(0, 229, 255, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}>
          <span style={{ fontSize: '10px', fontWeight: '800', color: '#00e5ff', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            {data.label}
          </span>
          <button 
            onClick={handleToggleCollapse}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 229, 255, 0.3)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            {isCollapsed ? '↑' : '↓'}
          </button>
        </div>

        {isCollapsed && (
          <div style={{ color: '#00e5ff', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px' }}>
            {data.label}
          </div>
        )}

        <Handle 
          type="target" 
          position={Position.Left} 
          style={{ 
            background: '#00e5ff', 
            border: 'none', 
            width: isMobile ? '24px' : '10px', 
            height: isMobile ? '24px' : '10px',
            left: isMobile ? '-12px' : '-5px',
            borderRadius: '50%',
            opacity: 0.8,
            boxShadow: '0 0 10px #00e5ff',
            zIndex: 30
          }} 
        />
        <Handle 
          type="source" 
          position={Position.Right} 
          style={{ 
            background: '#00e5ff', 
            border: 'none', 
            width: isMobile ? '24px' : '10px', 
            height: isMobile ? '24px' : '10px',
            right: isMobile ? '-12px' : '-5px',
            borderRadius: '50%',
            opacity: 0.8,
            boxShadow: '0 0 10px #00e5ff',
            zIndex: 30
          }} 
        />
      </div>
    </div>
  );
}
