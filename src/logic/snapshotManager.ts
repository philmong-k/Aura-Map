import type { Snapshot } from '../store/useFlowStore';

/**
 * 스냅샷 객체를 생성합니다.
 * @param name 스냅샷 이름
 * @param nodes 복제할 노드 배열
 * @param edges 복제할 엣지 배열
 * @returns 생성된 Snapshot 객체
 */
export function createSnapshot(name: string, nodes: any[], edges: any[]): Snapshot {
  return {
    id: `snap-${Date.now()}`,
    name,
    timestamp: Date.now(),
    nodes: [...nodes],
    edges: [...edges],
  };
}

/**
 * 선택된 노드(및 그 자식들)의 데이터를 추출하여 JSON 문자열로 반환합니다.
 * @param nodes 현재 노드 배열
 * @param edges 현재 엣지 배열
 * @returns 선택된 데이터의 JSON, 개수, 부분 추출 여부
 */
export function extractSelectedFlowData(nodes: any[], edges: any[]) {
  const selectedNodes = nodes.filter(n => n.selected);
  
  if (selectedNodes.length === 0) {
    // 선택된 노드가 없으면 전체 데이터 반환
    return { 
      json: JSON.stringify({ nodes, edges }, null, 2), 
      count: nodes.length,
      isPartial: false
    };
  }

  // 선택된 노드들 중 그룹이 있다면 그 자식 노드들도 포함
  const groupIds = selectedNodes.filter(n => n.type === 'group').map(g => g.id);
  const childrenNodes = nodes.filter(n => n.parentId && groupIds.includes(n.parentId));
  
  // 중복 제거 및 최종 노드 목록 확정
  const finalNodesMap = new Map();
  [...selectedNodes, ...childrenNodes].forEach(n => finalNodesMap.set(n.id, n));
  const finalNodes = Array.from(finalNodesMap.values());
  
  // 최종 노드들 사이의 연결선만 추출
  const nodeIds = new Set(finalNodes.map(n => n.id));
  const finalEdges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

  return { 
    json: JSON.stringify({ nodes: finalNodes, edges: finalEdges }, null, 2), 
    count: finalNodes.length,
    isPartial: true
  };
}

/**
 * 외부에서 입력된 JSON 플로우차트 데이터를 파싱하고 무결성을 검증합니다.
 * @param jsonString 입력받은 JSON 문자열
 * @returns 파싱된 nodes와 edges 배열, 그리고 에러 메시지
 */
export function parseImportedFlowData(jsonString: string): { nodes: any[], edges: any[], error: string | null } {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.nodes && parsed.edges) {
      return { nodes: parsed.nodes, edges: parsed.edges, error: null };
    } else {
      return { nodes: [], edges: [], error: '데이터 규격이 일치하지 않습니다. (nodes 및 edges 필수)' };
    }
  } catch (error) {
    return { nodes: [], edges: [], error: '유효하지 않은 JSON 포맷입니다.' };
  }
}

