/**
 * 선택된 노드들을 묶어 그룹으로 생성합니다.
 * @param nodes 현재 노드 배열
 * @param groupLabel 생성할 그룹의 이름
 * @returns 그룹 노드가 추가된 새 노드 배열
 */
export function groupSelectedNodes(nodes: any[], groupLabel: string): any[] {
  const selectedNodes = nodes.filter(n => n.selected && !n.parentId); 
  
  if (selectedNodes.length === 0) {
    throw new Error('그룹화할 최상위 노드를 선택해주세요.');
  }

  const minX = Math.min(...selectedNodes.map(n => n.position.x));
  const minY = Math.min(...selectedNodes.map(n => n.position.y));
  const maxX = Math.max(...selectedNodes.map(n => n.position.x + (n.measured?.width || 250)));
  const maxY = Math.max(...selectedNodes.map(n => n.position.y + (n.measured?.height || 150)));

  const padding = 40;
  const groupX = minX - padding;
  const groupY = minY - padding;
  const groupWidth = maxX - minX + padding * 2;
  const groupHeight = maxY - minY + padding * 2;

  const newGroupId = `group-${Date.now()}`;
  const newGroupNode = {
    id: newGroupId,
    type: 'group',
    position: { x: groupX, y: groupY },
    style: { width: groupWidth, height: groupHeight },
    data: { label: groupLabel },
  };

  const updatedNodes = nodes.map(n => {
    if (selectedNodes.find(sn => sn.id === n.id)) {
      return {
        ...n,
        parentId: newGroupId,
        extent: 'parent',
        position: { x: n.position.x - groupX, y: n.position.y - groupY },
        selected: false,

      };
    }
    return n;
  });

  // ReactFlow 구조상 부모 노드(Group)가 자식 노드보다 배열의 선행에 선언되어야 좌표계가 정상 동기화됨.
  return [newGroupNode, ...updatedNodes];
}

/**
 * 선택된 그룹을 해제하고 자식 노드들을 밖으로 꺼냅니다.
 * @param nodes 현재 노드 배열
 * @returns 그룹 노드가 해제/제거된 새 노드 배열
 */
export function ungroupSelectedNodes(nodes: any[]): any[] {
  const selectedGroups = nodes.filter(n => n.selected && n.type === 'group');

  if (selectedGroups.length === 0) {
    throw new Error('해제할 그룹을 선택해주세요.');
  }

  const groupIds = selectedGroups.map(g => g.id);

  const restoredNodes = nodes.map(n => {
    if (n.parentId && groupIds.includes(n.parentId)) {
      const parent = selectedGroups.find(g => g.id === n.parentId);
      return {
        ...n,
        parentId: undefined,
        extent: undefined,
        position: {

          x: n.position.x + (parent?.position.x || 0),
          y: n.position.y + (parent?.position.y || 0)
        },
        selected: true
      };
    }
    return n;
  });

  const finalNodes = restoredNodes.filter(n => !groupIds.includes(n.id));
  return finalNodes;
}
