# Decisions

## D01 — Static, independent implementation

- Context: the user approved implementing all six proposed services and adding them to WEB LAB.
- Options: merge into existing services; backend/Sites hosting; independent static Pages repositories.
- Decision: independent logic-foundry repository and public GitHub Pages, pure model separated from rendering, no dependencies or new paid services.
- Rationale: fits the current collection, keeps other releases untouched, supports local model verification.
- Affected: architecture.md, dist, test, tools and .github/workflows/pages.yml.
- Review: additions requiring server state or different hosting need a separate decision.

## D02 — Transient, bounded browser state

- Context: these experiments need configuration, not user accounts or retained visitor records.
- Options: server upload/analytics/history; transient browser memory and deliberate local output.
- Decision: no stored visitor state or uploaded data. Bound all controls and model work. Pixel imports, when applicable, never leave the browser; reject unsupported/oversized files and cap decoded work.
- Rationale: privacy and predictable resource use; no API credential or personal profile required.
- Affected: dist/src/model.js, dist/src/app.js, dist/index.html and optional WebMCP summaries.
- Review: do not add hidden persistence or make medical/real-traffic/benchmark claims from these models. Use GitHub noreply identity for commits.

## D03 — 계산과 조작의 경계

- Context: 설명만 표시하는 데 그치지 않고 조작한 조건에서 실제 결과를 계산해야 합니다.
- Options: 고정 애니메이션/결과 문구; 범위를 제한한 순수 모델과 동일 상태를 읽는 UI.
- Decision: 앞서 정의한 입력·게이트만 연결하는 DAG를 사용합니다. eval 없이 이진 연산으로 계산하고 모든 조합을 검사합니다. 삭제된 게이트를 참조하던 연결은 상수 0으로 바뀝니다. 큰 회로는 글자 크기를 유지하는 내부 스크롤을 사용합니다.
- Rationale: 재현 가능한 검사와 읽을 수 있는 결과를 제공하고 브라우저 자원 사용을 제한합니다.
- Affected: dist/src/model.js, dist/src/app.js, dist/index.html, dist/styles.css and test/model.test.js.
- Review: 순차 회로·클록·시간 지연은 범위 밖입니다. 추가하려면 별도 상태 모델과 검증 규칙이 필요합니다.

## D04 — 조합논리 난이도와 명확한 수치 계약 / 2026-10-09

- Context: 기존 4개 과제와 12개 게이트는 여러 자리 올림·선택선·다중 출력 설계에 부족했습니다. 사용자가 더 독창적이고 어려운 회로 미션의 로컬 구현을 승인했습니다.
- Options: XOR 변형만 추가; 클록/상태/외부 시뮬레이터 도입; 기존 순수 DAG 모델 안에서 산술·통신·선택·중재와 게이트 제약을 확장.
- Decision: 총 13개 과제. 전가산기, 3비트 리플 가산기, 2비트 가감산 유닛, 4비트 짝수 패리티, 활성 디코더, 4채널 MUX, 비교기, 우선순위 중재기, NAND 전용 MUX를 추가합니다. 입력/출력은 낮은 비트 먼저, 감산 결과는 modulo 4, 감산 FLAG는 빌림입니다. 패리티의 짝수 개 오류 한계를 표시합니다. 게이트 상한은 과제별 8~24, 전역 안전 상한은 32, 입력 7/출력 4/전수 조합 128입니다.
- Rationale: 15게이트 올림 사슬부터 NAND만의 합성까지 서로 다른 분해와 공유 신호를 연습합니다. 산술 기대값과 예시 게이트 네트워크를 독립적인 테스트로 대조합니다. 대표 사례는 경계 조건 설명용이고 정답 판정은 전수 검사입니다.
- Affected: dist/src/model.js, dist/src/app.js, dist/index.html, dist/styles.css, test/model.test.js, README.md, architecture.md.
- Review: 간결화 목표는 달성 가능한 예시 크기이며 최적/최소 개수 보장이 아닙니다. 클록·게이트 지연·아날로그·순차 회로는 추가하지 않았습니다. 이후 미션도 모델 상한과 독립 불변식 테스트를 지켜야 합니다.

## D05 — 힌트·진행·초안은 현재 페이지 메모리에만 / 2026-10-09

