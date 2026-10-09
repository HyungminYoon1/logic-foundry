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

### 회로 파일·기기 저장·되돌리기·최소 진행 요약 / 2026-10-09

- Source inspection — VERIFIED: 지정된 `logic-foundry` 파일 목록과 깨끗한 시작 작업 트리를 확인했습니다. architecture.md, README.md, docs/decisions.md, docs/verification.md, .gitattributes, .gitignore, package.json, tools/check.mjs, tools/serve.mjs, dist/index.html/styles.css/src/model.js/app.js/ui.js, test/model.test.js/ui.test.js, Pages workflow를 읽었습니다. api-spec.md, requirements.md, 저장소 및 바로 위 디렉터리의 AGENTS.md는 없었으며 사용자가 제공한 지침을 적용했습니다. 형제 디렉터리는 허용 ID 이름 확인을 위한 목록만 확인했고 내용 검토/수정은 범위 밖입니다.
- Changed paths: `dist/src/model.js`, `dist/src/app.js`, `dist/index.html`, `dist/styles.css`, 신규 `dist/src/records.js`, `dist/src/history.js`, `dist/src/storage.js`, `dist/src/progress.js`, 신규 `test/records.test.js`, `test/ui.test.js`, `architecture.md`, `README.md`, `docs/decisions.md`, `docs/verification.md` (14 files).
- Mechanics: 기존 13개 과제/술어/예시/정확한 전수 평가는 유지합니다. 전역 게이트 제한을 실제 최대인 24로 맞췄습니다. 16 KiB 정확한 스키마의 JSON 가져오기/내보내기, 과제별 명시적 저장/불러오기, 전체 앱 기록의 명시적 삭제, 최대 32회 편집 되돌리기, 선택 게이트/연결 신호 링크를 추가했습니다. 가져온 파일은 항상 연습이고 완료 플래그/알 수 없는 필드는 거절합니다. 저장 데이터 128 KiB와 집계 8 KiB는 별도 경계에서 검증합니다. 완료 회로는 실제 독립 전수 통과 후 성공적으로 저장하며 재시작 때도 다시 검증합니다. 초기 방문/힌트/예시/초안 저장은 집계를 쓰지 않습니다. 저장 스키마와 보존/삭제/실패 규칙은 D08~D10과 architecture.md에 기록했습니다.
- LOCAL_MODEL / CODEC / STORAGE — PASS: Node v22.23.2, `npm test` 총 41/41 (기존 순수 모델 17, 순수 코덱/히스토리/저장 경계 11, synthetic UI 13). 13개 기존 해법과 336개 전체 조합, 33개 대표 사례 및 기존 산술/패리티/MUX/디코더/비교/중재 불변식을 유지했습니다. JSON 전 과제 round-trip, 전방/자기/상호순환/없는 입력·출력·과제/NOT 비활성 포트/잘못된 버전/여분 키/위조 solved 플래그/크기 초과/과제별 정확한 상한과 초과, 독립 완료 회로 재검증, 32개 스냅샷 제한·복사·연습 복구, 잘못된 기기 데이터/차단/용량 부족/정확한 삭제 범위를 검사했습니다. 순수 모듈의 DOM/저장/시계/네트워크 의존성 부재도 검사합니다.
- SYNTHETIC_UI — PASS: 실제 편집 동작으로 XOR와 5게이트 전가산기를 만든 뒤 독립 완료 저장/집계를 확인했습니다. 파일 거절 시 회로 보존, 가져오기/예시→저장→불러오기 연습 유지, 처음 화면에서 집계 쓰지 않음, 실제 완료 회로로만 재시작 표시, 게이트·삭제·출력 연결/초기화/예시의 되돌리기, 연결 신호 선택, 타 앱 집계/개인 키 보존을 검사했습니다. 같은 과제 예시 도구가 오래된 초안으로 바꾸던 경로를 수정하고 회귀 검사했습니다. DOM 대역 증거이며 브라우저 E2E가 아닙니다.
- LOCAL_STATIC — PASS: `npm run check` 공개 파일 9개 구문/로컬 자산/메타데이터/CSP/BOM 검사, `git diff --check`, 변경 텍스트 14개 UTF-8 무 BOM / CRLF 검사. 기존 CSP `connect-src 'none'`와 인라인 실행 금지 검사는 유지했습니다. 외부 패키지를 추가하지 않았습니다.
- BROWSER_E2E / CAPTURE / REMOTE_CI / LIVE — NOT_RUN: 메인이 실제 브라우저 조작·반응형·파일 다운로드/선택과 캡처를 담당합니다. 다른 에이전트 생성, 커밋, 푸시, 배포, 계정 접근, 프로비저닝, 공개 순위/백엔드, 타 저장소 수정을 하지 않았습니다. 위 과거 브라우저 증거는 새 기능의 브라우저 검증이 아닙니다.
- Limitations: 기기 데이터는 사용자 수정 가능한 학습 기록입니다. 여러 탭은 마지막 쓰기가 우선하고 개인 키/집계 키의 원자성은 없습니다. 손상된 공통 집계는 덮어쓰지 않아 삭제/갱신 실패를 표시할 수 있습니다. 요약 실패는 다음 실제 검증/삭제 때 재시도할 수 있습니다. 앱 데이터 삭제는 저장된 초안/완료만 제거하며 현재 편집기·페이지 메모리 초안·다운로드 파일은 남습니다. 새로고침 후 저장 초안은 현재 과제에서 직접 불러옵니다.

