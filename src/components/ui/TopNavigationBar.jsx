import React, { useState } from 'react';
import { Home, Library, Wrench } from 'lucide-react';
import useStore from '../../store/useStore';
import './UIControls.css';

const TopNavigationBar = ({ showLibrary, setShowLibrary, isToolboxOpen, setIsToolboxOpen }) => {
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
    <div className="top-nav-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button 
          onClick={() => window.location.href = '/'}
          style={{ background: 'transparent', border: 'none', color: '#00e5ff', cursor: 'pointer', display: 'flex', padding: 0 }}
          title="Aura Hub 메인으로 복귀"
        >
          <Home size={18} />
        </button>
        
        <div className="divider" style={{ height: '15px' }}></div>
        
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
              width: '150px'
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
              cursor: 'text'
            }}
          >
            {currentProjectName}
          </h2>
        )}

        {/* 환경 식별 배지 (제목 옆으로 이동) */}
        <div style={{
          padding: '2px 8px',
          background: 'rgba(15, 23, 42, 0.5)',
          border: `1px solid ${window.location.hostname.includes('dev') || window.location.hostname === 'localhost' ? '#0A84FF' : '#30D158'}`,
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          boxShadow: `0 0 10px ${window.location.hostname.includes('dev') || window.location.hostname === 'localhost' ? 'rgba(10, 132, 255, 0.3)' : 'rgba(48, 209, 88, 0.3)'}`
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: window.location.hostname.includes('dev') || window.location.hostname === 'localhost' ? '#0A84FF' : '#30D158',
            boxShadow: `0 0 5px ${window.location.hostname.includes('dev') || window.location.hostname === 'localhost' ? '#0A84FF' : '#30D158'}`
          }} />
          <span style={{
            color: window.location.hostname.includes('dev') || window.location.hostname === 'localhost' ? '#0A84FF' : '#30D158',
            fontSize: '10px',
            fontWeight: '900',
            fontFamily: 'monospace',
            letterSpacing: '1px'
          }}>
            {window.innerWidth <= 1024 
              ? (window.location.hostname.includes('dev') || window.location.hostname === 'localhost' ? 'DEV' : 'LIVE') 
              : (window.location.hostname.includes('dev') || window.location.hostname === 'localhost' ? `DEV: ${window.location.hostname}` : `LIVE: ${window.location.hostname}`)}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
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
