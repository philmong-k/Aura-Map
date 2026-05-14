import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function VaultActionModal({ isOpen, mode, initialValue, folders = [], onConfirm, onClose }: any) {
  const [value, setValue] = useState(''); // 텍스트 입력용 (이름, 타이틀)
  const [folderValue, setFolderValue] = useState(''); // 폴더 선택용 (세이브)

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue || '');
      setFolderValue('');
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const isDelete = mode === 'delete';
  const isSave = mode === 'save';

  // 모드별 다이내믹 타이틀 및 색상
  const title = isDelete ? '⚠️ DELETE CONFIRMATION' : isSave ? '💾 SAVE CURRENT PLAN' : 'RENAME ITEM';
  const titleColor = isDelete ? '#ef4444' : isSave ? '#10b981' : '#00e5ff';

  // 🛡️ 핵심: 오버레이 전체의 마우스 이벤트를 차단하여 뒤 캔버스로 투과되지 않게 함
  const blockEvents = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return createPortal(
    <div
      onMouseDown={blockEvents}
      onMouseUp={blockEvents}
      onClick={blockEvents}
      onPointerDown={blockEvents}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.80)', display: 'flex', justifyContent: 'center',
        alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(6px)',
        pointerEvents: 'auto'
      }}
    >
      <div
        onMouseDown={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d1117', padding: '30px', borderRadius: '12px',
          border: `1px solid ${isDelete ? '#ef4444' : '#374151'}`,
          width: '420px', display: 'flex', flexDirection: 'column', gap: '20px',
          boxShadow: `0 10px 40px ${isDelete ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 229, 255, 0.15)'}`
        }}
      >
        <h3 style={{ margin: 0, color: titleColor, letterSpacing: '1px', fontSize: '16px', fontWeight: 900 }}>{title}</h3>
        
        {isDelete ? (
          <p style={{ color: '#d1d5db', fontSize: '14px', lineHeight: '1.5' }}>
            정말로 <strong>{initialValue}</strong> 항목을 삭제하시겠습니까?<br/>이 작업은 되돌릴 수 없습니다.
          </p>
        ) : isSave ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              value={value} onChange={e => setValue(e.target.value)} autoFocus
              style={{ padding: '12px', background: '#161b22', color: '#fff', border: '1px solid #4b5563', borderRadius: '6px', outline: 'none', fontSize: '15px' }} 
              placeholder="작전명 (Title)을 입력하세요"
            />
            <select 
              value={folderValue} onChange={e => setFolderValue(e.target.value)}
              style={{ padding: '12px', background: '#161b22', color: '#fff', border: '1px solid #4b5563', borderRadius: '6px', outline: 'none', fontSize: '15px' }}
            >
              <option value="">저장할 폴더를 선택하세요...</option>
              {folders.map((folder: string, idx: number) => (
                <option key={idx} value={folder}>{folder}</option>
              ))}
            </select>
          </div>
        ) : (
          <input 
            value={value} onChange={e => setValue(e.target.value)} autoFocus
            style={{ padding: '12px', background: '#161b22', color: '#fff', border: '1px solid #4b5563', borderRadius: '6px', outline: 'none', fontSize: '15px' }} 
            placeholder="새로운 이름을 입력하세요"
            onKeyDown={e => { if (e.key === 'Enter') onConfirm(value); }}
          />
        )}
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onClose(); }}
            style={{ padding: '10px 20px', background: 'transparent', color: '#9ca3af', border: '1px solid #4b5563', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            CANCEL
          </button>
          <button 
            onMouseDown={e => e.stopPropagation()}
            onClick={e => {
              e.stopPropagation();
              onConfirm(isSave ? { title: value, folder: folderValue } : isDelete ? null : value);
            }}
            style={{ padding: '10px 20px', background: isDelete ? '#ef4444' : isSave ? '#10b981' : '#00e5ff', color: isDelete ? '#fff' : '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {isDelete ? 'CONFIRM DELETE' : isSave ? 'SAVE PLAN' : 'UPDATE'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
