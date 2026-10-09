# Verification

## Scope

logic-foundry: model source and focused tests, static asset/syntax checks, browser interaction, remote workflow and public site are separate evidence levels. Existing unrelated services remain outside this change.

## Evidence

### 최초 배포 전 로컬 검증 / 2026-10-09

- LOCAL: npm test 4/4 통과. npm run check로 모델/UI 구문, 로컬 자산 참조, 메타데이터, CSP, BOM 여부 통과.
- BROWSER_LOCAL: XOR 변경 시 4/4 검증, 다수결 예시 8/8, 순환 연결 거절, 모바일 스위치와 회로 내부 스크롤.
- RESPONSIVE_LOCAL: 390×844, 320×780에서 페이지 가로 넘침 없음. 현재 검사한 브라우저에서 경고/오류 로그 없음.
- WebMCP_LOCAL: 기능 감지가 되는 브라우저에서 등록된 읽기/조작 도구의 정상 호출과 의도한 잘못된 입력 거절을 확인. 이 기능이 없는 브라우저에서는 일반 UI로 사용합니다.

### 13개 조합논리 미션 확장 — 로컬 구현 / 2026-10-09

- Source inspection — VERIFIED: 지정 저장소 전체 파일 목록을 확인하고 architecture.md, README.md, docs/decisions.md, .gitattributes, package.json, dist의 model/app/ui/index/styles, 기존 test/model.test.js, tools/check.mjs, tools/serve.mjs, docs/verification.md, Pages workflow와 .gitignore를 모두 읽었습니다. 이 저장소 내부의 별도 AGENTS.md는 없었습니다. 형제 저장소는 작업 대상 밖입니다.
- Audit: 기존 4개 미션, 12게이트 상한, SUM/CARRY에 고정된 UI 출력, 입력 레코드의 여분 키 허용을 확인했습니다. 조합논리 13개와 출력별 명칭, 과제별 상한, 단계 힌트·반례 추적·초안 복원을 구현했습니다.
- LOCAL_MODEL — PASS: Node v22.23.2, `npm test` 총 22/22 (모델 17, synthetic UI 5). 13개 예시의 전수 진리표 총 336행과 대표 사례 33개 통과. 가장 큰 과제인 3비트 가산기는 128행 검사합니다.
- LOCAL_MODEL — PASS: 산술 합과 올림 전파, modulo 4 감산/빌림, 짝수 패리티와 단일/이중 비트 변경, EN 디코더 단일 출력, MUX 비선택 입력 불변성, 비교기 상호 배타/피연산자 교환, 최상위 요청만 승인하는 중재기 불변식을 검사했습니다.
- LOCAL_MODEL — PASS: 자기/상호 순환, 전방 참조, 중복/잘못된 ID, 없는 입력/출력, 출력 수, 희소 배열, 비이진/누락/여분/상속 입력, 미등록/프로토타입 과제 키, 과제별 정확한 게이트 상한과 초과, NAND 전용 제약을 검사했습니다. NAND MUX의 모든 0/1게이트 배선이 정답이 될 수 없음을 전수 검사하고 올림 누락/출력 뒤바꿈의 반례도 확인했습니다.
- SYNTHETIC_UI — PASS: Node의 작은 DOM 대역으로 HTML 제어 요소 계약, 전체 과제 전환과 I/O 수, 진리표 행 수, 예시/직접 해결 분리, 메모리 초안·힌트 복원, 입력 사례/첫 반례 적용, 실패 행 필터, NAND 팔레트·상한, 거절된 페이지 도구의 상태 보존, 삭제 배선의 상수 0 복구를 검사했습니다. 실제 DOM 엔진·브라우저·렌더링 증거가 아닙니다.
- LOCAL_STATIC — PASS: `npm run check` 공개 파일 5개 구문·로컬 참조·메타데이터·CSP·BOM 검사. `git diff --check` 통과. 변경된 텍스트 10개 파일에 대해 UTF-8 유효성, BOM 없음, CRLF를 별도 확인했습니다.
- BROWSER_LOCAL / RESPONSIVE / WebMCP_BROWSER — NOT_RUN for this change: 실제 브라우저 조작·키보드/터치·화면 넘침·SVG 가독성·콘솔 검사는 메인 작업자의 다음 검증 대상입니다. 위 최초 배포 전 브라우저 증거는 이 변경을 검증하지 않습니다.
- REMOTE_CI / LIVE — NOT_RUN: 이 작업은 로컬 구현에 한정했습니다. 커밋·푸시·배포·외부 서비스 변경을 실행하지 않았습니다. 새 패키지·외부 자산·저장/업로드·백엔드를 추가하지 않았습니다.
- Limits: 조합논리만 지원하고 배열의 앞쪽 게이트만 배선 가능합니다. 간결화 목표는 최적성 보장이 아닙니다. 패리티는 짝수 개 오류를 놓칩니다. 진행과 초안은 페이지 메모리에서만 유지됩니다.
- Preview handoff: 저장소에서 `npm run dev -- 0` 실행 후 출력되는 loopback URL을 메인 작업자가 사용합니다. 3비트 가산기 예시/128행, 가감산 0−1의 FLAG, 4출력 디코더·중재기, NAND 제한, 첫 반례/힌트·과제 전환, 320px·390px 화면과 큰 회로 내부 스크롤을 실제 브라우저로 확인해야 합니다.

