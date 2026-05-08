import React, { useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { BarChart3, TrendingUp, CheckCircle2, Circle } from 'lucide-react';
import useStore from '../store/useStore';

const SummaryNode = ({ id, data, selected }) => {
  const nodes = useStore((state) => state.nodes);

  // 📊 모든 데이터 집계 로직
  const summaryData = useMemo(() => {
    // 1. 그룹 노드들 추출
    const groups = nodes.filter(n => n.type === 'auraGroup');
    
    // 2. 개별 노드들 추출 (그룹에 속하지 않은 일반 노드)
    const independentNodes = nodes.filter(n => n.type === 'tactical' && !n.parentId);

    // 3. 시트 데이터 합계 계산기
    const getSheetSum = (sheet) => {
      if (!sheet || !sheet.rows || !sheet.columns || sheet.rows.length === 0) return 0;
      
      const columns = sheet.columns;
      const rows = sheet.rows;

      // 합계 대상 컬럼 찾기
      const targetColumn = columns.find(c => 
        c.name.includes('소계') || 
        c.name.includes('합계') || 
        c.name.toLowerCase().includes('total') || 
        c.name.toLowerCase().includes('amount') ||
        c.name.toLowerCase().includes('subtotal')
      ) || columns.filter(c => c.type === 'number' || c.type === 'formula').slice(-1)[0];

      if (!targetColumn) return 0;

      // 수식 계산 (엔진 의존성 제거를 위해 직접 구현 - 안정성 우선)
      const evalValue = (formula, row) => {
        if (!formula) return 0;
        try {
          let expr = formula;
          columns.forEach(c => {
            const v = parseFloat(row[c.id]) || 0;
            const r = new RegExp(`\\b${c.id}\\b`, 'g');
            expr = expr.replace(r, v);
          });
          // eslint-disable-next-line no-new-func
          return Function(`"use strict"; return (${expr})`)() || 0;
        } catch { return 0; }
      };

      return rows.reduce((acc, row) => {
        let val = 0;
        if (targetColumn.type === 'number') {
          val = parseFloat(row[targetColumn.id]) || 0;
        } else if (targetColumn.type === 'formula') {
          val = evalValue(targetColumn.formula, row);
        }
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
    };

    // 4. 각 그룹별 총액 산출
    const groupList = groups.map(g => {
      const children = nodes.filter(n => n.parentId === g.id);
      const total = children.reduce((acc, child) => acc + getSheetSum(child.data?.sheet), 0);
      return { id: g.id, name: g.data?.label || '미지정 그룹', total };
    });

    // 5. 개별 노드별 총액 산출
    const nodeList = independentNodes.map(n => ({
      id: n.id,
      name: n.data?.label || '미지정 노드',
      total: getSheetSum(n.data?.sheet)
    }));

    // 6. 전체 총합
    const grandTotal = [...groupList, ...nodeList].reduce((acc, item) => acc + item.total, 0);

    return { groupList, nodeList, grandTotal };
  }, [nodes]);

  const isCollapsed = data.collapsed || false;
  const updateNodeData = useStore((state) => state.updateNodeLabel); // Label 업데이트 함수를 이용해 데이터 전체 업데이트 가능

  const toggleCollapse = (e) => {
    e.stopPropagation();
    // store에 직접 접근하여 데이터 업데이트 (현재 label 업데이트 함수가 data 전체를 덮어쓰지 않으므로 주의)
    // tacticalSlice에 전용 업데이트 함수가 있는지 확인 필요. 
    // 여기서는 useStore의 setState를 직접 활용하거나 전용 액션을 사용.
    useStore.setState((state) => ({
      nodes: state.nodes.map((n) => 
        n.id === id ? { ...n, data: { ...n.data, collapsed: !isCollapsed } } : n
      )
    }));
  };

  return (
    <div style={{
      minWidth: isCollapsed ? '220px' : '300px',
      background: 'rgba(15, 23, 42, 0.98)',
      backdropFilter: 'blur(40px)',
      border: `2px solid ${selected ? '#00e5ff' : 'rgba(255, 255, 255, 0.15)'}`,
      borderRadius: '28px',
      padding: isCollapsed ? '16px 20px' : '24px',
      color: '#fff',
      boxShadow: selected ? '0 0 50px rgba(0, 229, 255, 0.5)' : '0 20px 60px rgba(0,0,0,0.7)',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'default'
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#00e5ff' }} />
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: isCollapsed ? '0' : '20px', 
        borderBottom: isCollapsed ? 'none' : '1px solid rgba(255,255,255,0.1)', 
        paddingBottom: isCollapsed ? '0' : '15px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BarChart3 size={22} style={{ color: '#00e5ff' }} />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#00e5ff' }}>전략적 대시보드</h3>
        </div>
        <button 
          onClick={toggleCollapse}
          style={{ 
            background: 'rgba(255,255,255,0.05)', 
            border: 'none', 
            color: '#94a3b8', 
            borderRadius: '8px', 
            padding: '4px', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          {isCollapsed ? <TrendingUp size={16} /> : <Circle size={16} />}
        </button>
      </div>

      {!isCollapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
          {/* 그룹 목록 */}
          {summaryData.groupList.map(g => (
            <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '14px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TrendingUp size={16} style={{ color: '#a855f7' }} />
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#e9d5ff' }}>{g.name}</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: '900', color: '#fff' }}>{g.total.toLocaleString()}</span>
            </div>
          ))}

          {/* 개별 노드 목록 */}
          {summaryData.nodeList.map(n => (
            <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Circle size={10} style={{ color: '#94a3b8' }} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#cbd5e1' }}>{n.name}</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{n.total.toLocaleString()}</span>
            </div>
          ))}

          {summaryData.groupList.length === 0 && summaryData.nodeList.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569', fontSize: '13px' }}>
              입력된 데이터가 없습니다.
            </div>
          )}
        </div>
      )}

      <div style={{
        marginTop: isCollapsed ? '12px' : '25px',
        padding: isCollapsed ? '10px 14px' : '18px',
        background: 'linear-gradient(135deg, #00e5ff 0%, #0095ff 100%)',
        borderRadius: isCollapsed ? '14px' : '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px rgba(0, 229, 255, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={isCollapsed ? 16 : 20} style={{ color: '#030712' }} />
          <span style={{ fontSize: isCollapsed ? '11px' : '13px', fontWeight: '900', color: '#030712' }}>GRAND TOTAL</span>
        </div>
        <span style={{ fontSize: isCollapsed ? '14px' : '20px', fontWeight: '900', color: '#030712' }}>
          {summaryData.grandTotal.toLocaleString()}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: '#00e5ff' }} />
    </div>
  );
};

export default SummaryNode;
