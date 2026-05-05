# Agent Canvas Tactical Console: Architecture & Roadmap

## 1. 개요 (Overview)
**Agent Canvas**는 고성능 `React Flow v12` 엔진을 기반으로 한 통합 전술 설계 및 시각화 도구입니다. 구 'Aura-Map'의 강력한 편집 기능과 'Agent Canvas'의 모바일 시각화 철학을 하나로 통합하여, 기획부터 현장 통제까지 끊김 없는 사용자 경험을 제공합니다.

## 2. 핵심 아키텍처 (Core Architecture)

### 2.1 하이브리드 전술 노드 (TacticalNode)
*   **컨텍스트 배지**: 좌측 상단의 전술 기호 배지를 클릭하여 6종의 도형(공정, 결정, 입출력 등)을 순환 변경.
*   **기록 최적화**: 본체는 가로형 직사각형으로 고정하여 텍스트 입력 효율 극대화.

### 2.2 전술 섹터 관리 (AuraGroup)
*   **부대 편성**: 여러 노드를 묶어 일괄 이동 및 관리.
*   **전술적 압축 (Collapse)**: 복잡한 섹터를 요약 카드로 축소.
*   **보급로 재라우팅**: 압축 시 외부 연결선을 섹터 본체로 자동 재배치.

### 2.3 지능형 레이아웃 엔진 (AI Engine)
*   **자동 정렬 (Dagre)**: 논리적 흐름에 따라 노드들을 계층 구조로 자동 재배치.
*   **스마트 스냅 (Snap Lines)**: 드래그 시 수평/수직 정렬 가이드 라인 제공.

### 2.4 전술 아카이브 시스템 (Tactical Archive) [PLATINUM]
*   **멀티 프로젝트 스토리지**: ID 기반의 다중 프로젝트 관리 구조.
*   **작전 저장소 (Library)**: 사이드바를 통한 프로젝트 목록 조회, 로딩, 삭제 및 이름 변경 기능.
*   **데이터 무결성**: 로컬 스토리지와 Quark-Core 백엔드(`aura_db`) 실시간 동기화.

### 2.5 반응형 UI 모듈화 (Responsive UI)
*   **컴포넌트 분리**: `TopNavigationBar`, `TacticalControlBar`, `ProjectLibrarySidebar`로 UI를 모듈화하여 유지보수성 향상.
*   **스마트 서랍 (Smart Drawer)**: 🔧 아이콘으로 하단 툴바를 제어하여 모바일 시야 확보.
*   **편의 기능**: 모바일 다중 선택 모드 및 클립보드(복사/붙여넣기) 기능 탑재.

### 2.6 전용 인프라 상세 (Dedicated Infrastructure)
*   **GitHub 연동**: `https://github.com/philmong-k/Aura-Map.git` (저장소 명칭 유지)
*   **GitHub Self-hosted Runner**: 
    *   **경로**: `C:\Users\slo76\My_projects\agent-canvas\runner`
    *   **설정 명칭**: `Aura-Runner-01`
*   **배포 영토 (Deployment Target)**:
    *   **경로**: WSL2 Ubuntu 내 `~/aura-map` (Nginx 정적 서빙)
    *   **라우팅**: `philmong.co.kr/canvas/` (통합 도메인)

## 3. 데이터 및 영속성 (Persistence)
*   **LocalStorage**: `aura-map-project-list` 키를 사용한 체계적 관리.
*   **JSON API**: `/api/tactical/sync` 엔드포인트를 통한 중앙 집중형 저장.

## 4. 향후 로드맵 (Roadmap)
*   [ ] **인텔리전트 대시보드 (v5.0)**: 연산 가능한 스프레드시트 모달 구현.
*   [ ] **AI 전술 분석**: LLM 연동을 통한 작전 논리 검증 및 자동 최적화 제안.

---
*최종 업데이트: 2026-05-04 (Unified Platinum Edition)*
