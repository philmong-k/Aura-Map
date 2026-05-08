import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Settings, Type, Hash, Calendar, X, Check, Calculator, ChevronLeft, ChevronRight, List } from 'lucide-react';
import useStore from '../../store/useStore';
import { evaluateFormula, offsetDate, getToday, formatValue } from '../../utils/tacticalEngine';

const TacticalSheet = ({ nodeId, isLocked }) => {
  const nodes = useStore((state) => state.nodes);
  const updateNodeSheet = useStore((state) => state.updateNodeSheet);
  const updatePendingRow = useStore((state) => state.updatePendingRow);
  const tacticalTemplates = useStore((state) => state.tacticalTemplates);
  const sheetLayoutTemplates = useStore((state) => state.sheetLayoutTemplates);
  const addSheetLayoutTemplate = useStore((state) => state.addSheetLayoutTemplate);

  const currentNode = nodes.find(n => n.id === nodeId);
  const data = useMemo(() => currentNode?.data?.sheet || {
    columns: [
      { id: 'c1', name: '품명', type: 'text' },
      { id: 'c2', name: '단가', type: 'number' },
      { id: 'c3', name: '수량', type: 'number' },
      { id: 'c4', name: '소계', type: 'formula', formula: 'c2 * c3' }
    ],
    rows: []
  }, [currentNode]);

  const [isConfigMode, setIsConfigMode] = useState(false);
  const getInitialRow = (currentData = data) => {
    const initial = {};
    currentData.columns.forEach(col => {
      if (col.type === 'date') initial[col.id] = getToday();
    });
    return initial;
  };

  const [newRow, setNewRow] = useState(() => {
    const pending = currentNode?.data?.pendingRow;
    if (pending && Object.keys(pending).length > 0) return pending;
    return getInitialRow();
  });
  const rowRef = useRef(currentNode?.data?.pendingRow || {});
  const [activeFormulaCol, setActiveFormulaCol] = useState(null); 
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const firstInputRef = useRef(null); // 첫 번째 입력 필드 조준용 레프

  // 지능형 합계 계산 로직 (TacticalNode와 동일한 타겟팅 로직 적용)
  const totals = useMemo(() => {
    const results = { targetId: null };
    if (!data.rows || data.rows.length === 0) return results;

    const targetColumn = data.columns.find(c => 
      c.name.includes('소계') || 
      c.name.includes('합계') || 
      c.name.toLowerCase().includes('total') || 
      c.name.toLowerCase().includes('amount') ||
      c.name.toLowerCase().includes('subtotal')
    ) || data.columns.filter(c => c.type === 'number' || c.type === 'formula').slice(-1)[0];

    if (targetColumn) results.targetId = targetColumn.id;

    data.columns.forEach(col => {
      if (col.type === 'number' || col.type === 'formula') {
        results[col.id] = data.rows.reduce((acc, row) => {
          let val = 0;
          if (col.type === 'number') val = parseFloat(row[col.id]) || 0;
          else if (col.type === 'formula') val = evaluateFormula(col.formula, row, data.columns);
          return acc + val;
        }, 0);
      }
    });

    return results;
  }, [data.rows, data.columns]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    rowRef.current = newRow;
  }, [newRow]);

  useEffect(() => {
    // 컬럼 정보를 감시하며 날짜 필드가 비어있을 경우 오늘 날짜로 강제 동기화
    const initialRow = getInitialRow();
    const needsUpdate = data.columns.some(col => col.type === 'date' && !newRow[col.id]);
    
    if (needsUpdate) {
      const updated = { ...initialRow, ...newRow };
      setNewRow(updated);
      updatePendingRow(nodeId, updated);
    }
  }, [data.columns]);

  const handleInputChange = (colId, value) => {
    const updatedRow = { ...newRow, [colId]: value };
    setNewRow(updatedRow);
    updatePendingRow(nodeId, updatedRow);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      addRow();
    }
  };

  const addRow = () => {
    // 날짜 기본값 외에 실제 데이터(품명, 단가 등)가 입력되었는지 확인
    const hasActualData = data.columns.some(col => {
      const val = newRow[col.id];
      if (col.type === 'date') return false; // 날짜는 기본값이므로 체크 제외
      return val !== undefined && val !== '' && val !== 0;
    });
    
    if (!hasActualData) return;

    const processedNewRow = { ...newRow };
    data.columns.forEach(col => {
      if (col.type === 'number') processedNewRow[col.id] = Number(processedNewRow[col.id] || 0);
    });
    const updated = {
      ...data,
      rows: [...(data.rows || []), { ...processedNewRow, id: `row-${Date.now()}` }]
    };
    updateNodeSheet(nodeId, updated);
    const initialRow = getInitialRow();
    setNewRow(initialRow);
    updatePendingRow(nodeId, initialRow);
    
    // 다음 입력을 위해 첫 번째 필드로 포커스 강제 이동
    setTimeout(() => {
      if (firstInputRef.current) firstInputRef.current.focus();
    }, 50);
  };

  useEffect(() => {
    return () => {
      const pendingRow = rowRef.current;
      // 실제 데이터가 있는 경우에만 자동 저장
      const hasContent = Object.keys(pendingRow).some(key => {
        const col = data.columns.find(c => c.id === key);
        if (col?.type === 'date') return false;
        return pendingRow[key] !== undefined && pendingRow[key] !== '';
      });

      if (pendingRow && hasContent) {
        const state = useStore.getState();
        if (!state.nodes || !nodeId) return;
        const node = state.nodes.find(n => n.id === nodeId);
        if (!node) return;
        const sheet = node.data?.sheet || data;
        state.updateNodeSheet(nodeId, {
          ...sheet,
          rows: [...(sheet.rows || []), { ...pendingRow, id: `row-auto-${Date.now()}` }]
        });
        state.updatePendingRow(nodeId, {});
      }
    };
  }, [nodeId]); // data 의존성 제거: 행 추가 시 중복 저장 방지

  const updateColumn = (colId, field, value) => updateNodeSheet(nodeId, { ...data, columns: data.columns.map(c => c.id === colId ? { ...c, [field]: value } : c) });
  const deleteColumn = (colId) => updateNodeSheet(nodeId, { ...data, columns: data.columns.filter(c => c.id !== colId), rows: data.rows.map(row => { const { [colId]: _, ...rest } = row; return rest; }) });
  
  const moveColumn = (index, direction) => {
    const newColumns = [...data.columns];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newColumns.length) return;
    
    [newColumns[index], newColumns[targetIndex]] = [newColumns[targetIndex], newColumns[index]];
    updateNodeSheet(nodeId, { ...data, columns: newColumns });
  };

  const updateCell = (rowId, colId, value) => updateNodeSheet(nodeId, { ...data, rows: data.rows.map(row => row.id === rowId ? { ...row, [colId]: value } : row) });
  const deleteRow = (rowId) => updateNodeSheet(nodeId, { ...data, rows: data.rows.filter(r => r.id !== rowId) });
  
  const addColumn = () => {
    const maxIdNum = data.columns.reduce((max, col) => {
      const match = col.id.match(/c(\d+)/);
      const num = match ? parseInt(match[1]) : 0;
      return Math.max(max, num);
    }, 0);
    const newColId = `c${maxIdNum + 1}`;
    updateNodeSheet(nodeId, { ...data, columns: [...data.columns, { id: newColId, name: `필드 ${maxIdNum + 1}`, type: 'text' }] });
  };

  const insertToFormula = (colId, text) => {
    const col = data.columns.find(c => c.id === colId);
    const current = col.formula || '';
    updateColumn(colId, 'formula', current + text);
  };

  // 📅 날짜 화살표 헬퍼
  const TacticalDateInput = ({ value, onChange, disabled }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', width: '100%' }}>
      {!disabled && (
        <button 
          onClick={() => onChange(offsetDate(value || getToday(), -1))}
          style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={14} />
        </button>
      )}
      <input 
        type="date"
        value={value || ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && onChange(e.target.value)} // 엔터 지원
        style={{ 
          background: 'transparent', border: 'none', color: disabled ? '#fff' : '#00e5ff', width: '100%', outline: 'none',
          colorScheme: 'dark', fontSize: '12px'
        }}
      />
      {!disabled && (
        <button 
          onClick={() => onChange(offsetDate(value || getToday(), 1))}
          style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
        >
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px', color: '#e2e8f0', position: 'relative' }}>
      {/* 🛠️ 컨트롤 툴바 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={() => setIsConfigMode(!isConfigMode)}
            style={{
              padding: '6px 12px', borderRadius: '8px', border: 'none',
              background: isConfigMode ? '#00e5ff' : 'rgba(255,255,255,0.05)',
              color: isConfigMode ? '#001a1a' : '#94a3b8',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700'
            }}
          >
            <Settings size={14} /> {isConfigMode ? '설정 완료' : '필드 커스터마이징'}
          </button>
          
          {isConfigMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <select 
                onChange={(e) => {
                  const layout = sheetLayoutTemplates.find(l => l.id === e.target.value);
                  if (layout && confirm(`'${layout.name}' 템플릿을 적용하시겠습니까? 현재 필드 구성이 대체됩니다.`)) {
                    updateNodeSheet(nodeId, { ...data, columns: layout.columns });
                  }
                  e.target.value = '';
                }}
                style={{ background: 'transparent', border: 'none', color: '#00e5ff', fontSize: '11px', outline: 'none', colorScheme: 'dark', cursor: 'pointer' }}
              >
                <option value="">레이아웃 불러오기...</option>
                {sheetLayoutTemplates.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <button 
                onClick={() => {
                  const name = prompt('현재 필드 구성을 저장할 템플릿 이름을 입력하세요:');
                  if (name) addSheetLayoutTemplate(name, data.columns);
                }}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="현재 구성을 템플릿으로 저장"
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>

        {isConfigMode && (
          <button onClick={addColumn} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px dashed #00e5ff', background: 'transparent', color: '#00e5ff', cursor: 'pointer', fontSize: '12px' }}>
            <Plus size={14} /> 새 필드 추가
          </button>
        )}
      </div>

      {/* 📑 시트 영역 (플랫폼 통합 레이아웃) */}
      <div style={{ flex: 1, overflow: 'auto', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'rgba(30, 41, 59, 0.95)', zIndex: 10 }}>
            <tr>
              {data.columns.map((col, idx) => (
                <th key={col.id} style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', minWidth: '140px' }}>
                  {isConfigMode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button 
                            onClick={() => moveColumn(idx, 'left')} 
                            disabled={idx === 0}
                            style={{ background: 'transparent', border: 'none', color: idx === 0 ? '#334155' : '#00e5ff', cursor: idx === 0 ? 'default' : 'pointer', padding: '2px' }}
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <button 
                            onClick={() => moveColumn(idx, 'right')} 
                            disabled={idx === data.columns.length - 1}
                            style={{ background: 'transparent', border: 'none', color: idx === data.columns.length - 1 ? '#334155' : '#00e5ff', cursor: idx === data.columns.length - 1 ? 'default' : 'pointer', padding: '2px' }}
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                        <button onClick={() => deleteColumn(col.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={12}/></button>
                      </div>
                      <input 
                        value={col.name} 
                        onChange={(e) => updateColumn(col.id, 'name', e.target.value)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#00e5ff', padding: '2px', width: '100%' }}
                      />
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select value={col.type} onChange={(e) => updateColumn(col.id, 'type', e.target.value)} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '11px', outline: 'none', colorScheme: 'dark' }}>
                          <option value="text">텍스트</option>
                          <option value="number">숫자</option>
                          <option value="date">날짜</option>
                          <option value="select">선택 (드롭다운)</option>
                          <option value="formula">수식</option>
                        </select>
                        {col.type === 'select' && (
                          <select 
                            value={col.templateId || ''} 
                            onChange={(e) => updateColumn(col.id, 'templateId', e.target.value)}
                            style={{ background: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.3)', color: '#00e5ff', fontSize: '11px', outline: 'none', borderRadius: '4px', padding: '2px 4px', colorScheme: 'dark' }}
                          >
                            <option value="">템플릿 선택...</option>
                            {tacticalTemplates.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        )}
                        {col.type === 'formula' && (
                          <button 
                            onClick={() => setActiveFormulaCol(col.id)}
                            style={{ padding: '2px 6px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}
                          >
                            <Calculator size={10} /> FX
                          </button>
                        )}
                        <button onClick={() => deleteColumn(col.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={12}/></button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {col.type === 'number' ? <Hash size={12} /> : col.type === 'date' ? <Calendar size={12} /> : col.type === 'select' ? <List size={12} /> : <Type size={12} />}
                      {col.name}
                    </div>
                  )}
                </th>
              ))}
              {!isLocked && <th style={{ width: '40px' }}></th>}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                {data.columns.map(col => (
                  <td key={col.id} style={{ padding: '8px 12px' }}>
                    {col.type === 'formula' ? (
                      <div style={{ color: '#10b981', fontWeight: '700', textAlign: 'right' }}>
                        {formatValue(evaluateFormula(col.formula, row, data.columns))}
                      </div>
                    ) : col.type === 'date' ? (
                      <TacticalDateInput 
                        value={row[col.id]} 
                        disabled={isLocked} 
                        onChange={(val) => updateCell(row.id, col.id, val)} 
                      />
                    ) : col.type === 'select' ? (
                      <select
                        value={row[col.id] || ''}
                        disabled={isLocked}
                        onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#00e5ff', width: '100%', outline: 'none', borderRadius: '4px', padding: '4px', colorScheme: 'dark' }}
                      >
                        <option value="">선택...</option>
                        {tacticalTemplates.find(t => t.id === col.templateId)?.options.split(',').map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="text"
                        value={row[col.id] || ''}
                        disabled={isLocked}
                        onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%', outline: 'none' }}
                      />
                    )}
                  </td>
                ))}
                {!isLocked && (
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => deleteRow(row.id)} style={{ background: 'transparent', border: 'none', color: '#334155', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </td>
                )}
              </tr>
            ))}
            {!isLocked && (
              <tr style={{ background: 'rgba(0, 229, 255, 0.05)' }}>
                {data.columns.map((col, index) => (
                  <td key={col.id} style={{ padding: '8px 12px' }}>
                    {col.type === 'formula' ? (
                      <div style={{ color: '#10b981', fontWeight: '700', textAlign: 'right' }}>
                        {formatValue(evaluateFormula(col.formula, newRow, data.columns))}
                      </div>
                    ) : col.type === 'date' ? (
                      <TacticalDateInput 
                        value={newRow[col.id]} 
                        onChange={(val) => handleInputChange(col.id, val)} 
                      />
                    ) : col.type === 'select' ? (
                      <select
                        value={newRow[col.id] || ''}
                        onChange={(e) => handleInputChange(col.id, e.target.value)}
                        onKeyDown={handleKeyDown} // 엔터 지원
                        style={{ background: 'rgba(0, 229, 255, 0.1)', border: 'none', color: '#00e5ff', width: '100%', outline: 'none', borderRadius: '4px', padding: '4px', colorScheme: 'dark' }}
                      >
                        <option value="">선택...</option>
                        {tacticalTemplates.find(t => t.id === col.templateId)?.options.split(',').map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        ref={index === 0 ? firstInputRef : null} // 첫 번째 필드에 레프 장착
                        type="text"
                        placeholder={`${col.name}...`}
                        value={newRow[col.id] || ''}
                        onChange={(e) => handleInputChange(col.id, e.target.value)}
                        onKeyDown={handleKeyDown} // 엔터 지원
                        style={{ background: 'transparent', border: 'none', color: '#00e5ff', width: '100%', outline: 'none' }}
                      />
                    )}
                  </td>
                ))}
                <td style={{ textAlign: 'center' }}>
                  <button onClick={addRow} style={{ background: '#00e5ff', border: 'none', color: '#030712', borderRadius: '4px', cursor: 'pointer', padding: '4px' }}><Plus size={16} /></button>
                </td>
              </tr>
            )}
          </tbody>
          {data.rows.length > 0 && (
            <tfoot style={{ position: 'sticky', bottom: 0, background: 'rgba(30, 41, 59, 0.98)', zIndex: 10, borderTop: '2px solid rgba(0, 229, 255, 0.2)', backdropFilter: 'blur(10px)' }}>
              <tr>
                {data.columns.map((col, idx) => {
                  const isTarget = totals.targetId === col.id;
                  const hasValue = totals[col.id] !== undefined;
                  return (
                    <td key={col.id} style={{ padding: '12px', textAlign: 'right' }}>
                      {idx === 0 && (
                        <div style={{ float: 'left', display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '11px', fontWeight: '900' }}>
                          <Check size={14} color="#00e5ff" /> TOTAL SUMMARY
                        </div>
                      )}
                      {hasValue && (
                        <div style={{ 
                          color: isTarget ? '#10b981' : '#94a3b8', 
                          fontWeight: '900',
                          fontSize: isTarget ? '15px' : '12px',
                          textShadow: isTarget ? '0 0 10px rgba(16, 185, 129, 0.3)' : 'none'
                        }}>
                          {formatValue(totals[col.id])}
                        </div>
                      )}
                    </td>
                  );
                })}
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* 🧪 [통합] 플로팅 수식 연구소 (전 플랫폼 표준 채택) */}
      {activeFormulaCol && (
        <div style={{
          position: 'absolute', top: '10%', left: '10%', right: '10%',
          background: 'rgba(15, 23, 42, 0.98)', backdropFilter: 'blur(30px)',
          border: '1px solid #10b981', borderRadius: '24px',
          padding: '24px', zIndex: 9999, boxShadow: '0 30px 100px rgba(0,0,0,0.9)',
          display: 'flex', flexDirection: 'column', gap: '15px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calculator size={16} /> 전술 수식 설계: {data.columns.find(c => c.id === activeFormulaCol)?.name}
            </span>
            <button onClick={() => setActiveFormulaCol(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          <textarea 
            value={data.columns.find(c => c.id === activeFormulaCol)?.formula || ''}
            onChange={(e) => updateColumn(activeFormulaCol, 'formula', e.target.value)}
            style={{ width: '100%', height: '80px', padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '12px', color: '#fff', fontSize: '18px', outline: 'none', resize: 'none' }}
            placeholder="예: c2 * c3"
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px' }}>
            {data.columns.filter(c => c.type !== 'formula').map(c => (
              <button key={c.id} onClick={() => insertToFormula(activeFormulaCol, c.id)} style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                {c.name}
              </button>
            ))}
            {['+', '-', '*', '/', '(', ')', 'days('].map(op => (
              <button key={op} onClick={() => insertToFormula(activeFormulaCol, op)} style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                {op === 'days(' ? '날짜차' : op}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setActiveFormulaCol(null)}
            style={{ marginTop: '10px', padding: '16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '900', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)' }}
          >
            <Check size={20} /> 전술 수식 적용 완료
          </button>
        </div>
      )}
    </div>
  );
};

export default TacticalSheet;
