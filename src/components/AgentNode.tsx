import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { useFlowStore } from '../store/useFlowStore';

export default function AgentNode({ id, data, selected }: any) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
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
                  data.label?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  data.description?.toLowerCase().includes(searchTerm.toLowerCase());

  return (
    <div 
      style={{
        background: 'rgba(25, 27, 30, 0.95)',
        backdropFilter: 'blur(8px)',
        borderTop: selected ? '2px solid #00e5ff' : '1px solid rgba(0, 229, 255, 0.2)',
        borderRight: selected ? '2px solid #00e5ff' : '1px solid rgba(0, 229, 255, 0.2)',
        borderBottom: selected ? '2px solid #00e5ff' : '1px solid rgba(0, 229, 255, 0.2)',
        borderLeft: '4px solid #00e5ff',
        borderRadius: '8px',
        padding: isMobile ? '10px' : '16px',
        boxShadow: selected 
          ? '0 0 20px #00e5ff, inset 0 0 10px rgba(0,229,255,0.5)' 
          : (isMatch && searchTerm !== '') ? '0 0 20px rgba(0, 229, 255, 0.6)' : '0 8px 32px rgba(0, 0, 0, 0.4)',
        width: isMobile ? '180px' : '260px', // 모바일에서 너비 축소
        minWidth: isMobile ? '160px' : '220px',
        wordWrap: 'break-word',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isMatch ? 1 : 0.2,
      }}
      onMouseOver={(e) => {
        if (!isMatch || selected) return;
        e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 229, 255, 0.3)';
        e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.5)';
      }}
      onMouseOut={(e) => {
        if (!isMatch || selected) return;
        e.currentTarget.style.boxShadow = (searchTerm !== '') ? '0 0 20px rgba(0, 229, 255, 0.6)' : '0 8px 32px rgba(0, 0, 0, 0.4)';
        e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.2)';
      }}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ 
          background: '#00e5ff', 
          border: 'none', 
          width: isMobile ? '24px' : '8px', 
          height: isMobile ? '24px' : '8px',
          left: isMobile ? '-12px' : '-4px',
          borderRadius: '50%',
          opacity: isMobile ? 0.8 : 1,
          boxShadow: isMobile ? '0 0 15px #00e5ff' : 'none',
          zIndex: 1000
        }} 
      />
      
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '6px'
      }}>
        {/* 전술 뱃지 영역 (1등급 SVG 정밀 조형) */}
        <svg 
          width="38" 
          height="20" 
          viewBox="0 0 38 20"
          style={{
            flexShrink: 0,
            filter: 'drop-shadow(0 0 5px rgba(0, 229, 255, 0.7))',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
        >
          <g transform="translate(1, 1)">
            {data.symbolType === 'terminal' && (
              <rect width="36" height="18" rx="9" 
                fill="rgba(0, 229, 255, 0.12)" stroke="#00e5ff" strokeWidth="1.6" />
            )}
            {data.symbolType === 'process' && (
              <rect width="36" height="18" 
                fill="rgba(0, 229, 255, 0.12)" stroke="#00e5ff" strokeWidth="1.6" />
            )}
            {data.symbolType === 'decision' && (
              <path d="M 18 0 L 36 9 L 18 18 L 0 9 Z" 
                fill="rgba(0, 229, 255, 0.12)" stroke="#00e5ff" strokeWidth="1.6" />
            )}
            {data.symbolType === 'data' && (
              <path d="M 6 0 L 36 0 L 30 18 L 0 18 Z" 
                fill="rgba(0, 229, 255, 0.12)" stroke="#00e5ff" strokeWidth="1.6" />
            )}
            {!['terminal', 'process', 'decision', 'data'].includes(data.symbolType) && (
               <rect width="36" height="18" strokeDasharray="3,2"
                fill="rgba(0, 229, 255, 0.05)" stroke="#00e5ff" strokeWidth="1.2" />
            )}
          </g>
        </svg>

        <div style={{ 
          fontWeight: 'bold', 
          fontSize: '15px', 
          color: '#ffffff',
          letterSpacing: '0.5px',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere'
        }}>
          {data.label}
        </div>
      </div>
      <div style={{ 
        fontSize: '12px', 
        color: '#b0bec5', 
        lineHeight: '1.5',
        fontWeight: 400,
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        maxHeight: '300px',
        overflowY: 'auto',
        paddingRight: '4px'
      }}>
        {data.description ? data.description : (
          <span style={{ color: 'rgba(255, 255, 255, 0.2)', fontStyle: 'italic' }}>
            새로운 전술 노드입니다. 더블클릭하여 수정하세요.
          </span>
        )}
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ 
          background: '#00e5ff', 
          border: 'none', 
          width: isMobile ? '24px' : '8px', 
          height: isMobile ? '24px' : '8px',
          right: isMobile ? '-12px' : '-4px',
          borderRadius: '50%',
          opacity: isMobile ? 0.8 : 1,
          boxShadow: isMobile ? '0 0 15px #00e5ff' : 'none',
          zIndex: 1000
        }} 
      />
    </div>
  );
}
