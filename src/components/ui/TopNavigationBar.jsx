import React, { useState } from 'react';
import { Home, Library, Wrench, HelpCircle } from 'lucide-react';
import useStore from '../../store/useStore';
import './UIControls.css';

const TopNavigationBar = ({ showLibrary, setShowLibrary, isToolboxOpen, setIsToolboxOpen, isLegendOpen, setIsLegendOpen, projectTotal }) => {
  const currentProjectId = useStore((state) => state.currentProjectId);
  const currentProjectName = useStore((state) => state.currentProjectName);
  const renameProject = useStore((state) => state.renameProject);
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState(currentProjectName);

  const handleRename = () => {
    renameProject(currentProjectId, tempName);
    setIsRenaming(false);
  };

  return (
    <div className="top-nav-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 15px', gap: '10px' }}>
      {/* 좌측 영역: 홈 + 제목 + 배지 (가변 폭) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
        <button 
          onClick={() => window.location.href = '/'}
          style={{ background: 'transparent', border: 'none', color: '#00e5ff', cursor: 'pointer', display: 'flex', padding: 0, flexShrink: 0 }}
          title="Aura Hub 메인으로 복귀"
        >
          <Home size={18} />
        </button>
        
        <div className="divider" style={{ height: '15px', flexShrink: 0 }}></div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
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
                fontSize: '16px',
                fontWeight: '900',
                outline: 'none',
                width: '100%'
              }}
            />
          ) : (
            <h2 
              onClick={() => { setTempName(currentProjectName); setIsRenaming(true); }}
              style={{ 
                color: '#00e5ff', 
                margin: 0, 
                fontSize: '16px', 
                fontWeight: '900', 
                letterSpacing: '0.5px',
                cursor: 'text',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: window.innerWidth <= 768 ? '120px' : 'none'
              }}
              title={currentProjectName}
            >
              {currentProjectName}
            </h2>
          )}
          
          <span style={{ 
            fontSize: '10px', 
            opacity: 0.8, 
            color: '#fbbf24', 
            fontWeight: 'bold', 
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            {window.innerWidth <= 768 ? 'v4.6' : 'v4.6-PLATINUM'}
          </span>
        </div>

        {/* 환경 식별 배지 (모바일에서는 도트만 표시하거나 생략 검토 가능) */}
        {window.innerWidth > 480 && (
          <div style={{
            padding: '2px 6px',
            background: 'rgba(15, 23, 42, 0.5)',
            border: `1px solid ${window.location.hostname.includes('dev') || window.location.hostname === 'localhost' ? '#0A84FF' : '#30D158'}`,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0
          }}>
            <div style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: window.location.hostname.includes('dev') || window.location.hostname === 'localhost' ? '#0A84FF' : '#30D158'
            }} />
            <span style={{
              color: window.location.hostname.includes('dev') || window.location.hostname === 'localhost' ? '#0A84FF' : '#30D158',
              fontSize: '9px',
              fontWeight: '900'
            }}>
              {window.location.hostname.includes('dev') || window.location.hostname === 'localhost' ? 'DEV' : 'LIVE'}
            </span>
          </div>
        )}
      </div>

      {/* 우측 영역: 도구 버튼들 (고정 폭) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <button 
          onClick={() => setIsLegendOpen(!isLegendOpen)}
          style={{ 
            background: isLegendOpen ? 'rgba(0, 229, 255, 0.1)' : 'transparent', 
            border: 'none', 
            color: isLegendOpen ? '#00e5ff' : '#94a3b8', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            padding: '4px 8px',
            borderRadius: '8px'
          }}
          title="전술 가이드"
        >
          <HelpCircle size={18} />
          {window.innerWidth > 1024 && <span style={{ fontSize: '12px', fontWeight: '800' }}>가이드</span>}
        </button>

        <div className="divider" style={{ height: '15px' }}></div>

        <button 
          onClick={() => setShowLibrary(!showLibrary)}
          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', padding: 0 }}
          title="작전 저장소 열기"
        >
          <Library size={18} />
        </button>

        <button 
          onClick={() => setIsToolboxOpen(!isToolboxOpen)}
          style={{ background: 'transparent', border: 'none', color: isToolboxOpen ? '#00e5ff' : '#94a3b8', cursor: 'pointer', display: 'flex', padding: 0 }}
          title="캔버스 도구함 여닫기"
        >
          <Wrench size={18} />
        </button>
      </div>
    </div>
  );
};

export default TopNavigationBar;
