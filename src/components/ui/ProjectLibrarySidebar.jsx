import React, { useState } from 'react';
import { Library, X, FilePlus, Trash2, Pencil, Cloud, CloudOff, RotateCw, Lock, LockKeyholeOpen, Layers, Pin, LayoutGrid } from 'lucide-react';
import useStore from '../../store/useStore';
import TacticalTemplateManager from './TacticalTemplateManager';

const ProjectLibrarySidebar = ({ showLibrary, setShowLibrary }) => {
  const projectList = useStore((state) => state.projectList);
  const currentProjectId = useStore((state) => state.currentProjectId);
  const createNewProject = useStore((state) => state.createNewProject);
  const loadProject = useStore((state) => state.loadProject);
  const deleteProject = useStore((state) => state.deleteProject);
  const renameProject = useStore((state) => state.renameProject);
  const loadFromBackend = useStore((state) => state.loadFromBackend);
  const toggleProjectLock = useStore((state) => state.toggleProjectLock);
  const toggleProjectPin = useStore((state) => state.toggleProjectPin);
  
  const isBackendLinked = import.meta.env.VITE_QUARK_CORE_URL !== undefined;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'pinned', 'locked'

  if (!showLibrary) return null;

  const handleRefresh = async (e) => {
    e.stopPropagation();
    setIsRefreshing(true);
    await loadFromBackend({ force: true });
    setTimeout(() => setIsRefreshing(false), 800); // 심미적 회전 효과
  };

  const handleCreateNew = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const defaultName = `신규 프로젝트-${dateStr} (${timeStr})`;
    
    const name = prompt('새 프로젝트의 이름을 입력하세요:', defaultName);
    if (name) createNewProject(name);
  };

  const handleRename = (e, id, currentName) => {
    e.stopPropagation();
    const newName = prompt('작전 계획의 새로운 이름을 입력하세요:', currentName);
    if (newName && newName !== currentName) {
      renameProject(id, newName);
    }
  };

  // 필터링된 목록 산출
  const filteredList = projectList.filter(proj => {
    if (filter === 'pinned') return proj.isPinned;
    if (filter === 'locked') return proj.isLocked;
    return true;
  });

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '320px',
      height: '100%',
      zIndex: 200,
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(255,255,255,0.1)',
      padding: '30px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      boxShadow: '10px 0 30px rgba(0,0,0,0.5)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Library size={22} color="#00e5ff" /> 작전 저장소
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isBackendLinked && (
            <button 
              onClick={handleRefresh}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: isRefreshing ? '#00e5ff' : '#94a3b8', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.5s ease',
                transform: isRefreshing ? 'rotate(360deg)' : 'rotate(0deg)'
              }}
              title="서버에서 정보 가져오기"
            >
              <RotateCw size={18} />
            </button>
          )}
          {isBackendLinked ? (
            <div title="백엔드 동기화 가동 중" style={{ color: '#10b981', display: 'flex', alignItems: 'center' }}>
              <Cloud size={18} />
            </div>
          ) : (
            <div title="로컬 전용 모드 (동기화 비활성)" style={{ color: '#f43f5e', display: 'flex', alignItems: 'center' }}>
              <CloudOff size={18} />
            </div>
          )}
          <button onClick={() => setShowLibrary(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>
      </div>

      <button 
        onClick={handleCreateNew}
        style={{
          width: '100%',
          padding: '12px',
          background: '#00e5ff',
          color: '#030712',
          border: 'none',
          borderRadius: '12px',
          fontWeight: '800',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          cursor: 'pointer',
          marginTop: '10px'
        }}
      >
        <FilePlus size={18} /> 새 프로젝트 생성
      </button>

      {/* [v4.6-PLATINUM] 필터 컨트롤바 */}
      <div style={{ 
        display: 'flex', 
        background: 'rgba(255,255,255,0.05)', 
        borderRadius: '10px', 
        padding: '4px',
        gap: '4px'
      }}>
        {[
          { id: 'all', icon: LayoutGrid, label: '전체' },
          { id: 'pinned', icon: Pin, label: '중요' },
          { id: 'locked', icon: Lock, label: '보호' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 0',
              border: 'none',
              borderRadius: '8px',
              background: filter === item.id ? 'rgba(0, 229, 255, 0.2)' : 'transparent',
              color: filter === item.id ? '#00e5ff' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '700',
              transition: 'all 0.2s'
            }}
          >
            <item.icon size={14} />
            {item.label}
          </button>
        ))}
      </div>

      <button 
        onClick={() => setIsTemplateManagerOpen(true)}
        style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff', border: '1px solid rgba(0, 229, 255, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '700' }}
      >
        <Layers size={18} /> 전술 데이터 템플릿 관리
      </button>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
        {filteredList.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 20px', fontSize: '13px' }}>
            해당하는 작전 계획이 없습니다.
          </div>
        ) : filteredList.map(proj => (
          <div 
            key={proj.id}
            onClick={() => loadProject(proj.id)}
            style={{
              padding: '15px',
              background: proj.id === currentProjectId ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255,255,255,0.03)',
              border: `1.5px solid ${proj.id === currentProjectId ? '#00e5ff' : 'transparent'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              position: 'relative',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                <span style={{ 
                  color: proj.id === currentProjectId ? '#00e5ff' : '#e2e8f0', 
                  fontWeight: '700', 
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {proj.name}
                </span>
                {proj.isLocked ? (
                  <span title="잠긴 작전" style={{ color: '#fbbf24', display: 'flex', alignItems: 'center' }}>
                    <Lock size={12} />
                  </span>
                ) : (
                  <button 
                    onClick={(e) => handleRename(e, proj.id, proj.name)}
                    style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}
                    title="이름 변경"
                  >
                    <Pencil size={12} />
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* [v4.6-PLATINUM] 핀 토글 버튼 */}
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleProjectPin(proj.id); }}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: proj.isPinned ? '#00e5ff' : '#64748b', 
                    cursor: 'pointer', 
                    padding: '0',
                    transform: proj.isPinned ? 'rotate(0deg)' : 'rotate(-45deg)',
                    transition: 'all 0.2s'
                  }}
                  title={proj.isPinned ? "중요 표시 해제" : "중요 표시(핀)"}
                >
                  <Pin size={16} fill={proj.isPinned ? "#00e5ff" : "transparent"} />
                </button>

                <button 
                  onClick={(e) => { e.stopPropagation(); toggleProjectLock(proj.id); }}
                  style={{ background: 'transparent', border: 'none', color: proj.isLocked ? '#fbbf24' : '#64748b', cursor: 'pointer', padding: '0' }}
                  title={proj.isLocked ? "잠금 해제" : "작전 잠금"}
                >
                  {proj.isLocked ? <Lock size={16} /> : <LockKeyholeOpen size={16} />} 
                </button>
                {!proj.isLocked && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); if(confirm('이 작전 계획을 영구 삭제하시겠습니까?')) deleteProject(proj.id); }}
                    style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '0' }}
                    title="작전 삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            <span style={{ color: '#64748b', fontSize: '10px' }}>
              최종 수정: {new Date(proj.lastModified).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      <TacticalTemplateManager isOpen={isTemplateManagerOpen} onClose={() => setIsTemplateManagerOpen(false)} />
    </div>
  );
};

export default ProjectLibrarySidebar;
