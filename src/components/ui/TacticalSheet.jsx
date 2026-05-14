import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Settings, Type, Hash, Calendar, X, Check, Calculator, ChevronLeft, ChevronRight, Save, Layout, Maximize2, Image as ImageIcon } from 'lucide-react';
import useStore from '../../store/useStore';
import { evaluateFormula, offsetDate, getToday, formatValue } from '../../utils/tacticalEngine';

const TacticalSheet = ({ nodeId, isLocked }) => {
  const nodes = useStore((state) => state.nodes);
  const updateNodeSheet = useStore((state) => state.updateNodeSheet);
  const updatePendingRow = useStore((state) => state.updatePendingRow);

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
  const [newRow, setNewRow] = useState(currentNode?.data?.pendingRow || {});
  const rowRef = useRef(currentNode?.data?.pendingRow || {});
  const [activeFormulaCol, setActiveFormulaCol] = useState(null); 
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [showLayouts, setShowLayouts] = useState(false);
  const [layoutTemplates, setLayoutTemplates] = useState(JSON.parse(localStorage.getItem('aura-map-layout-templates')) || []);
  const [previewImage, setPreviewImage] = useState(null); // 🖼️ 이미지 프리뷰 전용 상태

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    rowRef.current = newRow;
  }, [newRow]);

  const handleInputChange = (colId, value) => {
    const updatedRow = { ...newRow, [colId]: value };
    setNewRow(updatedRow);
    updatePendingRow(nodeId, updatedRow);
  };

  const addRow = () => {
    if (!newRow.c1 && !newRow.c2 && !newRow.c3) return;
    const processedNewRow = { ...newRow };
    data.columns.forEach(col => {
      if (col.type === 'number') processedNewRow[col.id] = Number(processedNewRow[col.id] || 0);
    });
    const updated = {
      ...data,
      rows: [...(data.rows || []), { ...processedNewRow, id: `row-${Date.now()}` }]
    };
    updateNodeSheet(nodeId, updated);
    setNewRow({});
    // 🛸 지니어스 엔진: 신규 행 추가 시 날짜 필드 기본값(오늘) 세팅 로직 유지
    updatePendingRow(nodeId, {});
  };


  const updateColumn = (colId, field, value) => updateNodeSheet(nodeId, { ...data, columns: data.columns.map(c => c.id === colId ? { ...c, [field]: value } : c) });
  const deleteColumn = (colId) => updateNodeSheet(nodeId, { ...data, columns: data.columns.filter(c => c.id !== colId), rows: data.rows.map(row => { const { [colId]: _, ...rest } = row; return rest; }) });
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

  const saveLayoutTemplate = () => {
    const templateName = prompt('저장할 전술 레이아웃의 이름을 입력하세요:', '표준 장부 레이아웃');
    if (!templateName) return;
    
    const newTemplate = {
      id: `layout-${Date.now()}`,
      name: templateName,
      columns: data.columns
    };
    
    const updated = [...layoutTemplates, newTemplate];
    setLayoutTemplates(updated);
    localStorage.setItem('aura-map-layout-templates', JSON.stringify(updated));
    alert('전술 레이아웃이 금고에 저장되었습니다.');
  };

  const applyLayoutTemplate = (template) => {
    if (confirm(`[${template.name}] 레이아웃을 이 노드에 투사하시겠습니까?\n기존 데이터와 형식이 맞지 않을 수 있습니다.`)) {
      updateNodeSheet(nodeId, { ...data, columns: template.columns });
      setShowLayouts(false);
    }
  };

  const deleteLayoutTemplate = (id) => {
    if (confirm('이 레이아웃 템플릿을 영구 삭제하시겠습니까?')) {
      const updated = layoutTemplates.filter(t => t.id !== id);
      setLayoutTemplates(updated);
      localStorage.setItem('aura-map-layout-templates', JSON.stringify(updated));
    }
  };

  const insertToFormula = (colId, text) => {
    const col = data.columns.find(c => c.id === colId);
    const current = col.formula || '';
    updateColumn(colId, 'formula', current + text);
  };

  // 📅 날짜 화살표 헬퍼 (지휘관 최적화: < 2024-01-01 > 레이아웃)
  const TacticalDateInput = ({ value, onChange, disabled }) => {
    const displayDate = value || getToday();
    
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '4px',
        width: '100%'
      }}>
        {!disabled && (
          <button 
            onClick={() => onChange(offsetDate(displayDate, -1))}
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.color = '#00e5ff'}
            onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
          >
            <ChevronLeft size={16} />
          </button>
        )}
        
        <input 
          type="date"
          value={displayDate}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: disabled ? '#94a3b8' : '#00e5ff', 
            outline: 'none',
            colorScheme: 'dark', 
            fontSize: '13px',
            fontFamily: 'monospace',
            fontWeight: '700',
            width: '125px',
            textAlign: 'center',
            cursor: disabled ? 'default' : 'pointer'
          }}
        />

        {!disabled && (
          <button 
            onClick={() => onChange(offsetDate(displayDate, 1))}
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.color = '#00e5ff'}
            onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    );
  };

  // 🖼️ 이미지 업로드 핸들러 (지휘관 최적화: 시각적 피드백 및 에러 핸들링 강화)
  const handleImageUpload = (e, callback) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 전술 자료로 등록할 수 있습니다.');
      return;
    }

    const reader = new FileReader();
    
    // 업로드 시작 시 콘솔 브리핑
    console.log(`📡 [Tactical Engine] 이미지 분석 시작: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    
    reader.onerror = () => alert('파일을 읽는 중 전술적 오류가 발생했습니다.');
    
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => alert('이미지 데이터를 해석할 수 없습니다. 파일 손상을 확인하십시오.');
      
      img.onload = () => {
        try {
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
          
          // 압축 효율 최적화 (JPEG 0.7)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          // 결과 반환
          callback(compressedDataUrl);
          console.log(`✅ [Tactical Engine] 이미지 최적화 및 등록 완료`);
        } catch (err) {
          console.error('이미지 처리 실패:', err);
          alert('이미지 최적화 과정에서 오류가 발생했습니다.');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px', color: '#e2e8f0', position: 'relative' }}>
      {/* 🔮 애니메이션 주입 (지능형 스타일 엔진) */}
      <style>
        {`
          @keyframes modalScale {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
      {/* 🛠️ 컨트롤 툴바 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setShowLayouts(!showLayouts)}
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(0, 229, 255, 0.3)', background: 'transparent', color: '#00e5ff', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Layout size={14} /> 레이아웃 허브
          </button>
          
          {isConfigMode && (
            <>
              <button onClick={saveLayoutTemplate} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #10b981', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Save size={14} /> 현재 저장
              </button>
              <button onClick={addColumn} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px dashed #00e5ff', background: 'transparent', color: '#00e5ff', cursor: 'pointer', fontSize: '12px' }}>
                <Plus size={14} /> 새 필드 추가
              </button>
            </>
          )}
        </div>

        {/* 🏛️ 레이아웃 허브 팝업 */}
        {showLayouts && (
          <div style={{
            position: 'absolute', top: '45px', right: '0', width: '250px', 
            background: '#1e293b', border: '1.5px solid #00e5ff', borderRadius: '16px',
            boxShadow: '0 15px 40px rgba(0,0,0,0.6)', zIndex: 100, overflow: 'hidden'
          }}>
            <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', fontWeight: '900', color: '#00e5ff', display: 'flex', justifyContent: 'space-between' }}>
              <span>TACTICAL LAYOUTS</span>
              <X size={14} onClick={() => setShowLayouts(false)} style={{ cursor: 'pointer' }} />
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '8px' }}>
              {layoutTemplates.length > 0 ? layoutTemplates.map(t => (
                <div key={t.id} style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => applyLayoutTemplate(t)}>
                  <span style={{ fontSize: '11px', color: '#fff' }}>{t.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteLayoutTemplate(t.id); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: '2px' }}><Trash2 size={12} /></button>
                </div>
              )) : (
                <div style={{ padding: '20px', textAlign: 'center', fontSize: '11px', color: '#64748b' }}>저장된 레이아웃이 없습니다.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 📑 시트 영역 (플랫폼 통합 레이아웃) */}
      <div style={{ flex: 1, overflow: 'auto', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'rgba(30, 41, 59, 0.95)', zIndex: 10 }}>
            <tr>
              {data.columns.map(col => (
                <th key={col.id} style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', minWidth: '140px' }}>
                  {isConfigMode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <input 
                        value={col.name} 
                        onChange={(e) => updateColumn(col.id, 'name', e.target.value)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#00e5ff', padding: '2px', width: '100%' }}
                      />
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select value={col.type} onChange={(e) => updateColumn(col.id, 'type', e.target.value)} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '11px', outline: 'none' }}>
                          <option value="text">텍스트</option>
                          <option value="number">숫자</option>
                          <option value="date">날짜</option>
                          <option value="formula">수식</option>
                          <option value="select">선택 (템플릿)</option>
                          <option value="checkbox">체크박스</option>
                          <option value="image">이미지(다중)</option>
                        </select>
                        {col.type === 'select' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                            <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '800' }}>LINKED TEMPLATE</span>
                            <select 
                              value={col.templateId || ''} 
                              onChange={(e) => updateColumn(col.id, 'templateId', e.target.value)}
                              style={{ 
                                background: '#0f172a', 
                                border: '1.5px solid #00e5ff', 
                                color: '#00e5ff', 
                                fontSize: '11px', 
                                padding: '5px 8px', 
                                borderRadius: '6px', 
                                outline: 'none',
                                fontWeight: '700',
                                boxShadow: '0 0 10px rgba(0, 229, 255, 0.2)',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="" style={{ background: '#0f172a', color: '#64748b' }}>선택하십시오...</option>
                              {useStore.getState().tacticalTemplates.map(t => (
                                <option key={t.id} value={t.id} style={{ background: '#0f172a', color: '#fff' }}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          </div>
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
                      {col.type === 'number' ? <Hash size={12} /> : col.type === 'date' ? <Calendar size={12} /> : <Type size={12} />}
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
                        style={{ 
                          background: 'rgba(15, 23, 42, 0.5)', 
                          border: 'none', 
                          color: '#fff', 
                          width: '100%', 
                          outline: 'none', 
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px'
                        }}
                      >
                        <option value="" style={{ background: '#0f172a', color: '#64748b' }}>선택...</option>
                        {useStore.getState().tacticalTemplates.find(t => t.id === col.templateId)?.options.split(',').map(opt => (
                          <option key={opt.trim()} value={opt.trim()} style={{ background: '#0f172a', color: '#fff' }}>
                            {opt.trim()}
                          </option>
                        ))}
                      </select>
                    ) : col.type === 'checkbox' ? (
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <input 
                          type="checkbox"
                          checked={!!row[col.id]} 
                          disabled={isLocked}
                          onChange={(e) => updateCell(row.id, col.id, e.target.checked)}
                          style={{ 
                            width: '18px', height: '18px', cursor: 'pointer',
                            accentColor: '#00e5ff'
                          }}
                        />
                      </div>
                     ) : col.type === 'image' ? (
                       <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', alignItems: 'center', minHeight: '40px' }}>
                         {(Array.isArray(row[col.id]) ? row[col.id] : (row[col.id] ? [row[col.id]] : [])).map((imgSrc, idx) => (
                           <div key={idx} style={{ position: 'relative' }}>
                             <img 
                               src={imgSrc} 
                               alt="첨부" 
                               style={{ height: '35px', borderRadius: '4px', cursor: 'zoom-in', border: '1px solid rgba(0, 229, 255, 0.3)', transition: 'transform 0.2s' }}
                               onClick={() => setPreviewImage(imgSrc)}
                               onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                               onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                             />
                             {!isLocked && (
                               <button 
                                 onClick={() => {
                                   const currentImages = Array.isArray(row[col.id]) ? [...row[col.id]] : [row[col.id]];
                                   currentImages.splice(idx, 1);
                                   updateCell(row.id, col.id, currentImages);
                                 }}
                                 style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '14px', height: '14px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                               >
                                 <X size={10} />
                               </button>
                             )}
                           </div>
                         ))}
                         {!isLocked && (
                           <label style={{ cursor: 'pointer', color: '#64748b', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <Plus size={16} />
                             <input 
                               type="file" 
                               accept="image/*" 
                               style={{ display: 'none' }} 
                               onChange={(e) => handleImageUpload(e, (newImg) => {
                                 const currentImages = Array.isArray(row[col.id]) ? [...row[col.id]] : (row[col.id] ? [row[col.id]] : []);
                                 updateCell(row.id, col.id, [...currentImages, newImg]);
                               })} 
                             />
                           </label>
                         )}
                       </div>
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
                {data.columns.map(col => (
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
                        style={{ 
                          background: 'rgba(0, 229, 255, 0.05)', 
                          border: 'none', 
                          color: '#00e5ff', 
                          width: '100%', 
                          outline: 'none', 
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px'
                        }}
                      >
                        <option value="" style={{ background: '#0f172a', color: '#64748b' }}>선택...</option>
                        {useStore.getState().tacticalTemplates.find(t => t.id === col.templateId)?.options.split(',').map(opt => (
                          <option key={opt.trim()} value={opt.trim()} style={{ background: '#0f172a', color: '#fff' }}>
                            {opt.trim()}
                          </option>
                        ))}
                      </select>
                    ) : col.type === 'checkbox' ? (
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <input 
                          type="checkbox"
                          checked={!!newRow[col.id]} 
                          onChange={(e) => handleInputChange(col.id, e.target.checked)}
                          style={{ 
                            width: '18px', height: '18px', cursor: 'pointer',
                            accentColor: '#00e5ff'
                          }}
                        />
                      </div>
                     ) : col.type === 'image' ? (
                       <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', alignItems: 'center', minHeight: '40px' }}>
                         {(Array.isArray(newRow[col.id]) ? newRow[col.id] : (newRow[col.id] ? [newRow[col.id]] : [])).map((imgSrc, idx) => (
                           <img 
                             key={idx}
                             src={imgSrc} 
                             alt="미리보기" 
                             style={{ height: '35px', borderRadius: '4px', border: '1px solid #00e5ff' }} 
                           />
                         ))}
                         <label style={{ cursor: 'pointer', color: '#00e5ff', background: 'rgba(0,229,255,0.1)', borderRadius: '4px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <Plus size={16} />
                           <input 
                             type="file" 
                             accept="image/*" 
                             style={{ display: 'none' }} 
                             onChange={(e) => handleImageUpload(e, (newImg) => {
                               const currentImages = Array.isArray(newRow[col.id]) ? [...newRow[col.id]] : (newRow[col.id] ? [newRow[col.id]] : []);
                               handleInputChange(col.id, [...currentImages, newImg]);
                             })} 
                           />
                         </label>
                       </div>
                     ) : (
                      <input 
                        type="text"
                        placeholder={`${col.name}...`}
                        value={newRow[col.id] || ''}
                        onChange={(e) => handleInputChange(col.id, e.target.value)}
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

      {/* 🖼️ [통합] 이미지 정밀 분석 모달 (지니어스 엔진: 시각적 가독성 극대화) */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(15px)',
            zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out', padding: '20px'
          }}
        >
          <div 
            className="preview-container"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              position: 'relative', 
              width: 'auto', 
              maxWidth: '95vw', 
              maxHeight: '95vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'modalScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <img 
              src={previewImage} 
              alt="정밀 분석" 
              style={{ 
                width: 'auto',
                height: 'auto',
                maxWidth: '100%', 
                maxHeight: '85vh', 
                borderRadius: '12px', 
                boxShadow: '0 0 70px rgba(0, 229, 255, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                objectFit: 'contain'
              }} 
            />
            
            <div style={{
              marginTop: '20px',
              padding: '10px 30px',
              background: 'rgba(0, 229, 255, 0.1)',
              border: '1px solid #00e5ff',
              borderRadius: '30px',
              color: '#00e5ff',
              fontSize: '13px',
              fontWeight: '900',
              letterSpacing: '3px',
              textShadow: '0 0 10px #00e5ff',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Maximize2 size={16} /> TACTICAL MAGNIFICATION MODE ACTIVE
            </div>

            <button 
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute', top: '-20px', right: '-20px',
                background: '#00e5ff', color: '#030712', border: 'none',
                borderRadius: '50%', width: '44px', height: '44px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 0 30px rgba(0, 229, 255, 0.6)',
                zIndex: 10001
              }}
            >
              <X size={28} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TacticalSheet;