- Context: 어려운 미션에는 개념 분해 힌트와 반례 추적이 필요하고, 과제를 바꿀 때 작성 중 회로를 잃으면 작업성이 떨어집니다.
- Options: 로컬 저장소/계정 진행 저장; 과제별 잠금; 메모리 초안과 자유 선택, 예시 사용 표시.
- Decision: 과제별 회로·입력·선택·힌트 공개 수를 메모리에 보관합니다. 힌트는 개념→연결식 순서로 공개하고 입력 사례/첫 반례를 실제 스위치에 적용합니다. 직접 해결은 검증 버튼의 전체 진리표 통과로 기록하며 예시를 한 번 불러온 초안은 초기 회로로 재시작하기 전까지 연습으로 표시합니다. 과제 잠금과 힌트 벌점은 없습니다.
- Rationale: 사고 과정을 지원하면서 예시 불러오기를 직접 해결로 오인하지 않게 합니다. 기존 무저장·무업로드·무계정 경계를 유지합니다. 선택기와 SVG 게이트를 키보드로 조작할 수 있도록 유지합니다.
- Affected: dist/src/app.js, dist/index.html, dist/styles.css, test/ui.test.js, README.md, architecture.md.
- Review: 직접 해결 표시도 학습용 페이지 상태일 뿐 평가/인증이 아닙니다. 새로고침·페이지 종료로 모두 사라집니다. 브라우저 레이아웃/접근성 실검사는 메인 작업자가 수행합니다.

## D06 — 입력 및 배선 검증은 평가 전에 / 2026-10-09

- Context: 과제마다 입력 이름·출력 수·허용 게이트가 달라지며 외부 페이지 도구도 같은 회로를 변경합니다.
- Options: 임의 순서 노드를 정렬; 누락 입력을 0으로 보정; 기존 순서 DAG 규칙을 엄격하게 확장.
- Decision: 게이트 목록 순서를 위상 순서로 유지합니다. 자기 참조·전방 참조·중복 ID·없는 입력/출력·희소 배열·과제 상한·NAND 제약 위반을 거절합니다. NOT의 비활성 두 번째 포트도 유효한 앞쪽 참조여야 합니다. 실행 입력에는 해당 과제의 own 키만 정확히 존재하고 값은 숫자 0/1이어야 합니다. 과제 키는 own 등록값만 허용합니다. 검증 실패 시 UI 회로를 교체하지 않습니다. 삭제 연결을 상수 0으로 바꾸는 규칙은 유지합니다.
- Rationale: 순환을 만들 수 없는 선형 평가를 유지하고, 오래된 과제 입력이나 존재하지 않는 신호가 계산에 섞이지 않게 합니다. 전체 진리표는 회로를 한 번 검증한 다음 제한된 행 수만 계산합니다.
- Affected: dist/src/model.js, dist/src/app.js, test/model.test.js, test/ui.test.js, architecture.md.
- Review: 배열 순서가 뒤인 게이트는 수학적으로 순환이 없어도 연결 불가입니다. UI/페이지 도구 모두 같은 모델 검증을 적용합니다. 테스트의 synthetic DOM은 실제 브라우저 증거로 표시하지 않습니다.

## D07 — 모바일 점수는 실제 텍스트 폭을 유지 / 2026-10-09

- Context: 메인 브라우저 QA에서 320px의 3비트 가산기 예시가 문서 너비 321px를 만들었습니다. 별도 logic320-worker 브라우저 세션에서 재현한 결과, 점수 텍스트 128 / 128은 약 106px인데 flex 항목이 70px로 축소되어 텍스트 오른쪽 끝이 321.265625px까지 나갔습니다. SVG와 진리표는 각각 자기 스크롤 영역 안에 있었습니다.
- Options: 모바일 과제 띠 전체를 세로 배치; 점수 글자 축소/줄바꿈; 점수의 본래 너비를 보존하고 설명이 남은 너비에서 줄바꿈.
- Decision: 기존 max-width:600px 규칙의 .score에 flex-shrink:0만 추가합니다. 설명의 기존 min-width:0과 줄바꿈, 회로/진리표 내부 스크롤을 유지합니다. 페이지 또는 SVG의 overflow를 숨기지 않습니다.
- Rationale: 넘침의 실제 원인에만 적용되는 한 속성 수정입니다. 점수 가독성, 데스크톱 배치, 계산 모델과 UI 동작에 영향이 없습니다.
- Affected: dist/styles.css, docs/verification.md.
- Review: 별도 로컬 브라우저에서 13개 예시 × 320/390/1440px의 39개 상태를 검사해 문서 가로 넘침 없음, 점수 내부 넘침 없음, 모바일 큰 회로의 내부 스크롤을 확인했습니다. 메인의 현재 Playwright 세션은 사용하지 않았습니다. 메인 QA 스크립트 재실행은 별도입니다.
