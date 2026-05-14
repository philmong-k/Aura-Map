import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import CanvasBoard from './components/CanvasBoard';
import Sidebar from './components/Sidebar';
import FloatingToolbar from './components/FloatingToolbar';
import ZenApp from './zen/ZenApp';
import { ReactFlowProvider } from '@xyflow/react';
import { useAuthStore } from './store/useAuthStore';
import { useFlowStore } from './store/useFlowStore';

import { usePermissions } from './logic/usePermissions';
import { ShareManagerModal } from './components/ShareManagerModal';

// 메인 앱 레이아웃 컴포넌트
const MainLayout = () => {
  const { canView } = usePermissions();
  const sharingDoc = useFlowStore((state) => state.sharingDoc);
  const setSharingDoc = useFlowStore((state) => state.setSharingDoc);
  const [isZenMode, setIsZenMode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  // --- 🚀 사이드바 토글 상태 (768px 기준 복구) ---
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) setShowSidebar(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!canView) {
      setShowToast(true);
      const timer = setTimeout(() => {
        window.location.href = '/'; 
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [canView]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login'; 
  };

  const handleReturnToHub = () => {
    window.location.href = '/'; 
  };
  
  if (!canView) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#0a0a0b', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {showToast && (
          <div style={{
            position: 'fixed', top: '40px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(255, 82, 82, 0.9)', color: '#fff', padding: '12px 24px',
            borderRadius: '12px', boxShadow: '0 8px 32px rgba(255, 82, 82, 0.3)',
            zIndex: 9999, fontWeight: 'bold', fontSize: '14px', letterSpacing: '1px',
            border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)',
            animation: 'fadeInDown 0.5s ease-out'
          }}>
            ⚠️ 접근 권한이 없습니다. 본진으로 회군합니다.
          </div>
        )}
        <div style={{ color: '#ff5252', fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>
          ACCESS DENIED // REDIRECTING...
        </div>
      </div>
    );
  }

  if (isZenMode) {
    return <ZenApp onClose={() => setIsZenMode(false)} />;
  }

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative', 
      background: '#0d1117', 
      color: '#e0e0e0', 
      fontFamily: '"Inter", sans-serif', 
      display: 'flex', 
      overflow: 'hidden' 
    }}>
      {/* 🚀 메인 전술 구역 (캔버스) */}
      <div style={{ flexGrow: 1, width: '100%', height: '100%', position: 'relative' }}>
        <FloatingToolbar 
          onOpenZenMode={() => setIsZenMode(true)} 
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          isSidebarOpen={showSidebar}
        />
        <CanvasBoard />
      </div>


      {/* 🚀 상단 헤더 (PC 전용 혹은 최소화) */}
      {!isMobile && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: showSidebar ? '360px' : '20px',
          zIndex: 1000,
          display: 'flex',
          gap: '12px',
          transition: 'right 0.3s ease'
        }}>
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            style={{
              background: 'rgba(0, 229, 255, 0.1)',
              border: '1px solid #00e5ff',
              color: '#00e5ff',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {showSidebar ? '✕ CLOSE' : '☰ MENU'}
          </button>
        </div>
      )}

      {/* 🚀 통합 지휘 센터 (Sidebar / Mobile Menu) */}
      {showSidebar && (
        <div style={{
          width: isMobile ? '100%' : '340px',
          height: '100%',
          position: 'absolute',
          right: 0,
          top: 0,
          zIndex: 4000,
          background: '#0a0a0b',
          borderLeft: '1px solid rgba(0, 229, 255, 0.2)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.9)',
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ 
            padding: '24px', 
            background: 'linear-gradient(90deg, rgba(0,229,255,0.1) 0%, rgba(0,0,0,0) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.08)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <div>
              <div style={{ fontSize: '10px', color: '#00e5ff', fontWeight: '900', letterSpacing: '2px', marginBottom: '4px' }}>TACTICAL COMMAND</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>CONTROL CENTER</div>
            </div>
            <button 
              onClick={() => setShowSidebar(false)} 
              style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>
          </div>

          <div style={{ flexGrow: 1, overflowY: 'auto', padding: '20px' }}>
            {/* User Profile */}
            <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
               <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>IDENTIFIED OPERATOR</div>
               <div style={{ fontWeight: 'bold', color: '#00e5ff', fontSize: '14px' }}>{user?.name || user?.email}</div>
            </div>

            {/* Tactical Actions (Only for Mobile) */}
            {isMobile && (
              <div style={{ marginBottom: '30px' }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '1px' }}>QUICK ACTIONS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                   <button onClick={handleReturnToHub} style={{ padding: '15px', background: 'rgba(0, 229, 255, 0.05)', border: '1px solid rgba(0, 229, 255, 0.2)', color: '#00e5ff', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' }}>🌐 AURA HUB</button>
                   <button onClick={handleLogout} style={{ padding: '15px', background: 'rgba(255, 82, 82, 0.05)', border: '1px solid rgba(255, 82, 82, 0.2)', color: '#ff5252', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' }}>🚪 LOGOUT</button>
                </div>
              </div>
            )}

            <Sidebar />
          </div>
          
          <div style={{ padding: '20px', fontSize: '10px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            v2.6.5-GOLDEN // MOBILE OPTIMIZED
          </div>
        </div>
      )}
      
      <footer style={{ position: 'absolute', bottom: 0, width: '100%', textAlign: 'center', fontSize: '11px', color: 'rgba(0, 229, 255, 0.4)', padding: '10px 0', zIndex: 1000, pointerEvents: 'none', letterSpacing: '2px', fontWeight: 'bold' }}>
        STRATEGIC COMMAND INTERFACE // v2.6.5 (MOBILE STABLE)
      </footer>

      {/* 🔐 전역 공유 관리 모달 */}
      {sharingDoc && (
        <ShareManagerModal 
          doc={sharingDoc} 
          onClose={() => setSharingDoc(null)} 
        />
      )}
    </div>
  );
};

function App() {
  const token = useAuthStore((state) => state.token);
  const login = useAuthStore((state) => state.login);
  const resetFlow = useFlowStore((state) => state.resetFlow);
  const setUserId = useFlowStore((state) => state.setUserId);
  const currentFlowUserId = useFlowStore((state) => state.userId);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // SSO Token Capture & Authorization Check
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken && urlToken !== 'guest') {
      try {
        const payloadBase64 = urlToken.split('.')[1];
        const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decodedPayload = JSON.parse(jsonPayload);
        
        const newUserEmail = decodedPayload.email;

        // [중요] 유저가 바뀌었을 경우 기존 캔버스 데이터(localStorage) 초기화
        if (currentFlowUserId !== 'guest' && currentFlowUserId !== newUserEmail) {
          console.log('[Security] User changed. Resetting tactical canvas...');
          resetFlow();
        }
        
        // 유저 정보 저장 및 Flow Store 유저 ID 동기화
        login(urlToken, { email: newUserEmail, name: decodedPayload.name, role: decodedPayload.role });
        setUserId(newUserEmail);
        
        navigate('.', { replace: true });
      } catch (e) {
        console.error('SSO Token Parsing Error', e);
        navigate('.', { replace: true });
      }
    } else if (!token) {
      window.location.href = '/login';
    }
  }, [searchParams, login, navigate, token, resetFlow, setUserId, currentFlowUserId]);

  if (!token) return <div style={{ background: '#0d1117', height: '100vh', width: '100vw' }} />; 

  return (
    <ReactFlowProvider>
      <Routes>
        <Route path="/" element={<MainLayout />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ReactFlowProvider>
  );
}

export default App;