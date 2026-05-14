import React, { useRef, useState } from 'react';
import { useFlowStore } from '../store/useFlowStore';
import { useAuthStore } from '../store/useAuthStore';
import { usePermissions } from '../logic/usePermissions';
import { toPng } from 'html-to-image';
import { useReactFlow, getNodesBounds, getViewportForBounds } from '@xyflow/react';

export const TacticalIO = () => {
  const { canEdit } = usePermissions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { nodes, edges, snapshots, setNodes, setEdges, setSnapshots } = useFlowStore();
  const { token, user } = useAuthStore();
  const { getNodes } = useReactFlow();

  const currentUserId = user?.email || 'guest';
  const [bgType, setBgType] = useState<'transparent' | 'dark' | 'white'>('transparent');

  const handleImageExport = () => {
    const nodes = getNodes();
    if (nodes.length === 0) {
      alert('캡처할 전술 노드가 존재하지 않습니다.');
      return;
    }

    const nodesBounds = getNodesBounds(nodes);
    const padding = 50;
    const width = nodesBounds.width + padding * 2;
    const height = nodesBounds.height + padding * 2;

    const transform = getViewportForBounds(
      nodesBounds,
      width,
      height,
      0.5,
      2,
      0.1
    );

    const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewportElement) return;

    let selectedColor = 'transparent';
    if (bgType === 'dark') selectedColor = '#0a0a0b';
    if (bgType === 'white') selectedColor = '#ffffff';

    toPng(viewportElement, {
      backgroundColor: selectedColor,
      width: width,
      height: height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
      },
      filter: (node: HTMLElement) => {
        if (node.classList?.contains('react-flow__panel')) return false;
        if (node.classList?.contains('react-flow__controls')) return false;
        return true;
      },
    }).then((dataUrl) => {
      const link = document.createElement('a');
      link.download = `tactical_photo_${bgType}_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    }).catch((err) => {
      console.error('Image Export Error:', err);
      alert('이미지 생성 중 오류가 발생했습니다.');
    });
  };

  const handleExport = () => {
    try {
      const flowData = JSON.stringify({ nodes, edges }, null, 2);
      const blob = new Blob([flowData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `tactical_map_${dateStr}.json`;
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      alert('전술 추출 실패: 시스템 오류');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsedData = JSON.parse(e.target?.result as string);
        if (parsedData.nodes && Array.isArray(parsedData.nodes) && parsedData.edges && Array.isArray(parsedData.edges)) {
          setNodes(parsedData.nodes);
          setEdges(parsedData.edges);
          alert('✅ 전술 데이터 복원 완료. 즉각 배치를 시작합니다!');
        } else {
          alert('⚠️ 무효 전술 파일: 개체 식별 불가');
        }
      } catch (error) {
        alert('⚠️ 복원 실패: 데이터가 오염되었거나 규격에 맞지 않습니다.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // --- 🚀 모바일 감지 ---
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const btnStyle: React.CSSProperties = {
    padding: isMobile ? '6px 10px' : '8px 16px',
    cursor: 'pointer',
    borderRadius: '8px',
    fontSize: isMobile ? '10px' : '12px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '8px' : '12px',
      background: 'rgba(15, 15, 20, 0.75)',
      backdropFilter: 'blur(15px)',
      padding: isMobile ? '8px' : '10px 16px',
      borderRadius: '12px',
      border: '1px solid rgba(0, 229, 255, 0.15)',
      alignItems: 'center',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      maxWidth: '100%'
    }}>
      {/* 💾 Local Data Section */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={handleExport} style={{ ...btnStyle, background: 'rgba(0, 230, 118, 0.08)', color: '#00e676', border: '1px solid rgba(0, 230, 118, 0.3)' }}>
          💾 BACKUP
        </button>
        {canEdit && (
          <button onClick={() => fileInputRef.current?.click()} style={{ ...btnStyle, background: 'rgba(79, 195, 247, 0.08)', color: '#4fc3f7', border: '1px solid rgba(79, 195, 247, 0.3)' }}>
            📂 RESTORE
          </button>
        )}
      </div>

      <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.15)' }} />

      {/* 📸 Export Options Section */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <select
          value={bgType}
          onChange={(e) => setBgType(e.target.value as any)}
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            color: '#b0bec5',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            padding: '6px 8px',
            fontSize: '11px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="transparent">🫥 TRANSPARENT</option>
          <option value="dark">🌙 DARK NEON</option>
          <option value="white">📄 DOC WHITE</option>
        </select>

        <button
          onClick={handleImageExport}
          style={{
            ...btnStyle,
            background: 'rgba(255, 235, 59, 0.1)',
            color: '#ffeb3b',
            border: '1px solid rgba(255, 235, 59, 0.4)',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 235, 59, 0.2)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 235, 59, 0.1)')}
        >
          📸 PHOTO EXPORT
        </button>
      </div>

      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleImport}
        style={{ display: 'none' }}
      />
    </div>
  );
};