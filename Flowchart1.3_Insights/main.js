import { loadFromLocalStorage } from './store.js';
import { initCenter } from './canvasRenderer.js';
import { bindGlobalEvents } from './events.js';
import { bindAiEvents } from './aiExport.js';
import { bindCaptureEvents } from './imageExport.js';

// [Phase 6.0] 아키텍처 대공사: 진입점 통합
// 더 이상 기능 로직을 main.js에 두지 않습니다.
function init() {
    initCenter();
    loadFromLocalStorage();
    bindGlobalEvents();
    bindAiEvents();
    bindCaptureEvents();
}

// 브라우저 DOM이 준비된 후 실행되도록 보장 (type="module"은 기본적으로 defer 적용됨)
init();
