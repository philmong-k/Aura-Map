import React, { useState, useEffect } from 'react';
import { useFlowStore } from '../store/useFlowStore';
import { useAuthStore } from '../store/useAuthStore';
import { Users, Shield, Globe, Lock, X, Check, UserPlus, UserMinus } from 'lucide-react';

interface ShareManagerModalProps {
  doc: any;
  onClose: () => void;
}

interface SystemUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface ShareRecord {
  sharedUserId: string;
  accessLevel: string;
}

export const ShareManagerModal: React.FC<ShareManagerModalProps> = ({ doc, onClose }) => {
  const { token, user: currentUser } = useAuthStore();
  const { cloudDocuments, setCloudDocuments } = useFlowStore();
  
  const [allUsers, setAllUsers] = useState<SystemUser[]>([]);
  const [currentShares, setCurrentShares] = useState<ShareRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibility, setVisibility] = useState(doc.visibility || 'PRIVATE');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 유저 리스트 가져오기
        const userRes = await fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const userData = await userRes.json();
        setAllUsers(userData.filter((u: SystemUser) => u.email !== currentUser?.email));

        // 현재 공유 목록 가져오기
        const shareRes = await fetch(`/api/tactical-map/${doc.id}/shares`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const shareData = await shareRes.json();
        setCurrentShares(shareData);
      } catch (err) {
        console.error('Fetch Sharing Data Error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [doc.id, token, currentUser?.email]);

  const handleToggleGlobal = async () => {
    const newVisibility = visibility === 'SHARED' ? 'PRIVATE' : 'SHARED';
    try {
      const res = await fetch(`/api/tactical-map/${doc.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ visibility: newVisibility })
      });
      if (res.ok) {
        setVisibility(newVisibility);
        // 전역 상태 업데이트
        setCloudDocuments(cloudDocuments.map(d => d.id === doc.id ? { ...d, visibility: newVisibility } : d));
      }
    } catch (err) {
      alert('전역 공유 상태 변경 실패');
    }
  };

  const handleAddShare = async (targetUserId: string) => {
    try {
      const res = await fetch(`/api/tactical-map/${doc.id}/share`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId, accessLevel: 'READ' })
      });
      if (res.ok) {
        const { share } = await res.json();
        setCurrentShares([...currentShares, share]);
      }
    } catch (err) {
      alert('요원 추가 실패');
    }
  };

  const handleRemoveShare = async (targetUserId: string) => {
    try {
      const res = await fetch(`/api/tactical-map/${doc.id}/share/${encodeURIComponent(targetUserId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCurrentShares(currentShares.filter(s => s.sharedUserId !== targetUserId));
      }
    } catch (err) {
      alert('요원 제거 실패');
    }
  };

  return (
    <div style={{
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0,
      width: '100vw', 
      height: '100vh',
      background: 'rgba(0,0,0,0.85)', 
      backdropFilter: 'blur(10px)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 9999, // 최상단 보장
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #151921, #0d1117)',
        width: '500px', borderRadius: '24px', border: '1px solid rgba(0, 229, 255, 0.3)',
        boxShadow: '0 25px 50px -12px rgba(0, 229, 255, 0.25)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'modalAppear 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={20} color="#00e5ff" /> 공유 설정 관리
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '4px' }}>{doc.title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.5 }}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
          
          {/* Global Visibility */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: '#fff', fontSize: '14px', margin: 0 }}>전체 작전실 공유</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '4px' }}>합동 작전실 탭에 모든 요원이 볼 수 있게 노출합니다.</p>
              </div>
              <button 
                onClick={handleToggleGlobal}
                style={{
                  background: visibility === 'SHARED' ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.05)',
                  border: visibility === 'SHARED' ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)',
                  color: visibility === 'SHARED' ? '#00e5ff' : 'rgba(255,255,255,0.3)',
                  padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s'
                }}
              >
                {visibility === 'SHARED' ? <Globe size={16} /> : <Lock size={16} />}
                {visibility === 'SHARED' ? '공유 중' : '비공개'}
              </button>
            </div>
          </div>

          {/* Targeted Sharing */}
          <div>
            <h3 style={{ color: '#fff', fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} color="#00e5ff" /> 특정 요원 지정 공유 (View Only)
            </h3>
            
            {isLoading ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>요원 목록 로딩 중...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {allUsers.map(user => {
                  const isShared = currentShares.some(s => s.sharedUserId === user.email);
                  return (
                    <div key={user.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <div>
                        <div style={{ color: '#fff', fontSize: '13px' }}>{user.name || '무명 요원'}</div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>{user.email}</div>
                      </div>
                      <button
                        onClick={() => isShared ? handleRemoveShare(user.email) : handleAddShare(user.email)}
                        style={{
                          background: isShared ? 'rgba(255, 64, 129, 0.1)' : 'rgba(0, 229, 255, 0.1)',
                          border: 'none',
                          color: isShared ? '#ff4081' : '#00e5ff',
                          padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
                          display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        {isShared ? <UserMinus size={14} /> : <UserPlus size={14} />}
                        {isShared ? '해제' : '추가'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '12px 32px', borderRadius: '12px', border: 'none', background: '#00e5ff', color: '#000', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 20px rgba(0, 229, 255, 0.4)'
            }}
          >
            확인 및 닫기
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modalAppear {
          from { transform: scale(0.9) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
