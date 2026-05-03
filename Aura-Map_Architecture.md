# Aura-Map Tactical Canvas: Architecture & Roadmap

## 1. 개요 (Overview)
**Aura-Map**은 고성능 `React Flow v12` 엔진을 기반으로 한 모바일 우선 전술 플로우차트 애플리케이션입니다. '기록(Writing)'과 '시각화(Visualization)'의 균형을 맞춘 하이브리드 노드 시스템과 프리미엄 Glassmorphism UI를 특징으로 합니다.

## 2. 핵심 아키텍처 (Core Architecture)

### 2.1 하이브리드 전술 노드 (TacticalNode)
- **컨텍스트 배지**: 좌측 상단의 전술 기호 배지를 클릭하여 6종의 도형(공정, 결정, 입출력 등)을 순환 변경.
- **기록 최적화**: 본체는 가로형 직사각형으로 고정하여 텍스트 입력 효율 극대화.

### 2.2 전술 섹터 관리 (AuraGroup)
- **부대 편성**: 여러 노드를 묶어 일괄 이동 및 관리.
- **전술적 압축 (Collapse)**: 복잡한 섹터를 요약 카드로 축소.
- **보급로 재라우팅**: 압축 시 외부 연결선을 섹터 본체로 자동 재배치.
- **상시 노출 메모장**: 섹터 외부 하단에 상세 작전 지침을 기록하는 상시 노출 패널.

### 2.3 지능형 레이아웃 엔진 (AI Engine)
- **자동 정렬 (Dagre)**: 논리적 흐름에 따라 노드들을 계층 구조로 자동 재배치.
- **스마트 스냅 (Snap Lines)**: 드래그 시 수평/수직 정렬 가이드 라인 제공.

### 2.4 전술 아카이브 시스템 (Tactical Archive) [v4.5 PLATINUM]
- **멀티 프로젝트 스토리지**: 단일 저장소 구조에서 ID 기반의 다중 프로젝트 관리 구조로 진화.
- **작전 도서관 (Library)**: 사이드바를 통한 프로젝트 목록 조회, 로딩, 삭제 및 이름 변경 기능.
- **데이터 무결성**: 프로젝트 메타데이터(이름, 수정일)와 실제 캔버스 데이터를 분리하여 관리.

### 2.5 전용 인프라 상세 (Dedicated Infrastructure) [NEW]
- **GitHub Self-hosted Runner**: 
    - **배치 경로**: `C:\Users\slo76\My_projects\Aura-Map\runner`
    - **설정 명칭**: `Aura-Runner-01` (Unattended Mode)
    - **배치 사유**: 
        - **하드웨어 가속**: Intel Core Ultra 7(NPU) 자원을 활용한 고속 빌드 및 향후 AI 분석 엔진 구동 최적화.
        - **백엔드 통신**: 동일 호스트 내 `Quark-Core` 백엔드와의 물리적 근접성을 통한 실시간 동기화 효율 극대화.
- **배포 영토 (Deployment Target)**:
    - **경로**: WSL2 Ubuntu 내 `~/aura-map` (권한 최적화된 사용자 홈 디렉토리 활용).
    - **라우팅**: Nginx를 통해 `dev.philmong.co.kr/canvas/` 정적 배포본으로 서비스.
- **CI/CD 워크플로우**: `.github/workflows/deploy.yml`을 통한 자동 빌드 및 검증 시스템 구축.


## 3. 데이터 및 영속성 (Persistence)
- **LocalStorage**: `aura-map-project-list` 및 `aura-map-tactical-data-<id>` 키를 사용한 체계적 저장.
- **JSON Import/Export**: 작전 지도의 파일 기반 백업 및 복구.
- **지능형 초기화**: 빈 캔버스에서 첫 노드 생성 시 자동으로 '작전 시작(원형)' 기호 부여.

## 4. 향후 로드맵 (Roadmap)
- [ ] **AI 전술 브릿지**: LLM 에이전트 연동을 통한 작전 논리 분석 및 대화형 수정.
- [ ] **전술 템플릿 갤러리**: 자주 쓰이는 논리 구조의 사전 정의된 템플릿 제공.
- [ ] **실시간 공동 지휘**: 웹소켓 기반의 멀티 유저 동시 접속 환경 구축.

---
*최종 업데이트: 2026-05-03 (v4.5 PLATINUM)*
