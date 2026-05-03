import React, { useState } from 'react';
import { Home, Library, Wrench } from 'lucide-react';
import useStore from '../../store/useStore';
import './UIControls.css';

const TopNavigationBar = ({ showLibrary, setShowLibrary, isToolboxOpen, setIsToolboxOpen }) => {
  const { currentProjectId, currentProjectName, renameProject } = useStore();
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState(currentProjectName);

  const handleRename = () => {
    renameProject(currentProjectId, tempName);
    setIsRenaming(false);
  };

  return (
    <div className="top-nav-bar">
      <button 
        onClick={() => window.location.href = '/'}
        style={{ background: 'transparent', border: 'none', color: '#00e5ff', cursor: 'pointer', display: 'flex', padding: 0 }}
        title="Aura Hub 메인으로 복귀"
      >
        <Home size={20} />
      </button>
      
      <div className="divider" style={{ height: '20px' }}></div>
      
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
      
      <div className="divider" style={{ height: '20px' }}></div>
      
      <button 
        onClick={() => setShowLibrary(!showLibrary)}
        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', padding: 0 }}
        title="작전 도서관 열기"
      >
        <Library size={20} />
      </button>

      <div className="divider" style={{ height: '20px' }}></div>

      <button 
        onClick={() => setIsToolboxOpen(!isToolboxOpen)}
        style={{ background: 'transparent', border: 'none', color: isToolboxOpen ? '#00e5ff' : '#94a3b8', cursor: 'pointer', display: 'flex', padding: 0 }}
        title="전술 도구함 여닫기"
      >
        <Wrench size={20} />
      </button>
    </div>
  );
};

export default TopNavigationBar;
