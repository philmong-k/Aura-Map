import React, { useState, useMemo } from 'react';
import { useFlowStore } from '../store/useFlowStore';
import { 
  FileText, Copy, Edit3, PlusCircle, Trash2, ChevronRight, Split, MoreHorizontal, Link, X
} from 'lucide-react';
import NodeEditorModal from './NodeEditorModal';

export default function StrategicOutlineView() {
  const { nodes, edges, updateNodeData, addConnectedNode, addBranchingNodes, deleteNodeById } = useFlowStore();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  
  // 🚀 아코디언 상태 관리 (접힌 노드 ID 저장)
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  
  // 🚀 집결(Link) 모드 상태 관리
  const [linkingSourceId, setLinkingSourceId] = useState<string | null>(null);

  const toggleCollapse = (id: string) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // --- 🚀 전술 계층 구조 생성 엔진 ---
  const tacticalHierarchy = useMemo(() => {
    const visited = new Set<string>();
    const hierarchy: any[] = [];
    const targetNodeIds = new Set(edges.map(e => e.target));
    const entryNodes = nodes.filter(n => n.type !== 'group' && !targetNodeIds.has(n.id));

    const buildTree = (node: any, level: number, prefix: string): any => {
      if (visited.has(node.id)) return null; 
      visited.add(node.id);
      const childrenEdges = edges.filter(e => e.source === node.id);
      const children = childrenEdges.map((edge, idx) => {
        const targetNode = nodes.find(n => n.id === edge.target);
        if (!targetNode) return null;
        const nextLevel = targetNode.data?.isSubTask ? level + 1 : level;
        return buildTree(targetNode, nextLevel, `${prefix}${idx + 1}.`);
      }).filter(Boolean);

      return { ...node, level, children, edgeLabel: edges.find(e => e.target === node.id)?.label };
    };

    entryNodes.forEach((node, idx) => {
      const tree = buildTree(node, 0, `${idx + 1}.`);
      if (tree) hierarchy.push(tree);
    });

    nodes.filter(n => n.type !== 'group' && !visited.has(n.id)).forEach((node, idx) => {
      hierarchy.push({ ...node, level: 0, prefix: `U${idx + 1}.`, children: [] });
    });

    return hierarchy;
  }, [nodes, edges]);

  const handleCopy = () => {
    let md = "# STRATEGIC TACTICAL OUTLINE\n\n";
    const flatten = (items: any[]) => {
      items.forEach(item => {
        const indent = "  ".repeat(item.level);
        md += `${indent}• ${item.data.label}${item.edgeLabel ? ` (${item.edgeLabel})` : ""}\n`;
        if (item.children) flatten(item.children);
      });
    };
    flatten(tacticalHierarchy);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (newData: any) => {
    if (selectedNode) {
      updateNodeData(selectedNode.id, newData);
      setIsEditorOpen(false);
      setSelectedNode(null);
    }
  };

  const isMobile = window.innerWidth <= 1024;

  return (
    <div className="strategic-outline-container" style={{
      width: '100%', 
      height: '100%', 
      backgroundColor: '#0a0a0b', color: '#e2e8f0',
      overflowY: 'auto', 
      padding: isMobile ? '16px' : '40px', 
      paddingTop: '20px',
      paddingBottom: '450px', 
      fontFamily: '"Pretendard", "Inter", sans-serif',
      WebkitOverflowScrolling: 'touch'
    }}>
      <style>{`
        .strategic-outline-container::-webkit-scrollbar { width: 6px; }
        .strategic-outline-container::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .strategic-outline-container::-webkit-scrollbar-thumb { background: #00e5ff; border-radius: 10px; box-shadow: 0 0 10px #00e5ff; }
      `}</style>

      {/* 🚀 전술 지휘 헤더 (정화 버전) */}
      <div style={{ 
        marginBottom: '20px', borderBottom: '1px solid rgba(0, 229, 255, 0.2)', paddingBottom: '15px' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#00e5ff' }}>
            <FileText size={20} />
            <h2 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.2rem', letterSpacing: '1.5px', fontWeight: 900 }}>STRATEGIC OUTLINE</h2>
          </div>
          <button 
            onClick={handleCopy}
            style={{
              background: copied ? 'rgba(0, 230, 118, 0.2)' : 'rgba(0, 229, 255, 0.1)',
              border: `1px solid ${copied ? '#00e676' : '#00e5ff'}`, color: copied ? '#00e676' : '#00e5ff',
              padding: '8px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold'
            }}
          >
            {copied ? 'DONE' : 'EXPORT'}
          </button>
        </div>

        <div style={{ position: 'relative', width: '100%' }}>
          <input 
            type="text" placeholder="SCAN TACTICAL FLOW..."
            style={{
              width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,229,255,0.1)',
              borderRadius: '8px', padding: '10px 15px', color: '#00e5ff', fontSize: '12px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* 🚀 조준 모드 안내 배너 */}
      {linkingSourceId && (
        <div style={{
          position: 'sticky', top: '0', zIndex: 100, background: '#a855f7', color: '#fff',
          padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 'bold' }}>
            <Link size={18} /> 집결할 대상 노드를 선택하세요
          </div>
          <button onClick={() => setLinkingSourceId(null)} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: '4px' }}>취소</button>
        </div>
      )}

      {/* List Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {tacticalHierarchy.map((item, idx) => (
          <OutlineItem 
            key={`${item.id}-${idx}`} item={item} 
            onEdit={(n: any) => { setSelectedNode(n); setIsEditorOpen(true); }}
            onAddNext={(id: string) => addConnectedNode(id, false)}
            onAddBranch={(id: string) => addBranchingNodes(id)}
            onDelete={(id: string) => { if(window.confirm('삭제하시겠습니까?')) deleteNodeById(id); }}
            collapsedNodes={collapsedNodes}
            onToggleCollapse={toggleCollapse}
            linkingSourceId={linkingSourceId}
            onStartLinking={(id: string) => setLinkingSourceId(id)}
            onCompleteLinking={(targetId: string) => {
              if (linkingSourceId) {
                useFlowStore.getState().linkNodes(linkingSourceId, targetId);
                setLinkingSourceId(null);
              }
            }}
          />
        ))}
        {/* 🚀 지휘 바와의 분리를 위한 하단 물리적 여유 공간 (노드 약 3개 분량) */}
        <div style={{ height: isMobile ? '400px' : '200px', width: '100%' }} />
      </div>

      <NodeEditorModal 
        isOpen={isEditorOpen} initialData={selectedNode?.data} 
        onSave={handleSave} onClose={() => { setIsEditorOpen(false); setSelectedNode(null); }} 
      />
    </div>
  );
}

function OutlineItem({ 
  item, onEdit, onAddNext, onAddBranch, onDelete, 
  collapsedNodes, onToggleCollapse, linkingSourceId, onStartLinking, onCompleteLinking 
}: any) {
  const isMobile = window.innerWidth <= 1024;
  const indentSize = isMobile ? 14 : 28;
  const isBranchNode = item.data?.isBranch === true;
  const hasChildren = item.children && item.children.length > 0;
  const isSelfCollapsed = collapsedNodes.has(item.id);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isTargetMode = !!linkingSourceId;
  const isSourceNode = linkingSourceId === item.id;

  return (
    <>
      <div style={{ 
        marginLeft: `${item.level * indentSize}px`, 
        position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' 
      }}>
        {item.level > 0 && (
          <div style={{
            position: 'absolute', left: isMobile ? '-10px' : '-16px', top: '-10px', bottom: '30px',
            width: isMobile ? '10px' : '16px', borderLeft: '1px solid rgba(0, 229, 255, 0.3)', 
            borderBottom: '1px solid rgba(0, 229, 255, 0.3)', borderBottomLeftRadius: '6px'
          }} />
        )}
        
        <div 
          onClick={() => {
            if (isTargetMode) {
              if (!isSourceNode) onCompleteLinking(item.id);
            } else {
              onEdit(item);
            }
          }}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px',
            borderRadius: '12px', 
            background: isSourceNode ? 'rgba(168, 85, 247, 0.2)' : (isTargetMode ? 'rgba(168, 85, 247, 0.05)' : (isBranchNode ? 'rgba(255, 152, 0, 0.05)' : 'rgba(255,255,255,0.03)')),
            border: `1px solid ${isSourceNode ? '#a855f7' : (isTargetMode ? 'rgba(168, 85, 247, 0.4)' : (isBranchNode ? 'rgba(255, 152, 0, 0.4)' : 'rgba(255,255,255,0.06)'))}`,
            cursor: 'pointer', transition: 'all 0.3s',
            boxShadow: isSourceNode ? '0 0 20px rgba(168, 85, 247, 0.3)' : 'none',
            animation: isTargetMode && !isSourceNode ? 'pulse-link 2s infinite' : 'none'
          }}
        >
          <style>{`
            @keyframes pulse-link {
              0% { border-color: rgba(168, 85, 247, 0.4); }
              50% { border-color: rgba(168, 85, 247, 0.8); box-shadow: 0 0 10px rgba(168, 85, 247, 0.2); }
              100% { border-color: rgba(168, 85, 247, 0.4); }
            }
          `}</style>

          {hasChildren && !isTargetMode && (
            <div 
              onClick={(e) => { e.stopPropagation(); onToggleCollapse(item.id); }}
              style={{ padding: '4px', cursor: 'pointer' }}
            >
              <ChevronRight 
                size={16} 
                color="#00e5ff" 
                style={{ 
                  transform: isSelfCollapsed ? 'rotate(0deg)' : 'rotate(90deg)', 
                  transition: 'transform 0.2s',
                  filter: 'drop-shadow(0 0 5px #00e5ff)'
                }} 
              />
            </div>
          )}

          {isTargetMode && !isSourceNode && <Link size={14} color="#a855f7" style={{ marginRight: '4px' }} />}

          <div style={{ 
            width: '8px', height: '8px', borderRadius: '50%', 
            background: isSourceNode ? '#a855f7' : (isBranchNode ? '#ff9800' : '#00e5ff'), 
            boxShadow: `0 0 10px ${isSourceNode ? '#a855f7' : (isBranchNode ? '#ff9800' : '#00e5ff')}`,
            flexShrink: 0
          }} />
          <div style={{ flex: 1 }}>
            <span style={{ 
              fontSize: '15px', fontWeight: 'bold', 
              color: isSourceNode ? '#a855f7' : (isBranchNode ? '#ff9800' : '#fff') 
            }}>
              {item.data.label}
            </span>
          </div>
          {isBranchNode && !isTargetMode && <Split size={14} color="#ff9800" />}
        </div>

        {!isTargetMode && (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '4px', position: 'relative' }}>
             <button onClick={(e) => { e.stopPropagation(); onAddNext(item.id); }} style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PlusCircle size={20} /></button>
             <div style={{ position: 'relative' }}>
               <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MoreHorizontal size={20} /></button>
               {isMenuOpen && (
                 <div style={{ position: 'absolute', top: '42px', right: 0, zIndex: 1000, background: '#1a1a1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '6px', width: '140px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                   <button onClick={(e) => { e.stopPropagation(); onAddBranch(item.id); setIsMenuOpen(false); }} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: '#ff9800', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}><Split size={14} /> 분기 생성</button>
                   <button onClick={(e) => { e.stopPropagation(); onStartLinking(item.id); setIsMenuOpen(false); }} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: '#a855f7', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}><Link size={14} /> 대상 연결</button>
                   <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                   <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); setIsMenuOpen(false); }} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: '#ff5252', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}><Trash2 size={14} /> 삭제</button>
                 </div>
               )}
             </div>
          </div>
        )}
      </div>

      {!isSelfCollapsed && !isTargetMode && item.children?.map((child: any, idx: number) => (
        <OutlineItem 
          key={`${child.id}-${idx}`} item={child} onEdit={onEdit} 
          onAddNext={onAddNext} onAddBranch={onAddBranch} onDelete={onDelete} 
          collapsedNodes={collapsedNodes} onToggleCollapse={onToggleCollapse}
          linkingSourceId={linkingSourceId} onStartLinking={onStartLinking} onCompleteLinking={onCompleteLinking}
        />
      ))}
    </>
  );
}
