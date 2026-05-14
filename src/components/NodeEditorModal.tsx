import React, { useState, useEffect } from 'react';

export default function NodeEditorModal({ isOpen, initialData, onSave, onClose }: any) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialData) {
      setLabel(initialData.label || '');
      setDescription(initialData.description || '');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      onDoubleClick={(e) => e.stopPropagation()} 
      onClick={(e) => e.stopPropagation()}
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(6px)' }}
    >
      {/* Width 600px로 대폭 확장 */}
      <div style={{ background: '#0a0a0b', padding: '35px', borderRadius: '12px', border: '1px solid #374151', width: '600px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 10px 40px rgba(0, 229, 255, 0.15)' }}>
        <h3 style={{ margin: 0, color: '#00e5ff', letterSpacing: '2px', fontSize: '1.2rem' }}>TACTICAL NODE EDITOR</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 'bold' }}>Node Title (작전명)</label>
          <input 
            value={label} onChange={e => setLabel(e.target.value)} 
            style={{ padding: '14px', background: '#111827', color: '#fff', border: '1px solid #4b5563', borderRadius: '6px', outline: 'none', fontSize: '16px' }} 
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 'bold' }}>Details / Directives (상세 지침)</label>
          {/* rows 15로 시야 대폭 확장 */}
          <textarea 
            value={description} onChange={e => setDescription(e.target.value)} rows={15} 
            placeholder="상세 전술 지침을 입력하세요..."
            style={{ padding: '14px', background: '#111827', color: '#f3f4f6', border: '1px solid #4b5563', borderRadius: '6px', outline: 'none', resize: 'vertical', fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.5' }} 
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '15px' }}>
          <button onClick={onClose} style={{ padding: '12px 24px', background: 'transparent', color: '#9ca3af', border: '1px solid #4b5563', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>CANCEL</button>
          <button onClick={() => onSave({ label, description })} style={{ padding: '12px 24px', background: '#00e5ff', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>UPDATE NODE</button>
        </div>
      </div>
    </div>
  );
}