#### 메인 실제 UI 검증 및 캡처 절차

1. 저장소에서 `npm run dev -- 0`을 실행하고 출력되는 loopback URL을 사용합니다. 같은 URL/포트를 계속 사용해야 기기 저장을 이어서 검사할 수 있습니다. 새 브라우저 컨텍스트에서 시작하고 1440×1000, 390×844, 320×780을 확인합니다. 첫 화면은 초기 AND 회로와 0개 저장 완료이며 요약 생성이 없어야 합니다.
2. 첫 과제에서 `진리표 검증` → 첫 반례 A=0/B=1, 목표 1/현재 0을 확인합니다. `첫 반례 적용`과 `불일치만 보기`를 사용하고 **실제 실패 회로·스위치·진리표**를 캡처합니다. G1의 종류를 XOR로 변경하고 `진리표 검증`을 누르면 4/4, 직접 해결 1/13입니다. 예시 버튼이나 상태/점수 주입은 사용하지 않습니다.
3. `기기에 저장` → G1을 AND로 변경 → `편집 되돌리기`로 XOR 복구를 확인합니다. 다시 AND로 바꾸고 `저장 불러오기`로 XOR 복구합니다. 새로고침하면 편집기는 AND이고 저장 완료는 1/13입니다. `저장 불러오기`로 XOR가 돌아와야 합니다.
4. XOR에서 `JSON 내보내기`로 실제 다운로드를 얻고 `JSON 가져오기`에서 그 파일을 선택합니다. 회로는 4/4지만 `연습`이며 검증해도 저장 완료는 증가하지 않습니다. 연습 회로 저장/초기화/불러오기 후에도 연습을 유지합니다. 새로고침해 같은 과제에서 불러와 다시 확인합니다. 가져오기는 새 완료를 만들지 않으며 기존 독립 완료를 지우지도 않습니다.
5. 반가산기 선택 → 초기 회로 → G1=XOR(A,B), 게이트 추가 → G2=AND(A,B). SUM=G1, CARRY=G2를 출력 선택기로 연결합니다. 4/4 검증 뒤 입력 사례 `자리 올림`을 누르면 두 스위치는 1이고 SUM=0/CARRY=1입니다. **두 실제 게이트·배선·램프·4행 진리표와 직접 해결 표시**를 캡처합니다. 출력 CARRY를 G1로 바꿔 실제 반례를 확인하고 되돌리기로 복구합니다.
6. 3비트 리플 가산기 → `예시 회로` → `세 자리 올림 전파: 7+0+1` 사례. S0=S1=S2=0/Cout=1, 128/128, 연습을 확인합니다. **실제 15게이트 회로·올림 입력·램프**를 캡처합니다. 320/390px에서 문서 가로 넘침 없이 회로 내부만 스크롤되는지, 회로 보관 파일 입력/파일명/버튼이 편집기 밖으로 넘치지 않는지 확인합니다. Tab/Enter로 게이트 선택 및 연결 신호 버튼의 이전 게이트 선택/입력 스위치 초점을 확인합니다.
7. 내려받은 JSON 복사본에 top-level `solved:true` 추가, G1의 a를 G1(자기 참조)/없는 신호로 변경, 16 KiB 초과 파일을 각각 선택합니다. 가져오기 실패 표시와 이전 회로/과제/완료 개수 보존을 확인합니다. 24개 상한 미션에서 25번째 게이트가 있는 파일도 거절해야 합니다. 회로 입력/파일은 서버 요청으로 전송되지 않아야 합니다.
8. 마지막에 `저장 회로·완료 기록 삭제`를 누르고 저장 완료 0/13, 현재 편집 회로 유지, 현재 과제의 `저장 불러오기` 없음, 새로고침 후 완료 0을 확인합니다. 같은 origin의 메인 갤러리/다른 앱에서 실제로 만든 별도 완료가 있다면 공통 집계의 그 항목 및 개인 저장 데이터가 보존되어야 합니다. 다른 localhost 포트로 실행한 갤러리는 같은 origin 검증이 아닙니다. 캡처/콘솔/네트워크/반응형 결과는 메인 별도 기록으로 남깁니다.

### 배포 결과의 별도 기록

이 문서의 각 로컬 검증은 해당 변경의 로컬 증거입니다. 원격 CI·공개 사이트 증거와 혼동하지 않습니다.
배포 후 커밋별 CI와 공개 URL 확인 결과는 [WEB LAB 종합 검증 기록](https://github.com/HyungminYoon1/web-lab/blob/main/docs/verification.md)에 기록합니다.
이 저장소의 이후 변경은 [Actions](https://github.com/HyungminYoon1/logic-foundry/actions)에서 해당 커밋의 결과를 별도로 확인해야 합니다.
