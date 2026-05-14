import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useFlowStore } from '../store/useFlowStore';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Folder, FileCode, Save, Trash2, Edit2, ChevronRight, ChevronDown, 
  RefreshCw, Globe, Lock, Users, User, ShieldCheck, Plus
} from 'lucide-react';
import VaultActionModal from './VaultActionModal';
import { usePermissions } from '../logic/usePermissions';
import { TacticalIO } from './TacticalIO';

export default function Sidebar() {
  const { canEdit, canDelete, canManageVault } = usePermissions();
  const { 
    nodes, edges, snapshots, cloudDocuments, setCloudDocuments, setNodes, setEdges, setSnapshots, setSharingDoc, sharingDoc,
    applyAutoLayout, createGroupFromSelection, ungroupSelection, isTableView, setIsTableView, deleteSelected, clearAll
  } = useFlowStore();
  const { token, user } = useAuthStore();

  // --- 🚀 모바일 감지 ---
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentUserId = user?.email || 'guest';
  const [activeTab, setActiveTab] = useState<'private' | 'shared'>('private');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['Unclassified']));
  const [virtualFolders, setVirtualFolders] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);
  const [hoveredDoc, setHoveredDoc] = useState<number | null>(null);

  // 모달 컨텍스트를 useRef로 저장
  const modalRef = useRef<{ type: string; targetId: any }>({ type: '', targetId: null });

  // Modal State
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'rename-folder' | 'rename-doc' | 'delete-folder' | 'delete-doc' | 'save-plan' | 'new-folder';
    title: string;
    initialValue?: string;
    targetId?: any;
  }>({
    isOpen: false,
    type: 'rename-folder',
    title: '',
  });

  const openModal = (config: { isOpen: boolean; type: any; title: string; initialValue?: string; targetId?: any }) => {
    modalRef.current = { type: config.type, targetId: config.targetId };
    setModal(config);
  };

  const refreshArchive = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tactical-map?user_id=${currentUserId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const docs = await response.json();
        setCloudDocuments(Array.isArray(docs) ? docs : []);
      }
    } catch (error) {
      console.error('Archive Fetch Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshArchive();
    // 🔐 보안 조치: 유저가 바뀌면 세션 간 폴더 간섭을 방지하기 위해 가상 폴더 리스트 초기화
    setVirtualFolders(new Set());
  }, [token, currentUserId]);

  // 공유 모달이 닫힐 때(sharingDoc이 null이 될 때) 리스트를 최신화하여 공유 카운트 등을 반영
  useEffect(() => {
    if (!sharingDoc) {
      refreshArchive();
    }
  }, [sharingDoc]);

  const groupedDocuments = useMemo(() => {
    const groups: Record<string, any[]> = {};
    if (activeTab === 'private') {
      virtualFolders.forEach(folder => { groups[folder] = []; });
    }
    if (Array.isArray(cloudDocuments)) {
      cloudDocuments.forEach(doc => {
        const isMyDoc = doc.user_id === currentUserId;
        const isShared = doc.visibility === 'SHARED';
        const isTargeted = doc.user_id !== currentUserId && doc.visibility !== 'SHARED';
        
        let shouldInclude = false;
        if (activeTab === 'private') {
          shouldInclude = isMyDoc && !isShared;
        } else {
          shouldInclude = isShared || isTargeted;
        }

        if (shouldInclude) {
          const folder = doc.folder_name || 'Unclassified';
          if (!groups[folder]) groups[folder] = [];
          groups[folder].push(doc);
        }
      });
    }
    if (!groups['Unclassified'] && activeTab === 'private') groups['Unclassified'] = [];
    return groups;
  }, [cloudDocuments, virtualFolders, activeTab, currentUserId]);

  const toggleFolder = (folderName: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderName)) newExpanded.delete(folderName);
    else newExpanded.add(folderName);
    setExpandedFolders(newExpanded);
  };

  const onModalConfirm = async (data: any) => {
    const { type, targetId } = modalRef.current;
    setModal(prev => ({ ...prev, isOpen: false }));

    try {
      if (type === 'rename-folder') {
        const response = await fetch(`/api/tactical-map/folder`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ oldName: targetId, newName: data, user_id: currentUserId })
        });
        if (response.ok) refreshArchive();
      } else if (type === 'delete-folder') {
        const response = await fetch(`/api/tactical-map/folder/${encodeURIComponent(targetId)}?user_id=${currentUserId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) refreshArchive();
      } else if (type === 'delete-doc') {
        const response = await fetch(`/api/tactical-map/${targetId}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) refreshArchive();
      } else if (type === 'rename-doc') {
        const response = await fetch(`/api/tactical-map/${targetId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ title: data.trim() })
        });
        if (response.ok) refreshArchive();
      } else if (type === 'save-plan') {
        const response = await fetch(`/api/tactical-map`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            nodes, edges, snapshots,
            user_id: currentUserId,
            folder_name: data.folder || 'Unclassified',
            title: data.title || 'Untitled Plan'
          }),
        });
        if (response.ok) refreshArchive();
      } else if (type === 'new-folder') {
        if (!data || data.trim() === '') return;
        const newVirtuals = new Set(virtualFolders);
        newVirtuals.add(data);
        setVirtualFolders(newVirtuals);
      }
    } catch (error) {
      console.error('Action Error:', error);
    }
  };

  const loadDocument = (doc: any) => {
    setNodes(doc.nodes);
    setEdges(doc.edges);
    if (doc.snapshots) setSnapshots(doc.snapshots);
    useFlowStore.getState().setCurrentDoc({
      id: doc.id,
      visibility: doc.visibility,
      user_id: doc.user_id
    });
  };

  const handleRenameDoc = async (docId: number, currentTitle: string) => {
    const newTitle = window.prompt('새로운 이름을 입력하세요:', currentTitle);
    if (!newTitle || newTitle.trim() === '' || newTitle.trim() === currentTitle) return;
    try {
      const response = await fetch(`/api/tactical-map/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle.trim() })
      });
      if (response.ok) refreshArchive();
    } catch (error) {
      console.error('Rename Error:', error);
    }
  };

  return (
    <div style={{ 
      width: isMobile ? '100%' : '320px', 
      height: '100%', 
      background: 'rgba(10, 10, 15, 0.98)', 
      backdropFilter: 'blur(30px)', 
      borderLeft: isMobile ? 'none' : '1px solid rgba(0, 229, 255, 0.2)', 
      display: 'flex', 
      flexDirection: 'column', 
      zIndex: 100, 
      boxShadow: '-20px 0 50px rgba(0,0,0,0.8)'
    }}>
      {/* 🛠️ 모바일 전용 전술 지휘 센터 (Command Center) */}
      {isMobile && (
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '10px', color: '#00e5ff', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '1px' }}>STRATEGIC COMMANDS</div>
          
          {/* 1. 편집 명령 그룹 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '15px' }}>
            <button 
              onClick={() => { applyAutoLayout('TB'); }} 
              style={{ padding: '12px', background: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.3)', color: '#00e5ff', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}
            >
              📐 AUTO LAYOUT
            </button>
            <button 
              onClick={() => { setIsTableView(!isTableView); }} 
              style={{ padding: '12px', background: isTableView ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)', border: `1px solid ${isTableView ? '#00e5ff' : 'rgba(255, 255, 255, 0.2)'}`, color: isTableView ? '#00e5ff' : '#fff', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}
            >
              📊 {isTableView ? 'CANVAS VIEW' : 'TABLE VIEW'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
            <button 
              onClick={() => { 
                const name = window.prompt('그룹 이름을 입력하세요:', '기능 꾸러미');
                if (name) createGroupFromSelection(name);
              }} 
              style={{ padding: '12px', background: 'rgba(255, 235, 59, 0.1)', border: '1px solid #ffeb3b', color: '#ffeb3b', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}
            >
              📦 GROUP
            </button>
            <button 
              onClick={ungroupSelection} 
              style={{ padding: '12px', background: 'rgba(255, 152, 0, 0.1)', border: '1px solid #ff9800', color: '#ff9800', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}
            >
              🔓 UNGROUP
            </button>
          </div>

          <div style={{ fontSize: '10px', color: '#00e5ff', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '1px' }}>TACTICAL TOOLS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '15px' }}>
            <div className="mobile-scale"><TacticalIO /></div>
          </div>
          
          {/* 3. 파괴적 명령 (Danger Zone) */}
          <div style={{ fontSize: '10px', color: '#ff5252', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '1px', marginTop: '10px' }}>DESTRUCTIVE ACTIONS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <button 
              onClick={deleteSelected} 
              style={{ padding: '12px', background: 'rgba(255, 82, 82, 0.1)', border: '1px solid #ff5252', color: '#ff5252', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}
            >
              🗑️ DELETE
            </button>
            <button 
              onClick={() => {
                if (window.confirm('⚠️ 경고: 모든 전술 데이터가 영구 삭제됩니다. 계속하시겠습니까?')) {
                  clearAll();
                }
              }} 
              style={{ padding: '12px', background: 'rgba(255, 82, 82, 0.2)', border: '2px solid #ff5252', color: '#fff', borderRadius: '8px', fontSize: '11px', fontWeight: '900' }}
            >
              🔥 CLEAR ALL
            </button>
          </div>
          {/* INTAKE / OUTPUT은 FloatingToolbar에서 가져오거나 여기서 직접 구현할 수 있으나, 일관성을 위해 버튼 추가 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
             <button onClick={() => document.getElementById('import-trigger')?.click()} style={{ padding: '12px', background: 'rgba(0, 230, 118, 0.1)', border: '1px solid #00e676', color: '#00e676', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>📥 INTAKE</button>
             <button onClick={() => document.getElementById('export-trigger')?.click()} style={{ padding: '12px', background: 'rgba(79, 195, 247, 0.1)', border: '1px solid #4fc3f7', color: '#4fc3f7', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>📤 OUTPUT</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', margin: '15px 15px 0 15px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={() => setActiveTab('private')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', background: activeTab === 'private' ? 'rgba(0, 229, 255, 0.15)' : 'transparent', color: activeTab === 'private' ? '#00e5ff' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}><Lock size={14} /> 내 작전실</button>
        <button onClick={() => setActiveTab('shared')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', background: activeTab === 'shared' ? 'rgba(0, 229, 255, 0.15)' : 'transparent', color: activeTab === 'shared' ? '#00e5ff' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}><Globe size={14} /> 합동 작전실</button>
      </div>

      <div style={{ padding: '20px 20px 15px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ color: '#00e5ff', margin: 0, fontSize: '14px', letterSpacing: '2px', fontWeight: 900, textTransform: 'uppercase' }}>{activeTab === 'private' ? 'Personal Vault' : 'Joint Strategic Vault'}</h3>
          <button onClick={refreshArchive} style={{ background: 'transparent', border: 'none', color: '#00e5ff', cursor: 'pointer' }}><RefreshCw size={14} className={isLoading ? 'spin' : ''} /></button>
        </div>
        {activeTab === 'private' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => openModal({ isOpen: true, type: 'new-folder', title: 'Create New Folder' })} style={{ flex: 1, padding: '10px', background: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff', border: '1px solid rgba(0, 229, 255, 0.3)', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}><Plus size={14} /> NEW FOLDER</button>
            <button onClick={() => openModal({ isOpen: true, type: 'save-plan', title: 'Save Current Plan' })} style={{ flex: 1.2, padding: '10px', background: '#00e5ff', color: '#000', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '900' }}><Save size={14} /> SAVE PLAN</button>
          </div>
        )}
      </div>

      <div className="sidebar-scroll" style={{ flexGrow: 1, overflowY: 'auto', padding: '12px 10px' }}>
        <style>{` .sidebar-scroll::-webkit-scrollbar { width: 4px; } .sidebar-scroll::-webkit-scrollbar-thumb { background: #00e5ff; border-radius: 10px; } .spin { animation: rotate 1s linear infinite; } @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } `}</style>
        {Object.entries(groupedDocuments).map(([folderName, docs]) => (
          <div key={folderName} style={{ marginBottom: '6px' }} onMouseEnter={() => setHoveredFolder(folderName)} onMouseLeave={() => setHoveredFolder(null)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: expandedFolders.has(folderName) ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div onClick={() => toggleFolder(folderName)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1 }}>
                {expandedFolders.has(folderName) ? <ChevronDown size={14} color="#00e5ff" /> : <ChevronRight size={14} color="rgba(255,255,255,0.3)" />}
                <Folder size={16} color={expandedFolders.has(folderName) ? '#00e5ff' : 'rgba(255,255,255,0.3)'} />
                <span style={{ fontSize: '12px', color: expandedFolders.has(folderName) ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: 700 }}>{folderName}</span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginLeft: '4px' }}>{docs.length}</span>
              </div>
              {folderName !== 'Unclassified' && activeTab === 'private' && (
                <div style={{ display: 'flex', gap: '4px', opacity: hoveredFolder === folderName ? 1 : 0.2 }}>
                  <button onClick={(e) => { e.stopPropagation(); openModal({ isOpen: true, type: 'rename-folder', title: 'Rename Folder', targetId: folderName }); }} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)' }}><Edit2 size={12} /></button>
                  <button onClick={(e) => { e.stopPropagation(); openModal({ isOpen: true, type: 'delete-folder', title: 'Delete Folder', targetId: folderName }); }} style={{ background: 'transparent', border: 'none', color: 'rgba(255,82,82,0.5)' }}><Trash2 size={12} /></button>
                </div>
              )}
            </div>
            <div style={{ maxHeight: expandedFolders.has(folderName) ? '1000px' : '0', opacity: expandedFolders.has(folderName) ? 1 : 0, overflow: 'hidden', paddingLeft: '24px', transition: 'all 0.3s' }}>
              {docs.map(doc => (
                <div key={doc.id} onMouseEnter={() => setHoveredDoc(doc.id)} onMouseLeave={() => setHoveredDoc(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', marginBottom: '4px' }}>
                  <FileCode size={12} color="rgba(255,255,255,0.3)" />
                  <div onClick={() => loadDocument(doc)} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', cursor: 'pointer' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title}</div>
                    {activeTab === 'shared' && doc.user_id !== currentUserId && (
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}><User size={10} /> {doc.user_id}</div>
                    )}
                  </div>
                  {doc.user_id !== currentUserId && doc.visibility !== 'SHARED' && (
                    <div title="나에게 특별 공유됨" style={{ color: '#00e5ff', opacity: 0.8 }}><ShieldCheck size={12} /></div>
                  )}
                  <div style={{ display: 'flex', gap: '4px', opacity: hoveredDoc === doc.id ? 1 : 0.2 }}>
                    {doc.user_id === currentUserId && (
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button onClick={(e) => { e.stopPropagation(); setSharingDoc(doc); }} title="공유 설정 관리" style={{ background: 'transparent', border: 'none', color: doc.visibility === 'SHARED' || doc.share_count > 0 ? '#00e5ff' : 'rgba(255,255,255,0.2)' }}>
                          {doc.visibility === 'SHARED' ? <Globe size={12} /> : (doc.share_count > 0 ? <Users size={12} /> : <Lock size={12} />)}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleRenameDoc(doc.id, doc.title); }} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)' }}><Edit2 size={12} /></button>
                        <button onClick={(e) => { e.stopPropagation(); openModal({ isOpen: true, type: 'delete-doc', title: 'Delete Plan', targetId: doc.id }); }} style={{ background: 'transparent', border: 'none', color: '#ff5252' }}><Trash2 size={12} /></button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '16px 20px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#00e5ff', fontWeight: 'bold' }}>Active Units: {cloudDocuments.length}</span>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>AURA ECOSYSTEM</span>
        </div>
      </div>

      <VaultActionModal 
        isOpen={modal.isOpen} 
        mode={modal.type === 'save-plan' ? 'save' : (modal.type.includes('delete') ? 'delete' : 'update')} 
        initialValue={modal.initialValue} 
        folders={Array.from(new Set([
          ...cloudDocuments
            .filter((doc: any) => doc.user_id === currentUserId) // 본인 소유의 폴더만 추출하여 격리
            .map((doc: any) => doc.folder_name || 'Unclassified'), 
          ...Array.from(virtualFolders)
        ]))} 
        onConfirm={onModalConfirm} 
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))} 
      />
    </div>
  );
}
