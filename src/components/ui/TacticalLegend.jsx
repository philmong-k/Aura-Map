import { HelpCircle, ChevronRight, ChevronDown, Info, X } from 'lucide-react';

const TacticalLegend = ({ isOpen, onClose }) => {
  const legendItems = [
    { name: '터미널', desc: '작전의 시작과 끝을 정의' },
    { name: '프로세스', desc: '일반적인 작업, 실행 또는 동작' },
    { name: '판단', desc: '조건에 따른 분기 (Yes/No)' },
    { name: '입출력', desc: '데이터의 입력 또는 결과 출력' },
    { name: '서브루틴', desc: '정의된 별도 절차나 작전 묶음' },
    { name: '데이터베이스', desc: '정보의 저장 또는 조회소' },
    { name: '전술 구역', desc: '노드들을 묶어 관리하는 그룹 영역' },
  ];

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '70px',
      right: '20px',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: 'rgba(15, 23, 42, 0.98)',
        backdropFilter: 'blur(30px)',
        border: '1.5px solid rgba(0, 229, 255, 0.3)',
        borderRadius: '20px',
        padding: '20px',
        width: '260px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00e5ff' }}>
            <HelpCircle size={18} />
            <span style={{ fontSize: '14px', fontWeight: '900' }}>전술 가이드</span>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={14} />
          </button>
        </div>
        
        <div className="legend-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px' }}>
          {legendItems.map((item, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '4px',
              paddingBottom: '10px',
              borderBottom: idx === legendItems.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)'
            }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#00e5ff' }}>{item.name}</span>
              <span style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>{item.desc}</span>
            </div>
          ))}
        </div>
        
        <div style={{ 
          marginTop: '15px', paddingTop: '12px', 
          borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: '11px', color: '#00e5ff', opacity: 0.7,
          fontStyle: 'italic', textAlign: 'center'
        }}>
          * 노드 좌상단 아이콘을 클릭하여 기호 변경
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .legend-scroll::-webkit-scrollbar { width: 4px; }
        .legend-scroll::-webkit-scrollbar-thumb { background: rgba(0, 229, 255, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default TacticalLegend;
