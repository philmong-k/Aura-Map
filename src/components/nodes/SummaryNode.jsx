import React, { useMemo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ChevronUp, ChevronDown, LayoutDashboard, BarChart3, Users, Box } from 'lucide-react';
import useStore from '../../store/useStore';
import { formatValue, evaluateFormula } from '../../utils/tacticalEngine';

const SummaryNode = ({ id, data, selected }) => {
  const nodes = useStore((state) => state.nodes);
  const [isCollapsed, setIsCollapsed] = useState(data.collapsed || false);
  const [collapsedGroups, setCollapsedGroups] = useState({}); // 대시보드 내 그룹별 접힘 상태
  
  // 캔버스 내 모든 데이터를 계층 구조(그룹별)로 집계
  const summaryData = useMemo(() => {
    let totalAmount = 0;
    const groupMap = {}; // groupId -> { label, total, nodes: [] }
    const ungrouped = { label: '미분류 거점', total: 0, nodes: [] };

    // 1. 그룹 정보 선수집
    const groups = nodes.filter(n => n.type === 'auraGroup');
    groups.forEach(g => {
      groupMap[g.id] = { label: g.data.label || 'TACTICAL SECTOR', total: 0, nodes: [] };
    });

    // 2. 노드 데이터 집계 및 그룹 매핑
    nodes.forEach(node => {
      if (node.type === 'tactical' && node.data?.sheet?.rows && node.data.sheet.rows.length > 0) {
        const columns = node.data.sheet.columns || [];
        const rows = node.data.sheet.rows || [];

        const targetCol = columns.find(c => 
          (c.type === 'formula' || c.type === 'number') && 
          (c.id === 'c4' || c.name.includes('계') || c.name.includes('합') || c.name.includes('소계'))
        );

        const nodeTotal = rows.reduce((acc, row) => {
          if (targetCol) {
            if (targetCol.type === 'formula') {
              return acc + (evaluateFormula(targetCol.formula, row, columns) || 0);
            } else {
              return acc + (parseFloat(row[targetCol.id]) || 0);
            }
          }
          return acc + columns.reduce((rSum, col) => {
            if (col.type === 'number') return rSum + (parseFloat(row[col.id]) || 0);
            return rSum;
          }, 0);
        }, 0);
        
        if (nodeTotal > 0) {
          const nodeInfo = { id: node.id, label: node.data.label || '알 수 없는 거점', total: nodeTotal };
          totalAmount += nodeTotal;

          if (node.parentId && groupMap[node.parentId]) {
            groupMap[node.parentId].nodes.push(nodeInfo);
            groupMap[node.parentId].total += nodeTotal;
          } else {
            ungrouped.nodes.push(nodeInfo);
            ungrouped.total += nodeTotal;
          }
        }
      }
    });

    // 결과 정제 (합계가 있는 그룹만 추출)
    const activeGroups = Object.entries(groupMap)
      .filter(([_, g]) => g.total > 0)
      .map(([id, g]) => ({ id, ...g }));
    
    activeGroups.sort((a, b) => b.total - a.total);
    ungrouped.nodes.sort((a, b) => b.total - a.total);

    return { totalAmount, groups: activeGroups, ungrouped };
  }, [nodes]);

  const toggleCollapse = (e) => {
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };

  const toggleGroupInternal = (e, groupId) => {
    e.stopPropagation();
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  return (
    <div className={`summary-node-container ${selected ? 'selected' : ''} ${isCollapsed ? 'collapsed' : ''}`} style={{
      padding: '15px',
      borderRadius: '20px',
      background: 'rgba(15, 23, 42, 0.98)',
      border: `2px solid ${selected ? '#00e5ff' : 'rgba(0, 229, 255, 0.3)'}`,
      color: '#fff',
      width: '350px',
      boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
      backdropFilter: 'blur(30px)',
      fontFamily: 'Inter, sans-serif',
      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      overflow: 'hidden'
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#00e5ff' }} />
      
      {/* 헤더 섹션 */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: isCollapsed ? '0' : '15px',
        borderBottom: isCollapsed ? 'none' : '1px solid rgba(255,255,255,0.1)',
        paddingBottom: isCollapsed ? '0' : '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LayoutDashboard size={18} color="#00e5ff" />
          <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#00e5ff', letterSpacing: '1.5px' }}>STRATEGIC MONITOR</h3>
        </div>
        <button onClick={toggleCollapse} className="nodrag" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {/* 총계 섹션 */}
      <div style={{ 
        marginBottom: isCollapsed ? '0' : '20px',
        display: 'flex', flexDirection: isCollapsed ? 'row' : 'column',
        justifyContent: isCollapsed ? 'space-between' : 'flex-start',
        alignItems: isCollapsed ? 'center' : 'flex-start'
      }}>
        <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800', opacity: 0.7 }}>TOTAL AGGREGATE</div>
        <div style={{ 
          fontSize: isCollapsed ? '16px' : '32px', fontWeight: '950', color: '#fff', 
          fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 20px rgba(0, 229, 255, 0.4)'
        }}>
          {formatValue(summaryData.totalAmount)}
        </div>
      </div>

      {/* 계층적 데이터 리스트 */}
      {!isCollapsed && (
        <div style={{ 
          maxHeight: '350px', overflowY: 'auto', paddingRight: '4px',
          display: 'flex', flexDirection: 'column', gap: '12px'
        }} className="nodrag nopan dashboard-scroll">
          
          {/* 1. 그룹별 섹션 */}
          {summaryData.groups.map(group => (
            <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div 
                onClick={(e) => toggleGroupInternal(e, group.id)}
                style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '8px 12px', background: 'rgba(0, 229, 255, 0.1)', borderRadius: '8px',
                  cursor: 'pointer', border: '1px solid rgba(0, 229, 255, 0.2)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={14} color="#00e5ff" />
                  <span style={{ fontSize: '11px', fontWeight: '900', color: '#00e5ff' }}>{group.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800' }}>{formatValue(group.total)}</span>
                  {collapsedGroups[group.id] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </div>
              </div>
              
              {!collapsedGroups[group.id] && (
                <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                  {group.nodes.map(node => (
                    <div key={node.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '11px' }}>
                      <span style={{ color: '#94a3b8' }}>{node.label}</span>
                      <span style={{ color: '#fff', fontWeight: '700' }}>{formatValue(node.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* 2. 미분류 노드 섹션 */}
          {summaryData.ungrouped.nodes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div 
                onClick={(e) => toggleGroupInternal(e, 'ungrouped')}
                style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '8px 12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px',
                  cursor: 'pointer', border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Box size={14} color="#94a3b8" />
                  <span style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8' }}>{summaryData.ungrouped.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800' }}>{formatValue(summaryData.ungrouped.total)}</span>
                  {collapsedGroups['ungrouped'] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </div>
              </div>
              
              {!collapsedGroups['ungrouped'] && (
                <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                  {summaryData.ungrouped.nodes.map(node => (
                    <div key={node.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '11px' }}>
                      <span style={{ color: '#94a3b8' }}>{node.label}</span>
                      <span style={{ color: '#fff', fontWeight: '700' }}>{formatValue(node.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {summaryData.groups.length === 0 && summaryData.ungrouped.nodes.length === 0 && (
            <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
              집계할 데이터가 없습니다.
            </div>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: '#00e5ff' }} />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .summary-node-container.selected {
          border-color: #00e5ff !important;
          box-shadow: 0 0 50px rgba(0, 229, 255, 0.4) !important;
        }
        .dashboard-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .dashboard-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .dashboard-scroll::-webkit-scrollbar-thumb {
          background: rgba(0, 229, 255, 0.3);
          border-radius: 10px;
        }
      `}} />
    </div>
  );
};

export default SummaryNode;
