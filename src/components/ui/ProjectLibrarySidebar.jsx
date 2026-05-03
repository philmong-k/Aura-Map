import React from 'react';
import { Library, X, FilePlus, Trash2 } from 'lucide-react';
import useStore from '../../store/useStore';

const ProjectLibrarySidebar = ({ showLibrary, setShowLibrary }) => {
  const { projectList, currentProjectId, createNewProject, loadProject, deleteProject } = useStore();

  if (!showLibrary) return null;

  const handleCreateNew = () => {
    const name = prompt('새 작전 계획의 이름을 입력하세요:', '신규 작전-' + new Date().toLocaleDateString());
    if (name) createNewProject(name);
  };

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
          <Library size={22} color="#00e5ff" /> 전술 아카이브
        </h3>
        <button onClick={() => setShowLibrary(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
          <X size={22} />
        </button>
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
        <FilePlus size={18} /> 새 작전 수립
      </button>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
        {projectList.map(proj => (
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
              <span style={{ color: proj.id === currentProjectId ? '#00e5ff' : '#e2e8f0', fontWeight: '700', fontSize: '14px' }}>
                {proj.name}
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); if(confirm('이 작전 계획을 영구 삭제하시겠습니까?')) deleteProject(proj.id); }}
                style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '0' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <span style={{ color: '#64748b', fontSize: '10px' }}>
              최종 수정: {new Date(proj.lastModified).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectLibrarySidebar;
