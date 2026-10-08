# LOGIC FOUNDRY — 논리회로 작업대

[실행](https://hyungminyoon1.github.io/logic-foundry/) · [WEB LAB](https://hyungminyoon1.github.io/web-lab/)

게이트의 종류와 연결을 바꾸고, 입력 스위치와 진리표로 논리회로를 검증하는 작업대입니다.

## 직접 해보기

- AND·OR·XOR·NOT·NAND·NOR·XNOR, 최대 12개 게이트
- 게이트별 입력과 최종 출력 연결, 실시간 신호·램프
- XOR 램프·다수결·1비트 덧셈기·입장 조건의 4개 과제
- 모든 입력 조합 검증, 예시/초기 회로, 게이트 추가·삭제

개인 소개나 계정 없이 사용할 수 있습니다. 새로고침하면 실험 상태가 초기화됩니다.

참고 개념: [원문과 추가 학습](https://docs.circuitverse.org/). 구현은 이 저장소의 계산 모델과 UI로 작성했습니다.

## 실행 및 검증

Node.js 22 이상. 외부 패키지는 없습니다.

```sh
npm run dev -- 0
npm test
npm run check
```

main에 푸시하면 검증 후 dist만 GitHub Pages에 배포합니다. 계산 모델과 UI는 분리되어 있습니다. 현재 페이지를 닫으면 실험 상태가 사라지며 서버 업로드·계정·방문자 추적 기능은 없습니다. 호스팅 로그와 앱의 데이터 처리는 별개입니다.

[구조](architecture.md) · [결정 기록](docs/decisions.md) · [검증 기록](docs/verification.md)

AI 에이전트와 함께 제작했습니다. 참고 개념과 원작 링크는 앱 및 설명에 표시하며, 다른 사이트의 코드나 디자인을 복제하지 않습니다. 별도 라이선스는 아직 부여하지 않았습니다.
