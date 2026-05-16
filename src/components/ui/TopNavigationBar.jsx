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

  const isMobile = window.innerWidth <= 768;

  return (
    <div className="top-nav-bar" style={{ padding: isMobile ? '0 10px' : '0 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '15px', flex: 1, overflow: 'hidden' }}>
        <button 
          onClick={() => window.location.href = '/'}
          style={{ background: 'transparent', border: 'none', color: '#00e5ff', cursor: 'pointer', display: 'flex', padding: 0 }}
          title="Aura Hub 메인으로 복귀"
        >
          <Home size={isMobile ? 16 : 18} />
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
              fontSize: isMobile ? '14px' : '16px',
              fontWeight: '900',
              outline: 'none',
              width: isMobile ? '100px' : '150px'
            }}
          />
        ) : (
          <h2 
            onClick={() => { setTempName(currentProjectName); setIsRenaming(true); }}
            style={{ 
              color: '#00e5ff', 
              margin: 0, 
              fontSize: isMobile ? '13px' : '16px', 
              fontWeight: '900', 
              letterSpacing: '0.5px',
              cursor: 'text',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: isMobile ? '80px' : 'none'
            }}
          >
            {currentProjectName}
          </h2>
        )}

        {/* 환경 식별 배지 (모바일에서는 도메인 숨김) */}
        <div style={{
          padding: '2px 6px',
          background: 'rgba(15, 23, 42, 0.5)',
          border: `1px solid ${window.location.hostname.includes('dev') || window.location.hostname === 'localhost' ? '#0A84FF' : '#30D158'}`,
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          boxShadow: `0 0 10px ${window.location.hostname.includes('dev') || window.location.hostname === 'localhost' ? 'rgba(10, 132, 255, 0.3)' : 'rgba(48, 209, 88, 0.3)'}`
        }}>
          <div style={{
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: window.location.hostname.includes('dev') || window.location.hostname === 'localhost' ? '#0A84FF' : '#30D158',
          }} />
          <span style={{
            color: window.location.hostname.includes('dev') || window.location.hostname === 'localhost' ? '#0A84FF' : '#30D158',
            fontSize: '9px',
            fontWeight: '900',
            fontFamily: 'monospace'
          }}>
            {window.location.hostname.includes('dev') || window.location.hostname === 'localhost' ? 'DEV' : 'LIVE'}
          </span>
        </div>

        {/* 🏆 v4.7.0-PLATINUM 버전 배지 */}
        <div style={{
          padding: '2px 8px',
          background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2) 0%, rgba(0, 150, 255, 0.2) 100%)',
          border: '1px solid #00e5ff',
          borderRadius: '4px',
          boxShadow: '0 0 15px rgba(0, 229, 255, 0.3)'
        }}>
          <span style={{
            color: '#00e5ff',
            fontSize: '10px',
            fontWeight: '900',
            letterSpacing: '0.5px'
          }}>
            v4.7.0-PLATINUM
          </span>
        </div>

        {/* [v4.6-PLATINUM] 스토리지 용량 모니터링 (모바일에서는 숨김) */}
        {!isMobile && (
          <div style={{
            padding: '2px 10px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '9px', fontWeight: '900', color: '#64748b' }}>STORAGE</span>
            <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${Math.min(100, (JSON.stringify(localStorage).length / (5 * 1024 * 1024) * 100))}%`, 
                height: '100%', 
                background: (JSON.stringify(localStorage).length / (5 * 1024 * 1024)) > 0.8 ? '#ef4444' : '#00e5ff' 
              }} />
            </div>
            <span style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', fontFamily: 'monospace' }}>
              {(JSON.stringify(localStorage).length / (5 * 1024 * 1024) * 100).toFixed(1)}%
            </span>
          </div>
        )}
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

        <div className="divider" style={{ height: '15px' }}></div>

        {/* 🚪 로그아웃 버튼 (v4.7.0) */}
        <button 
          onClick={() => {
            if (confirm('작전 구역에서 퇴장하시겠습니까?')) {
              localStorage.removeItem('aura_token');
              localStorage.removeItem('aura_user_role');
              window.location.reload();
            }
          }}
          style={{ 
            background: 'rgba(244, 63, 94, 0.1)', 
            border: '1px solid rgba(244, 63, 94, 0.3)', 
            color: '#f43f5e', 
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.2s'
          }}
          title="안전하게 퇴장"
        >
          LOGOUT
        </button>
      </div>
    </div>
  );
};

export default TopNavigationBar;
