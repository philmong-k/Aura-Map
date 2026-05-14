import React from 'react';
import { useFlowStore } from '../store/useFlowStore';
import { useAuthStore } from '../store/useAuthStore';
import { Share2, Lock } from 'lucide-react';

export const ShareToggle = () => {
  const currentDoc = useFlowStore((state) => state.currentDoc);
  const setCurrentDoc = useFlowStore((state) => state.setCurrentDoc);
  const token = useAuthStore((state) => state.token);

  if (!currentDoc) return null;

  const isShared = currentDoc.visibility === 'SHARED';

  const handleToggle = async () => {
    const newVisibility = isShared ? 'PRIVATE' : 'SHARED';
    
    try {
      const response = await fetch(`/api/tactical-map/${currentDoc.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ visibility: newVisibility })
      });

      if (response.ok) {
        setCurrentDoc({ ...currentDoc, visibility: newVisibility });
        // 사이드바 목록 갱신을 유도하기 위해 전역 상태 업데이트가 필요할 수 있음
        // 여기서는 간단히 currentDoc만 업데이트
      } else {
        alert('공유 상태 변경 실패');
      }
    } catch (error) {
      console.error('Toggle Error:', error);
    }
  };

  return (
    <div 
      onClick={handleToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        background: isShared ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${isShared ? 'rgba(0, 229, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s',
        color: isShared ? '#00e5ff' : 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(10px)',
        boxShadow: isShared ? '0 0 15px rgba(0, 229, 255, 0.2)' : 'none'
      }}
    >
      {isShared ? <Share2 size={16} /> : <Lock size={16} />}
      <span style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px' }}>
        {isShared ? '합동 작전 중 (SHARED)' : '개별 작전 중 (PRIVATE)'}
      </span>
      
      {/* Toggle Switch UI */}
      <div style={{
        width: '32px',
        height: '18px',
        background: isShared ? '#00e5ff' : 'rgba(255,255,255,0.1)',
        borderRadius: '20px',
        position: 'relative',
        marginLeft: '4px',
        transition: 'all 0.3s'
      }}>
        <div style={{
          width: '12px',
          height: '12px',
          background: isShared ? '#000' : 'rgba(255,255,255,0.4)',
          borderRadius: '50%',
          position: 'absolute',
          top: '3px',
          left: isShared ? '17px' : '3px',
          transition: 'all 0.3s'
        }} />
      </div>
    </div>
  );
};
