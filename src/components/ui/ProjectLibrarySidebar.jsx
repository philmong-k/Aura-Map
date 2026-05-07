import React, { useState } from 'react';
import { Library, X, FilePlus, Trash2, Pencil, Cloud, CloudOff, RotateCw, Lock, LockKeyholeOpen, Layers, Pin } from 'lucide-react';
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
  const exportAllTacticalData = useStore((state) => state.exportAllTacticalData);
  const importAllTacticalData = useStore((state) => state.importAllTacticalData);
  const isBackendLinked = import.meta.env.VITE_QUARK_CORE_URL !== undefined;
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, pinned, locked
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const fullBackupInputRef = React.useRef(null);

  if (!showLibrary) return null;

  const handleFullRestore = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!confirm('경고: 통합 복구를 진행하면 기존 데이터가 덮어씌워질 수 있습니다. 계속하시겠습니까?')) {
        e.target.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          const success = importAllTacticalData(data);
          if (success) {
            alert('전술 저장소 전체 복구가 완료되었습니다!');
          }
        } catch (err) {
          alert('잘못된 백업 파일 형식입니다.');
        }
        e.target.value = '';
      };
      reader.readAsText(file);
    }
  };

  const handleRefresh = async (e) => {
    e.stopPropagation();
    setIsRefreshing(true);
    await loadFromBackend();
    setTimeout(() => setIsRefreshing(false), 800); 
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

  // 프로젝트 검색 및 [탭 필터링 + 고정 우선 + 최신순] 정렬 로직
  const filteredProjects = projectList
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (activeTab === 'pinned') return matchesSearch && p.isPinned;
      if (activeTab === 'locked') return matchesSearch && p.isLocked;
      return matchesSearch;
    })
    .sort((a, b) => {
      // 1. 고정(Pin) 우선
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // 2. 최신 수정일 우선 (날짜가 없는 경우 아주 오래전 날짜로 처리)
      const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
      const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
      return dateB - dateA;
    });

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '320px',
      height: '100%',
      zIndex: 200,
      background: 'rgba(15, 23, 42, 0.98)',
      backdropFilter: 'blur(30px)',
      borderRight: '1px solid rgba(0, 229, 255, 0.2)',
      padding: '30px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      boxShadow: '20px 0 50px rgba(0,0,0,0.7)',
      animation: 'slideIn 0.3s ease-out'
    }}>
      {/* CSS For Scrollbar and Animation */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .project-list-container::-webkit-scrollbar {
          width: 6px;
        }
        .project-list-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .project-list-container::-webkit-scrollbar-thumb {
          background: rgba(0, 229, 255, 0.3);
          border-radius: 10px;
        }
        .project-list-container::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 229, 255, 0.6);
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
        <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', fontWeight: '900' }}>
          <Library size={24} color="#00e5ff" /> 작전 저장소
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
          <button onClick={() => setShowLibrary(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', borderRadius: '50%' }}>
            <X size={20} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button 
          onClick={handleCreateNew}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #00e5ff 0%, #00b4d8 100%)',
            color: '#030712',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '900',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,229,255,0.2)',
            fontSize: '14px'
          }}
        >
          <FilePlus size={18} /> 새 프로젝트 생성
        </button>

        <button 
          onClick={() => setIsTemplateManagerOpen(true)}
          style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0, 229, 255, 0.05)', color: '#00e5ff', border: '1px solid rgba(0, 229, 255, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '700' }}
        >
          <Layers size={18} /> 데이터 템플릿 관리
        </button>
      </div>

      {/* 🔍 작전 검색 바 */}
      <div style={{ position: 'relative', marginTop: '5px' }}>
        <input 
          type="text"
          placeholder="작전명 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 15px',
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: '13px',
            outline: 'none'
          }}
        />
      </div>

      {/* 📑 전술 카테고리 탭 (모바일 최적화) */}
      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '10px', gap: '4px' }}>
        {[
          { id: 'all', name: '전체' },
          { id: 'pinned', name: '중요' },
          { id: 'locked', name: '잠금' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '8px 0',
              fontSize: '12px',
              fontWeight: '700',
              background: activeTab === tab.id ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
              color: activeTab === tab.id ? '#00e5ff' : '#64748b',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <div className="project-list-container" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '5px' }}>
        {filteredProjects.length > 0 ? (
          filteredProjects.map(proj => (
            <div 
              key={proj.id}
              onClick={() => loadProject(proj.id)}
              style={{
                padding: '16px',
                background: proj.id === currentProjectId ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${proj.id === currentProjectId ? 'rgba(0, 229, 255, 0.5)' : 'rgba(255,255,255,0.05)'}`,
                borderRadius: '14px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                position: 'relative',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: proj.id === currentProjectId ? '0 8px 20px rgba(0,229,255,0.1)' : 'none'
              }}
              onMouseOver={(e) => {
                if (proj.id !== currentProjectId) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseOut={(e) => {
                if (proj.id !== currentProjectId) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                  <span style={{ 
                    color: proj.id === currentProjectId ? '#00e5ff' : '#e2e8f0', 
                    fontWeight: '800', 
                    fontSize: '15px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {proj.name}
                  </span>
                  {proj.isLocked ? (
                    <Lock size={12} color="#fbbf24" />
                  ) : (
                    <button 
                      onClick={(e) => handleRename(e, proj.id, proj.name)}
                      style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleProjectPin(proj.id); }}
                    style={{ background: 'transparent', border: 'none', color: proj.isPinned ? '#00e5ff' : '#475569', cursor: 'pointer', padding: '0', transition: 'all 0.2s' }}
                    title={proj.isPinned ? "고정 해제" : "상단 고정"}
                  >
                    <Pin size={16} style={{ transform: proj.isPinned ? 'rotate(45deg)' : 'rotate(0deg)' }} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleProjectLock(proj.id); }}
                    style={{ background: 'transparent', border: 'none', color: proj.isLocked ? '#fbbf24' : '#475569', cursor: 'pointer', padding: '0' }}
                  >
                    {proj.isLocked ? <Lock size={16} /> : <LockKeyholeOpen size={16} />} 
                  </button>
                  {!proj.isLocked && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); if(confirm('이 작전 계획을 영구 삭제하시겠습니까?')) deleteProject(proj.id); }}
                      style={{ background: 'transparent', border: 'none', color: '#f43f5e', opacity: 0.6, cursor: 'pointer', padding: '0' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontSize: '11px', fontWeight: '500' }}>
                  {new Date(proj.lastModified).toLocaleDateString()} {new Date(proj.lastModified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {proj.isPinned && <span style={{ fontSize: '10px', color: '#00e5ff', fontWeight: '700' }}>PINNED</span>}
                  {proj.isRemote && <Cloud size={12} color="#10b981" opacity={0.7} />}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '40px 20px', fontSize: '13px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            등록된 작전 계획이 없습니다.
          </div>
        )}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', gap: '20px' }}>
         <button 
           onClick={exportAllTacticalData}
           style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline', opacity: 0.7 }}
         >
           전체 백업 (.json)
         </button>
         <button 
           onClick={() => fullBackupInputRef.current?.click()}
           style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline', opacity: 0.7 }}
         >
           전체 복구 (.json)
         </button>
         <input 
           type="file" 
           ref={fullBackupInputRef} 
           style={{ display: 'none' }} 
           onChange={handleFullRestore} 
           accept=".json" 
         />
      </div>

      {isTemplateManagerOpen && (
        <TacticalTemplateManager onClose={() => setIsTemplateManagerOpen(false)} />
      )}
    </div>
  );
};

export default ProjectLibrarySidebar;
