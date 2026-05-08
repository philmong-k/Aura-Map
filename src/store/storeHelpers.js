
// 로컬 스토리지 키 정의
export const STORAGE_KEY = 'aura-map-tactical-data';
export const LIST_KEY = 'aura-map-project-list';

// 프로젝트 목록 불러오기
export const getProjectList = () => {
  const list = localStorage.getItem(LIST_KEY);
  return list ? JSON.parse(list) : [];
};

// 특정 프로젝트 데이터 불러오기
export const loadProjectData = (id) => {
  const data = localStorage.getItem(`${STORAGE_KEY}-${id}`);
  return data ? JSON.parse(data) : null;
};