### 모바일 320px 점수 넘침 수정 — 별도 로컬 브라우저 / 2026-10-09

- Source inspection — VERIFIED: architecture.md, README.md, docs/decisions.md, .gitattributes, 현재 dist/styles.css/index/app와 로컬 검사/서버 스크립트를 확인했습니다. 메인이 지정한 ../output/playwright/review-20261009/logic-qa.mjs를 읽기 전용으로 확인했습니다. 해당 스크립트와 메인의 현재 브라우저 세션은 변경/실행하지 않았습니다.
- BEFORE — REPRODUCED: 320×850px, adder3의 15게이트 예시에서 innerWidth=320, document.scrollWidth=321. .score clientWidth=70 / scrollWidth=106, 점수 텍스트 Range의 오른쪽 끝=321.265625px. .diagram-scroll clientWidth=252 / scrollWidth=931, .workbench 282/282, .desk 284/284였습니다. 원인은 nowrap 점수의 flex 축소로 확인됐습니다.
- Change: max-width:600px의 .score에 flex-shrink:0 한 속성만 추가했습니다. 페이지 숨김/클리핑, SVG 변경, 계산/동작 변경은 없습니다.
- BROWSER_LOCAL_WORKER — PASS: 기존 로컬 Playwright CLI를 offline으로 사용하고, 별도 logic320-worker 세션과 자기 loopback 서버에서 실제 페이지를 새로고침하여 검사했습니다. 13개 예시 × 320/390/1440px = 39개 상태에서 document.documentElement.scrollWidth≤innerWidth 및 점수 scrollWidth≤clientWidth를 확인했습니다.
- AFTER — PASS: adder3 320px에서 문서 너비 320, 점수 106/106, 텍스트 오른쪽 끝 285px. 390px에서 문서 너비 390, 점수 106/106, 텍스트 오른쪽 끝 355px. 모바일 회로 스크롤은 각각 931/252와 931/322로 유지됐습니다. body overflow-x는 visible이고 점수에 진단용 inline style은 없었습니다. 데스크톱 1440px도 문서 너비 1440입니다.
- LOCAL — PASS: `npm test` 22/22, `npm run check`, `git diff --check`. 이번 수정 파일 3개(styles.css, decisions.md, verification.md)의 유효 UTF-8 / BOM 없음 / CRLF를 별도 검사했습니다.
- Evidence limits: worker의 이번 실제 브라우저 검사는 너비·텍스트 bounds·스크롤 회귀에 집중했습니다. 회로 편집/반례/초안/NAND 흐름의 메인 QA 통과는 메인이 전달한 결과이며 여기서 재실행했다고 주장하지 않습니다. 메인 전체 logic-qa.mjs 재실행은 메인 작업자의 다음 단계입니다. 원격 CI/LIVE는 NOT_RUN, 커밋·푸시·배포는 실행하지 않았습니다.

### 배포 결과의 별도 기록

이 문서는 최초 배포 직전의 로컬 증거입니다. 원격 CI·공개 사이트 증거와 혼동하지 않습니다.
배포 후 커밋별 CI와 공개 URL 확인 결과는 [WEB LAB 종합 검증 기록](https://github.com/HyungminYoon1/web-lab/blob/main/docs/verification.md)에 기록합니다.
이 저장소의 이후 변경은 [Actions](https://github.com/HyungminYoon1/logic-foundry/actions)에서 해당 커밋의 결과를 별도로 확인해야 합니다.
