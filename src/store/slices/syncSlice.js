import { getProjectList, loadProjectData, LIST_KEY, STORAGE_KEY } from '../storeHelpers';

let syncTimer = null;

export const createSyncSlice = (set, get) => ({
  saveToStorage: (immediateSync = false) => {
    try {
      const { nodes, edges, currentProjectId, currentProjectName, projectList, syncToBackend } = get();
      if (!currentProjectId) return;

      const projectInfo = projectList.find(p => p.id === currentProjectId);
      const isLocked = projectInfo?.isLocked || false;
      const lastModified = new Date().toISOString();

      const projectData = JSON.stringify({ 
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        isLocked,
        lastModified 
      });
      
      localStorage.setItem(`${STORAGE_KEY}-${currentProjectId}`, projectData);
      localStorage.setItem('aura-map-last-project-id', currentProjectId);
      
      const list = getProjectList();
      const existingIndex = list.findIndex(p => p.id === currentProjectId);

      if (existingIndex > -1) {
        list[existingIndex].lastModified = lastModified;
        list[existingIndex].name = currentProjectName;
      } else {
        list.push({
          id: currentProjectId,
          name: currentProjectName,
          lastModified: lastModified,
          isLocked: isLocked,
          isRemote: false
        });
      }
      
      localStorage.setItem(LIST_KEY, JSON.stringify(list));
      set({ projectList: list });

      if (syncTimer) clearTimeout(syncTimer);
      
      if (immediateSync) {
        syncToBackend(currentProjectId);
      } else {
        syncTimer = setTimeout(() => {
          syncToBackend(currentProjectId);
        }, 3000); 
      }
    } catch (error) {
      console.error('🚨 데이터 저장 실패:', error);
    }
  },

  syncToBackend: async (projectId) => {
    const { nodes, edges, currentProjectId, currentProjectName, projectList } = get();
    const targetId = projectId || currentProjectId;
    if (!targetId) return;

    const BACKEND_URL = import.meta.env.VITE_QUARK_CORE_URL;
    if (!BACKEND_URL) return;

    const projectInfo = projectList.find(p => p.id === targetId);
    if (!projectInfo) return;

    let syncNodes = nodes;
    let syncEdges = edges;
    let syncName = currentProjectName;

    if (targetId !== currentProjectId) {
      const storedData = loadProjectData(targetId);
      if (!storedData) return;
      syncNodes = storedData.nodes;
      syncEdges = storedData.edges;
      syncName = projectInfo.name;
    }

    try {
      await fetch(`${BACKEND_URL}/api/tactical/sync`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_TACTICAL_API_KEY}`,
          'X-Device-Id': navigator.userAgent
        },
        body: JSON.stringify({
          projectId: targetId,
          projectName: syncName,
          data: { 
            nodes: syncNodes, 
            edges: syncEdges, 
            isLocked: projectInfo.isLocked || false 
          },
          lastModified: new Date().toISOString()
        })
      });
      console.log(`✅ [${syncName}] 백엔드 동기화 성공`);
    } catch (error) {
      console.warn('⚠️ 동기화 실패:', error.message);
    }
  },

  deleteFromBackend: async (projectId) => {
    const BACKEND_URL = import.meta.env.VITE_QUARK_CORE_URL;
    if (!BACKEND_URL) return;

    try {
      await fetch(`${BACKEND_URL}/api/tactical/delete/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_TACTICAL_API_KEY}`
        }
      });
    } catch (error) {
      console.warn('⚠️ 백엔드 삭제 실패:', error.message);
    }
  },

  loadFromBackend: async () => {
    const BACKEND_URL = import.meta.env.VITE_QUARK_CORE_URL;
    if (!BACKEND_URL) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/tactical/load`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_TACTICAL_API_KEY}`
        }
      });

      if (!response.ok) throw new Error('데이터 불러오기 실패');
      
      let remoteProjects = await response.json();

      const blueprintId = 'proj-aura-master-plan-v3';
      const blueprintName = '제국 설계도 V3 - C타입 파이프라인';
      const blueprintPath = '/canvas/scenario_c_blueprint.json';

      if (!remoteProjects.find(p => p.id === blueprintId)) {
        try {
          const bpRes = await fetch(blueprintPath);
          if (bpRes.ok) {
            const bpData = await bpRes.json();
            remoteProjects.unshift({
              id: blueprintId,
              name: blueprintName,
              data: bpData,
              lastModified: new Date().toISOString()
            });
          }
        } catch (e) {
          console.error('Blueprint Auto-Load Failed', e);
        }
      }

      if (remoteProjects.length > 0) {
        const localList = getProjectList();
        const mergedList = [...localList];

        remoteProjects.forEach(remote => {
          const index = mergedList.findIndex(p => p.id === remote.id);
          const remoteName = remote.name || '알 수 없는 작전';
          const remoteData = typeof remote.data === 'string' ? JSON.parse(remote.data) : remote.data;
          const remoteIsLocked = remoteData?.isLocked || false;

          if (index === -1) {
            mergedList.push({ 
              id: remote.id, 
              name: remoteName, 
              lastModified: remote.lastModified, 
              isRemote: true,
              isLocked: remoteIsLocked
            });
          } else {
            mergedList[index] = {
              ...mergedList[index],
              lastModified: remote.lastModified,
              isRemote: true,
              isLocked: remoteIsLocked
            };
            if (['default', '기본 작전', '새 전술 계획'].includes(mergedList[index].name)) {
              if (!['default', '기본 작전'].includes(remoteName)) {
                mergedList[index].name = remoteName;
              }
            }
          }
          localStorage.setItem(`${STORAGE_KEY}-${remote.id}`, JSON.stringify({
            ...remoteData,
            lastModified: remote.lastModified
          }));
        });

        const remoteIds = remoteProjects.map(p => p.id);
        const finalList = mergedList.filter(p => !p.isRemote || remoteIds.includes(p.id));

        localStorage.setItem(LIST_KEY, JSON.stringify(finalList));
        set({ projectList: finalList });

        const { currentProjectId, nodes: localNodes } = get();
        const currentRemote = remoteProjects.find(p => p.id === currentProjectId);
        
        if (currentRemote) {
          const localData = loadProjectData(currentProjectId);
          const remoteTime = new Date(currentRemote.lastModified).getTime();
          const localTime = localData?.lastModified ? new Date(localData.lastModified).getTime() : 0;

          if (remoteTime > localTime) {
            const remoteData = typeof currentRemote.data === 'string' ? JSON.parse(currentRemote.data) : currentRemote.data;
            const remoteNodes = remoteData.nodes || [];
            
            const remoteHasSheet = remoteNodes.some(n => n.data?.sheet && n.data.sheet.rows?.length > 0);
            const localHasSheet = localNodes.some(n => n.data?.sheet && n.data.sheet.rows?.length > 0);

            if (localHasSheet && !remoteHasSheet) {
              console.warn(`⚠️ [${currentProjectId}] 서버 데이터 무결성 의심 (장부 누락).`);
              return;
            }

            set({
              nodes: remoteNodes,
              edges: remoteData.edges || []
            });
            console.log(`📡 [${currentProjectId}] 서버 데이터 동기화 완료.`);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ 백엔드 로드 실패:', error.message);
    }
  },
});
