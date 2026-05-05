import React, { useState } from 'react';
import { 
  BaseEdge, 
  EdgeLabelRenderer, 
  getSmoothStepPath,
  useInternalNode
} from '@xyflow/react';
import useStore from '../store/useStore';

const TacticalEdge = (props) => {
  const {
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
    selected
  } = props;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
    borderRadius: 0, 
  });

  const sourceNode = useStore((state) => state.nodes.find(n => n.id === source));
  const targetNode = useStore((state) => state.nodes.find(n => n.id === target));
  
  // 지능형 선 스타일링: 흐름과 참조를 시각적으로 명확히 분리하면서도 생동감 유지
  const isDataEdge = sourceNode?.data?.shape === 'database' || targetNode?.data?.shape === 'database';
  const edgeStyle = {
    ...style,
    // 더 밝은 색상 적용 (Cyan -> #22d3ee, Purple -> #c084fc)
    stroke: isDataEdge ? '#c084fc' : (style.stroke || '#22d3ee'),
    strokeWidth: 2,
    // 일반 선은 '촘촘한 점선'으로 활발히 흐르게, 데이터 선은 '긴 점선'으로 우아하게 흐르게
    strokeDasharray: isDataEdge ? '12,6' : '5,5',
    // 애니메이션 속도: 일반 선 0.6초(매우 빠름), 데이터 선 2초(부드러운 흐름)
    animationDuration: isDataEdge ? '2s' : '0.6s',
  };

  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data?.label || '');
  const updateEdgeLabel = useStore((state) => state.updateEdgeLabel);

  const onLabelChange = (evt) => setLabel(evt.target.value);
  const onLabelBlur = () => {
    setIsEditing(false);
    updateEdgeLabel(id, label);
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {isEditing ? (
            <input
              value={label}
              onChange={onLabelChange}
              onBlur={onLabelBlur}
              autoFocus
              style={{
                background: '#0f172a',
                border: '1px solid #00e5ff',
                color: '#fff',
                fontSize: '11px',
                padding: '2px 4px',
                borderRadius: '4px',
                outline: 'none',
                width: '80px',
                textAlign: 'center'
              }}
            />
          ) : (
            <div
              onDoubleClick={() => setIsEditing(true)}
              style={{
                background: label ? 'rgba(15, 23, 42, 0.9)' : 'rgba(0, 229, 255, 0.05)',
                color: '#00e5ff',
                fontSize: '11px',
                fontWeight: 'bold',
                padding: '4px 8px',
                borderRadius: '6px',
                cursor: 'text',
                border: label ? `1.5px solid ${isDataEdge ? '#c084fc' : '#22d3ee'}` : '1px dashed rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(12px)',
                minWidth: '40px',
                minHeight: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: label ? `0 0 15px ${isDataEdge ? 'rgba(192, 132, 252, 0.3)' : 'rgba(34, 211, 238, 0.3)'}` : 'none',
                transition: 'all 0.2s ease',
                textShadow: '0 1px 3px rgba(0,0,0,0.8)'
              }}
            >
              {label || (selected ? '입력' : '+')}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default TacticalEdge;
