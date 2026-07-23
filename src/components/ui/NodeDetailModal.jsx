import React, { useState, useEffect } from 'react';
import { X, FileText, Layout, Save, Clipboard, Trash2, Maximize2, Minimize2, Table, Image as ImageIcon, Upload, Camera } from 'lucide-react';
import useStore from '../../store/useStore';
import TacticalSheet from './TacticalSheet';
import './UIControls.css';

// 🎨 v4.6-PLATINUM: 최신 통합 전술 모달 (4-Tab 시스템 확장본)
const NodeDetailModal = () => {
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  const nodes = useStore((state) => state.nodes);
  const updateNodeData = useStore((state) => state.updateNodeData);
  const closeNodeDetail = useStore((state) => state.closeNodeDetail);
  
  const node = nodes.find((n) => n.id === selectedNodeId);
  
  // 4-Tab 시스템 핵심 상태 (Note / Hybrid / Ledger / Gallery)
  const [activeTab, setActiveTab] = useState(node?.data?.preferredView || 'hybrid'); 
  const [label, setLabel] = useState(node?.data?.label || '');
  const [memo, setMemo] = useState(node?.data?.memo || '');
  const [gallery, setGallery] = useState(node?.data?.gallery || []);
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  // 🛸 지니어스 엔진: 외부 동기화(장부 자동 저장 등)로 인한 로컬 편집 데이터 유실 방지 (Isolation)
  useEffect(() => {
    if (node) {
      setLabel(node.data.label || '');
      setMemo(node.data.memo || '');
      setGallery(node.data.gallery || []);
      
      // 그룹 노드일 경우 무조건 노트 모드로 고정, 아닐 경우 선호 뷰 적용
      if (node.type === 'auraGroup') {
        setActiveTab('note');
      } else if (node.data.preferredView) {
        setActiveTab(node.data.preferredView);
      }
    }
  }, [selectedNodeId]); 

  if (!node) return null;

  const handleSave = () => {
    updateNodeData(node.id, { 
      label,
      memo,
      gallery,
      preferredView: activeTab 
    });
    closeNodeDetail();
  };

  const handleCopyText = () => {
    const plainText = memo.replace(/<[^>]*>/g, '');
    navigator.clipboard.writeText(`[노드: ${label}]\n--------------------------\n${plainText}`);
    alert('내용이 클립보드에 복사되었습니다.');
  };

  // 🖼️ 이미지 업로드 핸들러 (지능형 압축 적용)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 등록 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1200;
        
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setGallery(prev => [...prev, compressedDataUrl]);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removeGalleryImage = (index) => {
    if (confirm('이 이미지를 삭제하시겠습니까?')) {
      setGallery(prev => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="node-modal-overlay" onClick={closeNodeDetail}>
      <div 
        className={`node-modal-content glass-panel ${isFullWidth ? 'full-width' : ''}`} 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: isFullWidth ? '95%' : '850px',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1.5px solid rgba(0, 229, 255, 0.3)',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 229, 255, 0.1)'
        }}
      >
        {/* 상단 헤더 영역 */}
        <div className="modal-header" style={{
          padding: '15px 25px',
          background: 'rgba(15, 23, 42, 0.8)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div style={{ 
              width: '10px', height: '10px', borderRadius: '50%', 
              background: '#00e5ff', boxShadow: '0 0 10px #00e5ff' 
            }} />
            <input 
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="거점 명칭을 입력하십시오..."
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(0, 229, 255, 0.3)',
                color: '#fff',
                fontSize: '20px',
                fontWeight: '900',
                outline: 'none',
                width: '70%',
                padding: '2px 5px'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
             <button onClick={() => setIsFullWidth(!isFullWidth)} className="icon-button-v2">
               {isFullWidth ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
             </button>
             <button onClick={closeNodeDetail} className="icon-button-v2 close">
               <X size={20} />
             </button>
          </div>
        </div>

        {/* 탭 네비게이션 (4-Tab 확장 엔진) */}
        {node.type !== 'auraGroup' && (
          <div className="modal-tabs" style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.4)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            padding: '0 15px'
          }}>
            {[
              { id: 'note', icon: <FileText size={16} />, label: '노트' },
              { id: 'hybrid', icon: <Layout size={16} />, label: '노트+장부' },
              { id: 'ledger', icon: <Table size={16} />, label: '장부' },
              { id: 'gallery', icon: <ImageIcon size={16} />, label: '갤러리' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 20px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `3px solid ${activeTab === tab.id ? '#00e5ff' : 'transparent'}`,
                  color: activeTab === tab.id ? '#00e5ff' : '#64748b',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* 컨텐츠 영역 (탭에 따른 동적 레이아웃) */}
        <div className="modal-body" style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: activeTab === 'hybrid' ? 'column' : 'row',
          background: 'rgba(2, 6, 23, 0.3)'
        }}>
          {/* [갤러리 모드] - 별도 레이아웃 */}
          {activeTab === 'gallery' ? (
            <div style={{ flex: 1, padding: '25px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8' }}>거점 시각적 자산 (MACRO GALLERY)</span>
                <label style={{ 
                  padding: '8px 16px', background: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff', 
                  borderRadius: '8px', border: '1px solid #00e5ff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700'
                }}>
                  <Upload size={14} /> 이미지 업로드
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                </label>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                gap: '15px' 
              }}>
                {gallery.length > 0 ? gallery.map((img, idx) => (
                  <div key={idx} style={{ 
                    position: 'relative', borderRadius: '12px', overflow: 'hidden', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', aspectRatio: '4/3',
                    background: 'rgba(0,0,0,0.3)'
                  }}>
                    <img 
                      src={img} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} 
                      onClick={() => setZoomedImage(img)}
                    />
                    <button 
                      onClick={() => removeGalleryImage(idx)}
                      style={{ 
                        position: 'absolute', top: '8px', right: '8px', 
                        background: 'rgba(239, 68, 68, 0.8)', color: '#fff', 
                        border: 'none', borderRadius: '50%', width: '24px', height: '24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )) : (
                  <div style={{ 
                    gridColumn: '1 / -1', height: '200px', display: 'flex', flexDirection: 'column', 
                    alignItems: 'center', justifyContent: 'center', color: '#475569', gap: '10px',
                    border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px'
                  }}>
                    <Camera size={40} opacity={0.2} />
                    <span style={{ fontSize: '13px' }}>등록된 시각적 자산이 없습니다.</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* [노트 영역] - Note 전용 또는 Hybrid 모드일 때 표시 */}
              {(activeTab === 'note' || activeTab === 'hybrid') && (
                <div style={{ 
                  flex: activeTab === 'hybrid' ? '0 0 40%' : '1', 
                  padding: '20px',
                  borderBottom: activeTab === 'hybrid' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8' }}>메모</span>
                  </div>
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="메모를 입력하세요..."
                    style={{
                      flex: 1,
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                      padding: '15px',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      resize: 'none',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              )}

              {/* [장부 영역] - Ledger 전용 또는 Hybrid 모드일 때 표시 */}
              {(activeTab === 'ledger' || activeTab === 'hybrid') && (
                <div style={{ 
                  flex: activeTab === 'hybrid' ? '0 0 60%' : '1',
                  padding: '20px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#00e5ff' }}>데이터 장부</span>
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden', borderRadius: '8px', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
                    <TacticalSheet nodeId={node.id} isLocked={false} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 하단 액션 바 */}
        <div className="modal-footer" style={{
          padding: '15px 25px',
          background: 'rgba(15, 23, 42, 0.9)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleCopyText} className="footer-button secondary">
              <Clipboard size={16} /> 복사
            </button>
            <button className="footer-button danger">
              <Trash2 size={16} /> 초기화
            </button>
          </div>
          
          <button onClick={handleSave} className="footer-button primary">
            <Save size={16} /> 저장 및 닫기
          </button>
        </div>

        {/* 🖼️ 이미지 확대 프리뷰 */}
        {zoomedImage && (
          <div 
            style={{ 
              position: 'fixed', inset: 0, zIndex: 10000, 
              background: 'rgba(0,0,0,0.95)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' 
            }}
            onClick={() => setZoomedImage(null)}
          >
            <img 
              src={zoomedImage} 
              style={{ maxWidth: '95%', maxHeight: '95%', borderRadius: '12px', boxShadow: '0 0 50px rgba(0,229,255,0.3)' }} 
            />
            <button 
              onClick={() => setZoomedImage(null)}
              style={{ position: 'absolute', top: '30px', right: '30px', background: '#00e5ff', border: 'none', borderRadius: '50%', padding: '10px', cursor: 'pointer' }}
            >
              <X size={32} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeDetailModal;
