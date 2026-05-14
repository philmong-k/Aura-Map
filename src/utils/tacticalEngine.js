/**
 * 🌌 Agent Canvas - Tactical Engine v1.0
 * 수식 계산 및 날짜 연산을 전담하는 전술 유틸리티
 */

/**
 * 수식 계산기 (Formula Evaluator)
 * @param {string} formula - 수식 (예: "c2 * c3")
 * @param {object} row - 행 데이터
 * @param {array} columns - 컬럼 정의
 */
export const evaluateFormula = (formula, row, columns) => {
  if (!formula || typeof formula !== 'string') return 0;
  
  try {
    let evalExpr = formula;
    
    columns.forEach(col => {
      let val = 0;
      const rawValue = row[col.id];
      
      if (col.type === 'date') {
        val = rawValue ? new Date(rawValue.replace(/-/g, '/')).getTime() : 0;
      } else {
        val = parseFloat(rawValue || 0);
      }
      
      // 컬럼 ID를 실제 값으로 치환 (단어 경계 \b 사용으로 ID 중첩 방지)
      const regex = new RegExp(`\\b${col.id}\\b`, 'g');
      evalExpr = evalExpr.replace(regex, isNaN(val) ? 0 : val);
    });

    // days 함수: 밀리초 차이를 일수로 변환
    const days = (ms) => {
      if (typeof ms !== 'number' || isNaN(ms)) return 0;
      return Math.abs(Math.round(ms / 86400000));
    };

    // 안전한 수식 실행을 위한 Function 생성
    // eslint-disable-next-line no-new-func
    const result = new Function('days', `try { return (${evalExpr}); } catch(e) { return 0; }`)(days);
    
    return (typeof result === 'number' && !isNaN(result)) ? result : 0;
  } catch (e) {
    console.error('⚠️ [Tactical Engine] Formula Error:', e);
    return 0;
  }
};

/**
 * 날짜 오프셋 계산 (하루 단위 이동)
 */
export const offsetDate = (dateStr, offset) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
};

/**
 * 오늘 날짜 문자열 (YYYY-MM-DD)
 */
export const getToday = () => new Date().toISOString().split('T')[0];

/**
 * 통화/숫자 포맷팅
 */
export const formatValue = (value) => {
  if (typeof value !== 'number') return value;
  return value.toLocaleString();
};

/**
 * 노드 데이터 보정 (Migration)
 */
export const migrateNodes = (nodes) => {
  return nodes.map(node => {
    const isGroup = node.type === 'auraGroup' || node.type === 'group';
    const label = node.data?.label || '';
    
    let shape = node.data?.shape;
    if (!shape && !isGroup) {
      if (label.toLowerCase().includes('db') || label.includes('데이터베이스')) shape = 'database';
      else if (label.includes('판단') || label.includes('?')) shape = 'decision';
      else if (label.includes('시작') || label.includes('종료')) shape = 'terminal';
      else shape = 'process';
    }

    return {
      ...node,
      type: isGroup ? 'auraGroup' : (node.type || 'tactical'),
      data: {
        ...node.data,
        shape: isGroup ? undefined : (shape || 'process'),
        memo: node.data?.memo || '',
        collapsed: node.data?.collapsed || false,
        sheet: node.data?.sheet || {
          columns: [
            { id: 'c1', name: '품명', type: 'text' },
            { id: 'c2', name: '단가', type: 'number' },
            { id: 'c3', name: '수량', type: 'number' },
            { id: 'c4', name: '소계', type: 'formula', formula: '(c2 * c3)' }
          ],
          rows: []
        }
      }
    };
  });
};

/**
 * 에지 데이터 보정 (Migration)
 */
export const migrateEdges = (edges, migratedNodes) => {
  return edges.map(edge => {
    const sourceNode = migratedNodes.find(n => n.id === edge.source);
    const targetNode = migratedNodes.find(n => n.id === edge.target);
    const isDataLink = sourceNode?.data?.shape === 'database' || targetNode?.data?.shape === 'database';

    // 🛡️ [v4.6-PLATINUM] 전술 유선망 규격(Tactical Wiring Standard) 강제 적용
    let sourceHandle = edge.sourceHandle;
    let targetHandle = edge.targetHandle;

    // 핸들 ID 자동 보정 (Legacy -> Tactical Standard)
    const standardizeHandle = (h, prefix) => {
      if (!h) return h;
      if (h.startsWith('s-') || h.startsWith('t-')) return h; // 이미 규격 준수 중
      
      if (h.includes('bottom') || h === 'bottom-2') return `${prefix}-bottom`;
      if (h.includes('top') || h === 'top-2') return `${prefix}-top`;
      if (h.includes('left') || h === 'left-2') return `${prefix}-left`;
      if (h.includes('right') || h === 'right-2') return `${prefix}-right`;
      
      return h;
    };

    sourceHandle = standardizeHandle(sourceHandle, 's');
    targetHandle = standardizeHandle(targetHandle, 't');

    return {
      ...edge,
      sourceHandle,
      targetHandle,
      type: 'tactical',
      animated: true,
      style: {
        stroke: isDataLink ? '#a78bfa' : (edge.style?.stroke || '#00e5ff'),
        strokeWidth: 2,
        strokeDasharray: isDataLink ? '12,6' : '5,5',
        animationDuration: isDataLink ? '5s' : '1.5s',
      },
      markerEnd: {
        type: 'arrowclosed',
        color: isDataLink ? '#a78bfa' : (edge.markerEnd?.color || '#00e5ff'),
      }
    };
  });
};
