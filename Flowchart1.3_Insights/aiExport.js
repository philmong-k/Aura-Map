import { state } from './store.js';

export function showToast(message) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
        if (container.children.length === 0) container.remove();
    }, 3000);
}

export function copyForAI(mode = 'json') {
    const cleanNodes = state.nodes.map(n => {
        const d = n.data;
        const node = { node_id: d.id, node_type: d.type, label: d.text };
        if (d.ui) node.ui_description = d.ui;
        if (d.data_in) node.input_data = d.data_in;
        if (d.logic) node.business_logic = d.logic;
        if (d.condition) node.decision_condition = d.condition;
        if (d.table) node.database_table = d.table;
        if (d.schema) node.data_schema = d.schema;
        if (d.event) node.trigger_event = d.event;
        return node;
    });

    const cleanFlows = state.connections.map(c => ({
        from_node: c.fromId, to_node: c.toId, flow_theme: c.theme || 'normal', flow_label: c.label || ''
    }));

    const jsonString = JSON.stringify({ nodes: cleanNodes, flows: cleanFlows }, null, 2);

    let finalPrompt = "";
    if (mode === 'review') {
        finalPrompt = `너는 15년 차 시니어 IT 서비스 기획자이자 UX 컨설턴트야.
코딩을 모르는 일반인이 작성한 아래의 [초기 기획 흐름도 JSON]을 분석해서 기획을 발전시켜 줘.
1. 문제점 진단: 끊긴 흐름, 누락된 예외 처리, UX 개선점을 제안해.
2. 대화형 발전: 사용자의 동의나 추가 아이디어를 기획에 반영해.
3. [핵심]: 기획 합의가 완료되면 절대 부분 조각을 주지 말고, 복사해서 한 번에 덮어쓸 수 있는 [전체 기획 흐름도 JSON (Full JSON)] 코드 딱 하나만 마크다운으로 출력해 줘.

[초기 기획 흐름도 JSON]
${jsonString}`;
    } else if (mode === 'dev') {
        finalPrompt = `너는 10년 차 시니어 소프트웨어 아키텍트이자 프론트엔드 개발자야.
아래의 [서비스 기획 흐름도 JSON]을 분석해서 프로젝트의 초기 뼈대를 세팅해 줘.
1. 폴더/파일 구조를 트리 형태로 제시해.
2. 라우팅 세팅과 빈 컴포넌트 파일들만 생성해 (세부 구현 금지).
3. [핵심]: "중간에 삽입하세요" 같은 지시는 절대 금지해. 반드시 생성해야 할 파일의 이름과, 복사해서 한 번에 덮어쓸 수 있는 [완전한 풀 코드]만 제공해 줘.

[서비스 기획 흐름도 JSON]
${jsonString}`;
    } else {
        finalPrompt = jsonString; 
    }

    navigator.clipboard.writeText(finalPrompt).then(() => {
        const modeNames = { 'review': '🔍 기획 검토용', 'dev': '💻 개발 가이드용', 'json': '📄 순수 JSON' };
        showToast(`${modeNames[mode]} 프롬프트가 복사되었습니다!`);
    });
}

export function toggleAiMenu(e) {
    if (e) e.stopPropagation();
    state.aiMenu.classList.toggle('active');
}

export function handleAiMenuClick(e) {
    const item = e.target.closest('.ai-menu-item');
    if (item) {
        const mode = item.dataset.mode;
        copyForAI(mode);
        state.aiMenu.classList.remove('active');
    }
}

export function bindAiEvents() {
    state.aiBtn.addEventListener('click', toggleAiMenu);
    state.aiMenu.addEventListener('click', handleAiMenuClick);
}
