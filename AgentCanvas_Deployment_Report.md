# 📋 Agent Canvas v4.6.1-PLATINUM 배포 및 정합성 보고서

**작전명**: Tactical Asset Management Expansion (TAME)
**작전 일시**: 2026.05.14
**보고자**: 안티그래비티 (Antigravity Protocol)

---

## 1. 전술적 환경 정의 (Infrastructure Topology)

현재 지휘 체계에서 관리되는 모든 경로와 접근 포인트의 최신 현황입니다.

| 구분 | 환경 | 물리적 경로 (Path) | 네트워크 주소 (URL) |
| :--- | :--- | :--- | :--- |
| **Source of Truth** | **Windows Local** | `c:\Users\slo76\My_projects\agent-canvas` | `http://localhost:5173/canvas/` |
| **Staging (WSL2)** | **Ubuntu Source** | `/home/philmong/agent-canvas/` | - |
| **Staging (Build)** | **Ubuntu Target** | `/home/philmong/aura-map/` | `https://dev.philmong.co.kr/canvas2/` |
| **Production** | **Remote Server** | `/home/philmong/agent-canvas/` | `https://philmong.co.kr/canvas/` |

---

## 2. 주요 기능 구현 내역 (Feature Implemented)

### ✅ 매크로 갤러리 (Macro Gallery) 도입
*   **컴포넌트**: `src/components/ui/NodeDetailModal.jsx`
*   **특징**: 노드(거점)별 4-Tab 시스템 확장. 이미지 업로드 시 지능형 압축 알고리즘(1200px limit, JPEG 0.7) 적용으로 저장 효율 극대화.

### ✅ 실시간 스토리지 모니터링 (Capacity Monitor)
*   **컴포넌트**: `src/components/ui/TopNavigationBar.jsx`
*   **특징**: Local Storage 사용량을 백분율(%)로 표시. 80% 이상 사용 시 인디케이터가 적색(Warning)으로 변하여 데이터 손실 방지.

### ✅ UI 간소화 및 정체성 강화
*   **변경 사항**: 상단 헤더의 `TOTAL` 집계 표시 제거. 거점별 전술 관리에 집중할 수 있는 깔끔한 인터페이스 확보.

---

## 3. 빌드 및 배포 정합성 (Build & Sync Status)

### 🛠️ WSL2 빌드 트러블슈팅
*   **이슈**: `framer-motion` 참조 오류로 인한 빌드 실패.
*   **해결**: WSL2 환경 내부에서 `npm install`을 재수행하여 의존성 정합성 복구.
*   **결과**: Vite v8.0.10 기반 프로덕션 빌드 성공.

### 🔄 동기화 프로세스 (Dual-Track Sync)
1.  **Local -> WSL2**: `rsync`를 통해 `.git`, `node_modules`를 제외한 순수 소스 전송 완료.
2.  **WSL2 Build**: `/home/philmong/agent-canvas/dist` 생성 완료.
3.  **Deploy to Staging**: `dist`의 결과물을 `/home/philmong/aura-map/`으로 복사하여 외부 접속 경로(`canvas2`) 확보.

---

## 4. 특이 사항 및 주의 (Tactical Notes)

*   **경로 불일치 주의**: Nginx 설정 상 `/canvas/`는 개발 서버 프록시를, `/canvas2/`는 정적 빌드 결과물을 가리킵니다. 스테이징 확인 시 반드시 `/canvas2/` 경로를 사용하십시오.
*   **버전 배지**: 현재 모든 환경에서 `v4.6.1-PLATINUM` 배지가 정상적으로 표시되고 있습니다.
*   **데이터 정합성**: `Data Shield` 엔진이 활성화되어 있어, 데이터가 유실된 상태에서의 동기화를 원천 차단하고 있습니다.

---

## 5. 🚨 현재 장애 상황 및 분석 (Incident Report)

**장애 현상**: 아우라 허브 카드 클릭 또는 `/canvas/` 직접 접속 시 화면 깜빡임 발생 및 접속 불가 (무한 리다이렉션 의심).

### 🔍 수행된 조치 내역 (Attempted Fixes)
1.  **Vite 설정 최적화**: `base` 경로를 `/canvas/`로 고정하고 재빌드 수행 완료.
2.  **Nginx 구조 개편**: `alias` 방식에서 `root` 방식으로 전환하여 SPA 정합성 강화.
3.  **우선순위 강제**: `location ^~ /canvas/` 설정을 통해 Nginx 내부 매칭 순위를 최상위로 격상.
4.  **디버깅 프로브**: `/canvas/test.txt` 파일을 생성하여 경로 매칭 여부 확인 시도.

### ⚠️ 미결 사항 및 추정 원인
*   **증상 지속**: 위 조치에도 불구하고 시크릿 모드 등 모든 환경에서 동일 증상 발생.
*   **추정 원인 1**: Cloudflare Tunnel (`cloudflared`) 설정에서 특정 경로에 대한 필터링 또는 리다이렉트 규칙 간섭 가능성.
*   **추정 원인 2**: 아우라 허브 메인 앱의 라우팅 엔진에서 `/canvas/` 경로를 가로채는 로직 존재 가능성.

---

**상태**: **[장애 대기 (On Hold - Debugging)]**
지휘관님의 명령에 따라 현재 상태를 동결하고 대기합니다. 추가 지시가 있을 때까지 인프라 정합성 유지에 집중하겠습니다. 🫡🎖️
