import React, { useState } from 'react';
import { useFlowStore } from '../store/useFlowStore';
import { useAuthStore } from '../store/useAuthStore';
import VaultActionModal from './VaultActionModal';
import { usePermissions } from '../logic/usePermissions';

interface FloatingToolbarProps {
  onOpenZenMode: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export default function FloatingToolbar({ onOpenZenMode, onToggleSidebar, isSidebarOpen }: FloatingToolbarProps) {
  const { canEdit: globalCanEdit } = usePermissions();
  const currentDoc = useFlowStore((state) => state.currentDoc);
  const user = useAuthStore((state) => state.user);

  // 내 문서이거나 어드민인 경우에만 편집 권한 부여
  const isOwner = currentDoc ? currentDoc.user_id === user?.email : true;
  const isAdmin = user?.role === 'admin';
  const canEdit = globalCanEdit && (isOwner || isAdmin);

  const {
    nodes,
    edges,
    importFlowData,
    getSelectedFlowData,
    createGroupFromSelection,
    ungroupSelection,
    applyAutoLayout,
    clearAll,
    deleteSelected,
    searchTerm,
    setSearchTerm,
    isTableView,
    setIsTableView,
    isSelectMode,
    setIsSelectMode
  } = useFlowStore();

  // Modal State
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'prompt' | 'confirm';
    title: string;
    message?: string;
    initialValue?: string;
    actionType?: 'import' | 'group' | 'delete-all' | 'delete-selected';
  }>({
    isOpen: false,
    type: 'prompt',
    title: '',
  });

  const handleDelete = () => {
    const hasSelected = nodes.some(n => n.selected) || edges.some(e => e.selected);

    if (!hasSelected) {
      setModal({
        isOpen: true,
        type: 'confirm',
        title: 'NO SELECTION',
        message: '삭제할 노드나 엣지를 먼저 선택해주세요.',
        actionType: 'delete-selected'
      });
      return;
    }
    deleteSelected();
  };

  const handleImport = () => {
    setModal({
      isOpen: true,
      type: 'prompt',
      title: 'IMPORT TACTICAL JSON',
      message: 'AI가 생성한 플로우차트 JSON 데이터를 입력하세요 (Clipboard Mode):',
      actionType: 'import'
    });
  };

  const handleExport = () => {
    const { json, count, isPartial } = getSelectedFlowData();
    navigator.clipboard.writeText(json).then(() => {
      setModal({
        isOpen: true,
        type: 'confirm',
        title: 'EXPORT SUCCESS',
        message: isPartial
          ? `전술 파편(노드 ${count}개)이 클립보드에 복사되었습니다.`
          : `전체 상황판 데이터(노드 ${count}개)가 클립보드에 복사되었습니다.`,
      });
    });
  };

  const handleGroup = () => {
    setModal({
      isOpen: true,
      type: 'prompt',
      title: 'CREATE NEW GROUP',
      message: '새 그룹의 이름을 입력하세요:',
      initialValue: '기능 꾸러미',
      actionType: 'group'
    });
  };

  const onModalConfirm = (data: any) => {
    const { actionType } = modal;
    setModal(prev => ({ ...prev, isOpen: false }));

    if (actionType === 'import') {
      if (data) importFlowData(data);
    } else if (actionType === 'group') {
      if (data) createGroupFromSelection(data);
    } else if (actionType === 'delete-all') {
      clearAll();
    }
  };

  const handleChangeSymbol = (type: string) => {
    const selectedNodes = nodes.filter(n => n.selected);
    if (selectedNodes.length === 0) {
      setModal({
        isOpen: true,
        type: 'confirm',
        title: 'NO SELECTION',
        message: '성격을 변경할 노드를 먼저 선택해주세요.'
      });
      return;
    }
    selectedNodes.forEach(node => {
      useFlowStore.getState().updateNodeData(node.id, { symbolType: type });
    });
  };

