import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Save, Trash2, Database, List } from 'lucide-react';
import useStore from '../../store/useStore';

const TacticalTemplateManager = ({ isOpen, onClose }) => {
  const tacticalTemplates = useStore((state) => state.tacticalTemplates);
  const addTemplate = useStore((state) => state.addTemplate);
  const updateTemplate = useStore((state) => state.updateTemplate);
  const deleteTemplate = useStore((state) => state.deleteTemplate);

  const [isAdding, setIsAdding] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', options: '' });
  const [editingId, setEditingId] = useState(null);

  const handleAdd = () => {
    if (!newTemplate.name || !newTemplate.options) return;
    addTemplate(newTemplate.name, newTemplate.options);
    setNewTemplate({ name: '', options: '' });
    setIsAdding(false);
  };

  const handleSaveEdit = (id, name, options) => {
    updateTemplate(id, name, options);
    setEditingId(null);
  };

  // 부모(ProjectLibrarySidebar)에서 이미 조건부 렌더링을 제어하므로 내부 체크 불필요

  return (
    <div 
      style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ width: '90%', maxWidth: '600px', maxHeight: '80vh', background: '#0f172a', border: '1.5px solid #00e5ff', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={20} style={{ color: '#00e5ff' }} />
            <h2 style={{ margin: 0, fontSize: '18px', color: '#fff', fontWeight: '800' }}>전술 데이터 템플릿 관리</h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <button 
            onClick={() => setIsAdding(true)}
            style={{ padding: '12px', borderRadius: '12px', border: '1px dashed #00e5ff', background: 'rgba(0,229,255,0.05)', color: '#00e5ff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '700' }}
          >
            <Plus size={18} /> 새 템플릿 정의
          </button>

          {isAdding && (
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid #00e5ff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input placeholder="템플릿 이름 (예: 진행 상태)" value={newTemplate.name} onChange={e => setNewTemplate({...newTemplate, name: e.target.value})} style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #334155', color: '#fff', padding: '8px', outline: 'none' }} />
              <input placeholder="옵션 목록 (쉼표로 구분: 준비,진행,완료)" value={newTemplate.options} onChange={e => setNewTemplate({...newTemplate, options: e.target.value})} style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #334155', color: '#94a3b8', padding: '8px', outline: 'none', fontSize: '13px' }} />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setIsAdding(false)} style={{ padding: '6px 12px', color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer' }}>취소</button>
                <button onClick={handleAdd} style={{ padding: '6px 16px', borderRadius: '8px', background: '#00e5ff', color: '#030712', fontWeight: '800', border: 'none', cursor: 'pointer' }}>저장</button>
              </div>
            </div>
          )}

          {tacticalTemplates.map(template => (
            <div key={template.id} style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <List size={16} style={{ color: '#00e5ff' }} />
                  <span style={{ fontWeight: '700', color: '#fff' }}>{template.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => deleteTemplate(template.id)} style={{ background: 'transparent', border: 'none', color: '#334155', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px', wordBreak: 'break-all' }}>
                {template.options}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#475569', fontSize: '11px' }}>
          지능형 팁: 여기서 정의된 템플릿은 모든 노드의 '전술 시트' 설정에서 즉시 호출할 수 있습니다.
        </div>
      </motion.div>
    </div>
  );
};

export default TacticalTemplateManager;
