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
  });

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
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
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
                border: label ? '1px solid #00e5ff' : '1px dashed rgba(0, 229, 255, 0.4)',
                backdropFilter: 'blur(8px)',
                minWidth: '40px',
                minHeight: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: label ? '0 0 10px rgba(0, 229, 255, 0.2)' : 'none',
                transition: 'all 0.2s ease',
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
