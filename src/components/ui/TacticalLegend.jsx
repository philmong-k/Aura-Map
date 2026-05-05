import React, { useState } from 'react';
import { HelpCircle, ChevronRight, ChevronDown, Info } from 'lucide-react';

const TacticalLegend = () => {
  const [isOpen, setIsOpen] = useState(false);

  const legendItems = [
    { name: '터미널', desc: '작전의 시작과 끝을 정의' },
    { name: '프로세스', desc: '일반적인 작업, 실행 또는 동작' },
    { name: '판단', desc: '조건에 따른 분기 (Yes/No)' },
    { name: '입출력', desc: '데이터의 입력 또는 결과 출력' },
    { name: '서브루틴', desc: '정의된 별도 절차나 작전 묶음' },
    { name: '데이터베이스', desc: '정보의 저장 또는 조회소' },
  ];

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      pointerEvents: 'none'
    }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1.5px solid rgba(0, 229, 255, 0.3)',
          borderRadius: '12px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          color: '#00e5ff',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          pointerEvents: 'all',
          transition: 'all 0.2s ease'
        }}
      >
        <HelpCircle size={18} />
        <span style={{ fontSize: '13px', fontWeight: '700' }}>전술 가이드</span>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </div>

      {isOpen && (
        <div style={{
          marginTop: '10px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '16px',
          width: '240px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          pointerEvents: 'all',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', color: '#94a3b8' }}>
            <Info size={14} />
            <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>기호 명칭 및 용도</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {legendItems.map((item, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '2px',
                paddingBottom: '8px',
                borderBottom: idx === legendItems.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)'
              }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#00e5ff' }}>{item.name}</span>
                <span style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>{item.desc}</span>
              </div>
            ))}
          </div>
          
          <div style={{ 
            marginTop: '16px', paddingTop: '12px', 
            borderTop: '1px solid rgba(255,255,255,0.05)',
            fontSize: '11px', color: '#00e5ff', opacity: 0.8,
            fontStyle: 'italic'
          }}>
            * 노드 좌상단 아이콘을 클릭하여 변경
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default TacticalLegend;
