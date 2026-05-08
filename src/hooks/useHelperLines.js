import { useState, useCallback } from 'react';

export const useHelperLines = (getNodes) => {
  const [helperLines, setHelperLines] = useState({ x: null, y: null });

  const onNodeDrag = useCallback((_, node) => {
    const allNodes = getNodes();
    const threshold = 10;
    const lines = { x: null, y: null };
    
    allNodes.forEach((otherNode) => {
      if (otherNode.id === node.id || otherNode.type === 'auraGroup') return;
      
      // X축 정렬
      if (Math.abs(otherNode.position.x - node.position.x) < threshold) {
        lines.x = otherNode.position.x;
      }
      
      // Y축 정렬
      if (Math.abs(otherNode.position.y - node.position.y) < threshold) {
        lines.y = otherNode.position.y;
      }
    });
    
    setHelperLines(lines);
  }, [getNodes]);

  const onNodeDragStop = useCallback(() => {
    setHelperLines({ x: null, y: null });
  }, []);

  return { helperLines, onNodeDrag, onNodeDragStop };
};
