import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, FileText, Copy, Check, Calculator } from 'lucide-react';
import MarkdownEditor from './MarkdownEditor';
import TacticalSheet from './TacticalSheet';
import useStore from '../../store/useStore';

const NodeDetailModal = ({ isOpen, onClose, nodeId }) => {
  const nodes = useStore((state) => state.nodes);
  const projectList = useStore((state) => state.projectList);
  const currentProjectId = useStore((state) => state.currentProjectId);
  const updateNodeMemo = useStore((state) => state.updateNodeMemo);
  const updateNodeLabel = useStore((state) => state.updateNodeLabel);

  const isLocked = projectList.find(p => p.id === currentProjectId)?.isLocked;
  
  const selectedNode = nodes.find(n => n.id === nodeId);
  const [activeTab, setActiveTab] = useState('memo');
  const [label, setLabel] = useState(selectedNode?.data?.label || '');
  const [memo, setMemo] = useState(selectedNode?.data?.memo || '');
  const [copied, setCopied] = useState(false);
  const [prevNodeId, setPrevNodeId] = useState(nodeId);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (nodeId !== prevNodeId) {
    setPrevNodeId(nodeId);
    setLabel(selectedNode?.data?.label || '');
    setMemo(selectedNode?.data?.memo || '');
    setCopied(false);
    setActiveTab('memo');
  }

  const handleCopy = () => {
    const header = `[전술 거점: ${label}]\n--------------------------\n`;
    let processedMemo = memo
      .replace(/<p[^>]*>/g, '').replace(/<\/p>/g, '\n').replace(/<br\s*\/?>/g, '\n')
      .replace(/<li[^>]*>/g, '\n• ').replace(/<\/li>/g, '').replace(/<h[1-6][^>]*>/g, '\n\n').replace(/<\/h[1-6]>/g, '\n')
      .replace(/<[^>]+>/g, '');
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = processedMemo;
    const cleanText = tempDiv.textContent || tempDiv.innerText || '';
    const finalText = header + cleanText.replace(/\n{3,}/g, '\n\n').trim();
    navigator.clipboard.writeText(finalText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSave = () => {
    if (nodeId) {
      updateNodeLabel(nodeId, label);
      updateNodeMemo(nodeId, memo);
    }
    onClose();
  };

  if (!isOpen || !selectedNode) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: isMobile ? '10px' : '20px'
        }}
        onClick={onClose}
      >
        <motion.div 
          className="modal-content glass-panel"
          initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
          style={{
            background: 'rgba(15, 23, 42, 0.95)', border: '1.5px solid rgba(0, 229, 255, 0.3)', borderRadius: '24px',
            width: '100%', maxWidth: '850px', height: isMobile ? '92vh' : '85vh',
            display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ padding: isMobile ? '15px 20px' : '20px 28px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(30, 41, 59, 0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
              <div style={{ background: 'rgba(0, 229, 255, 0.1)', padding: '10px', borderRadius: '12px', color: '#00e5ff' }}>
                <FileText size={isMobile ? 20 : 24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>전술 거점 식별자</h3>
                <input 
                  value={label} onChange={(e) => setLabel(e.target.value)} disabled={isLocked}
                  style={{ margin: 0, fontSize: isMobile ? '18px' : '22px', color: isLocked ? '#94a3b8' : '#fff', background: 'transparent', border: 'none', borderBottom: isLocked ? 'none' : '2px solid rgba(0, 229, 255, 0.1)', width: '100%', fontWeight: '900', outline: 'none' }}
                />
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}>
              <X size={24} />
            </button>
          </div>

          {/* Tab Selection */}
          <div style={{ display: 'flex', padding: '0 20px', background: 'rgba(30, 41, 59, 0.3)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <button onClick={() => setActiveTab('memo')} style={{ padding: '12px 15px', background: 'transparent', border: 'none', borderBottom: `3px solid ${activeTab === 'memo' ? '#00e5ff' : 'transparent'}`, color: activeTab === 'memo' ? '#00e5ff' : '#64748b', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <FileText size={16} /> 작전 지침
            </button>
            <button onClick={() => setActiveTab('ledger')} style={{ padding: '12px 15px', background: 'transparent', border: 'none', borderBottom: `3px solid ${activeTab === 'ledger' ? '#00e5ff' : 'transparent'}`, color: activeTab === 'ledger' ? '#00e5ff' : '#64748b', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <Calculator size={16} /> 전술 장부
            </button>
          </div>

          <div style={{ flex: 1, padding: isMobile ? '15px' : '28px', overflow: 'hidden', position: 'relative' }}>
            {activeTab === 'memo' ? (
              <MarkdownEditor key={nodeId} content={memo} onChange={setMemo} readOnly={isLocked} />
            ) : (
              <TacticalSheet nodeId={nodeId} isLocked={isLocked} />
            )}
          </div>

          {/* Footer (통합 아이콘 버튼 체계) */}
          <div style={{ padding: isMobile ? '12px 20px' : '20px 28px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(30, 41, 59, 0.5)' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={handleCopy}
                title="전술 복사"
                style={{ 
                  padding: '12px 20px', borderRadius: '12px', border: `1.5px solid ${copied ? '#10b981' : 'rgba(0, 229, 255, 0.3)'}`,
                  background: copied ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 229, 255, 0.03)', color: copied ? '#10b981' : '#00e5ff', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                }}
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
                {!isMobile && (copied ? '복사 완료' : '전술 복사')}
              </button>
              <button 
                onClick={onClose}
                title={isLocked ? '닫기' : '취소'}
                style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'transparent', color: '#94a3b8', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <X size={20} />
                {!isMobile && (isLocked ? '닫기' : '취소')}
              </button>
            </div>
            {!isLocked && (
              <button 
                onClick={handleSave}
                title="데이터 보존"
                style={{ 
                  padding: '12px 24px', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, #00e5ff 0%, #00b8d4 100%)', color: '#001a1a', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(0, 229, 255, 0.2)', cursor: 'pointer'
                }}
              >
                <Save size={20} />
                {!isMobile && '데이터 보존'}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NodeDetailModal;
