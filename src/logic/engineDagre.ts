import dagre from 'dagre';

/**
 * Dagre 물리 엔진을 통한 노드 자동 정렬 수식
 * @param nodes 현재 캔버스의 모든 노드
 * @param edges 현재 캔버스의 모든 엣지
 * @param direction 정렬 방향 (기본: 'TB' Top-Bottom)
 * @returns 정렬이 완료된 노드 배열
 */
export function executeDagreLayout(nodes: any[], edges: any[], direction: 'TB' | 'LR' = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 250;
  const nodeHeight = 150;

  dagreGraph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 50 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return layoutedNodes;
}