  // --- 🚀 모바일 감지 (768px 기준 복구) ---
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 모바일에서 사이드바(CMD)가 열려있으면 툴바를 숨겨서 시야를 확보합니다.
  if (isMobile && isSidebarOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5000 }}>
      {/* 🚀 상단 툴바 (검색 & 레이아웃) */}
      <div style={{
        position: 'absolute',
        top: isMobile ? '20px' : '80px',
        left: isMobile ? '20px' : '50%',
        transform: isMobile ? 'none' : 'translateX(-50%)',
        width: 'auto',
        padding: '0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'none'
      }}>
        <div style={{
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'center', 
          gap: isMobile ? '8px' : '6px', 
          background: 'rgba(15, 15, 20, 0.75)', 
          backdropFilter: 'blur(20px)',
          padding: isMobile ? '10px' : '6px', 
          borderRadius: '12px', 
          border: '1px solid rgba(0, 229, 255, 0.2)',
          alignItems: 'center', 
          pointerEvents: 'auto', 
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          width: isMobile ? '100%' : 'auto',
          maxWidth: isMobile ? '340px' : 'none'
        }}>
          {/* 1단: 검색창 */}
          <input
            type="text"
            placeholder="SCAN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              padding: '8px 12px', 
              borderRadius: '8px', 
              border: 'none', 
              background: 'rgba(0, 0, 0, 0.5)', 
              color: '#00e5ff', 
              outline: 'none', 
              width: isMobile ? '100%' : '180px', 
              fontSize: '12px', 
              fontWeight: 'bold' 
            }}
          />

          {/* 2단: 핵심 버튼 그룹 (모드 버튼 유지) */}
          {canEdit && (
            <div style={{ display: 'flex', gap: '6px', width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
              {!isMobile && (
                <button onClick={() => applyAutoLayout('TB')} style={{ padding: '8px 16px', cursor: 'pointer', background: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff', border: '1px solid rgba(0, 229, 255, 0.3)', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}>AUTO LAYOUT</button>
              )}
              
              <button 
                onClick={() => { setIsSelectMode(!isSelectMode); }} 
                style={{ 
                  flex: isMobile ? 1 : 'none', 
                  padding: '8px 12px', 
                  cursor: 'pointer', 
                  background: isSelectMode ? 'rgba(0, 229, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)', 
                  color: isSelectMode ? '#00e5ff' : 'rgba(255,255,255,0.4)', 
                  border: `1px solid ${isSelectMode ? '#00e5ff' : 'rgba(255,255,255,0.1)'}`, 
                  borderRadius: '8px', 
                  fontSize: '10px', 
                  fontWeight: '900',
                  boxShadow: isSelectMode ? '0 0 15px rgba(0, 229, 255, 0.4)' : 'none'
                }}
              >
                {isSelectMode ? '🎯 SELECTING' : '🎯 SELECT'}
              </button>
              
              <button 
                onClick={() => { setIsTableView(!isTableView); }} 
                style={{ flex: isMobile ? 1 : 'none', padding: '8px 12px', cursor: 'pointer', background: isTableView ? 'rgba(0, 229, 255, 0.2)' : 'rgba(0, 229, 255, 0.05)', color: '#00e5ff', border: '1px solid rgba(0, 229, 255, 0.3)', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}
              >
                {isTableView ? '📊 CANVAS' : '📊 TABLE'}
              </button>
              
              <button 
                onClick={handleGroup} 
                style={{ flex: isMobile ? 1 : 'none', padding: '8px 12px', cursor: 'pointer', background: 'rgba(255, 235, 59, 0.05)', color: '#ffeb3b', border: '1px solid rgba(255, 235, 59, 0.3)', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}
              >
                📦 GROUP
              </button>
              
              <button 
                onClick={ungroupSelection} 
                style={{ flex: isMobile ? 1 : 'none', padding: '8px 12px', cursor: 'pointer', background: 'rgba(255, 152, 0, 0.05)', color: '#ff9800', border: '1px solid rgba(255, 152, 0, 0.3)', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}
              >
                🔓 UNGROUP
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 🚀 하단 지휘 영역: PC는 플로팅 필(Pill), 모바일은 솔리드 바(Bar)로 철저히 분리 */}
      {isMobile ? (
        /* --- 📱 모바일 전용: 하단 고정 지휘 패널 (작업 영역과 물리적 분리) --- */
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          padding: '16px 12px 34px 12px', // 하단 Safe Area 고려
          background: '#0a0a0b', // 완전 불투명 솔리드 배경으로 분리감 극대화
          borderTop: '2px solid rgba(0, 229, 255, 0.3)', // 명확한 경계선
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'auto',
          zIndex: 5000,
          boxShadow: '0 -20px 40px rgba(0,0,0,0.8)'
        }}>
          {canEdit && (
             <div style={{
               display: 'flex', gap: '8px', width: '100%', justifyContent: 'center'
             }}>
               <button onClick={handleDelete} style={{ flex: 1, background: 'rgba(255, 23, 68, 0.2)', border: '1px solid #ff5252', color: '#ff5252', fontSize: '13px', fontWeight: '900', cursor: 'pointer', padding: '15px 0', borderRadius: '8px' }}>DEL</button>
               <button onClick={() => setModal({ isOpen: true, type: 'confirm', title: 'DESTRUCTION', message: '전부 삭제?', actionType: 'delete-all' })} style={{ flex: 1, background: 'rgba(255, 152, 0, 0.2)', border: '1px solid #ff9800', color: '#ff9800', fontSize: '13px', fontWeight: '900', cursor: 'pointer', padding: '15px 0', borderRadius: '8px' }}>CLEAR</button>
               <button onClick={onToggleSidebar} style={{ flex: 1.2, background: 'rgba(0, 229, 255, 0.2)', border: '2px solid #00e5ff', color: '#00e5ff', fontSize: '13px', fontWeight: '900', cursor: 'pointer', padding: '15px 0', borderRadius: '8px', boxShadow: '0 0 15px rgba(0, 229, 255, 0.2)' }}>CMD</button>
             </div>
          )}
        </div>
      ) : (
        /* --- 💻 PC 전용: 원래의 플로팅 필(Pill) 디자인 (완벽 복구) --- */
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          pointerEvents: 'none',
          width: '100%',
          maxWidth: '750px',
          zIndex: 5000
        }}>
          {/* 그룹 1: 데이터 & 뷰 (Dark) */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            pointerEvents: 'auto', 
            background: 'rgba(15, 15, 20, 0.85)', 
            padding: '8px 16px', 
            borderRadius: '20px', 
            border: '1px solid rgba(0, 229, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(15px)'
          }}>
            {canEdit && (
              <button 
                id="import-trigger"
                onClick={handleImport} 
                style={{ padding: '8px 14px', cursor: 'pointer', background: 'transparent', color: '#00e676', border: 'none', fontSize: '11px', fontWeight: '900', letterSpacing: '1px' }}
              >
                INTAKE
              </button>
            )}
            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)', alignSelf: 'center' }} />
            <button 
              id="export-trigger"
              onClick={handleExport} 
              style={{ padding: '8px 14px', cursor: 'pointer', background: 'transparent', color: '#4fc3f7', border: 'none', fontSize: '11px', fontWeight: '900', letterSpacing: '1px' }}
            >
              OUTPUT
            </button>
            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)', alignSelf: 'center' }} />
            <button onClick={onOpenZenMode} style={{ padding: '8px 14px', cursor: 'pointer', background: 'transparent', color: '#00e5ff', border: 'none', fontSize: '11px', fontWeight: '900', letterSpacing: '1px' }}>ZEN</button>
          </div>

          {/* 그룹 2: 편집 & 명령 (Red/Neon) */}
          {canEdit && (
             <div style={{
               display: 'flex', gap: '6px', pointerEvents: 'auto', background: 'rgba(255, 23, 68, 0.1)',
               padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255, 82, 82, 0.3)',
               backdropFilter: 'blur(10px)'
             }}>
               <button onClick={handleDelete} style={{ background: 'none', border: 'none', color: '#ff5252', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️ DEL</button>
               <div style={{ width: '1px', height: '12px', background: 'rgba(255,82,82,0.2)', alignSelf: 'center' }} />
               <button onClick={() => setModal({ isOpen: true, type: 'confirm', title: 'DESTRUCTION', message: '전부 삭제?', actionType: 'delete-all' })} style={{ background: 'none', border: 'none', color: '#ff9800', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>⚠️ CLEAR</button>
               <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)', alignSelf: 'center' }} />
               <button onClick={onToggleSidebar} style={{ background: 'none', border: 'none', color: '#00e5ff', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>⌨️ CMD</button>
             </div>
          )}
        </div>
      )}

      <VaultActionModal 
        isOpen={modal.isOpen}
        mode={modal.actionType === 'delete-all' ? 'delete' : 'update'}
        initialValue={modal.initialValue}
        onConfirm={onModalConfirm}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}