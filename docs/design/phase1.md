# Phase 1 설계 - 메인 화면

`docs/PLAN.md`의 Phase 1, `docs/FEATURES/main.md`의 구성을 기준으로 실제 구현 설계를 정리한 문서다.

## 목표 (재확인)

- `npm run dev` 실행 시 타이틀 + 시작 버튼 + 조작 안내가 보이는 메인 화면 표시
- 시작 버튼(또는 스페이스바)을 누르면 다음 화면(게임 화면)으로 전환
- 아직 실제 게임 로직(Phase 2 이후)은 없으므로, 게임 화면은 자리만 잡아두는 플레이스홀더로 둔다

## 화면 전환 방식

- `App.tsx`에서 `useState`로 현재 화면 상태만 관리
  ```ts
  type Screen = 'main' | 'game'
  const [screen, setScreen] = useState<Screen>('main')
  ```
- `screen`이 `'main'`이면 `<MainScreen />`, `'game'`이면 `<GameScreen />`(플레이스홀더)을 렌더링
- 화면 전환은 이 단계에서 되돌아가는 흐름이 없으므로 단방향(main → game)만 지원

## 컴포넌트 구조

```
src/
  App.tsx              # 화면 상태(screen) 관리, MainScreen/GameScreen 스위칭
  screens/
    MainScreen.tsx      # 타이틀, 시작 버튼, 조작 안내
    MainScreen.css
    GameScreen.tsx      # Phase 1에서는 "게임 화면(준비 중)" 텍스트만 표시하는 placeholder
    GameScreen.css
```

- 기존 `src/App.tsx`, `src/App.css`의 Hello World 내용은 제거하고 위 구조로 교체
- 각 화면은 독립된 컴포넌트/CSS로 분리해 이후 Phase에서 `GameScreen.tsx`만 확장하면 되도록 함

## MainScreen 상세 설계

**표시 요소**
- 타이틀: "PANG" 텍스트 (큰 글씨, 화면 상단 중앙)
- 시작 버튼: "게임 시작" 버튼 (클릭 시 `onStart` 콜백 호출)
- 조작 안내: 아래 텍스트를 리스트 형태로 표시
  - 이동: ← / →
  - 발사: Space

**입력 처리**
- 버튼 클릭: `onClick`으로 `onStart()` 호출
- 스페이스바: `MainScreen`에 `useEffect`로 `keydown` 이벤트 리스너 등록, `key === ' '`일 때 `onStart()` 호출 후 언마운트 시 리스너 해제

**Props 설계**
```ts
type MainScreenProps = {
  onStart: () => void
}
```

## GameScreen (Phase 1 범위의 placeholder)

- Phase 1에서는 실제 게임 로직 없이 "게임 화면 (준비 중)" 문구만 렌더링
- Phase 2부터 이 컴포넌트 내부에 플레이어/작살 로직을 채워나감

## 스타일링 방침

- 기존 `App.css`의 flex 중앙 정렬 방식을 그대로 계승 (`display: flex; justify-content: center; align-items: center; height: 100vh;`)
- 화면 크기를 줄여도 레이아웃이 깨지지 않도록 고정 px 대신 상대 단위(`vw`, `%`, `rem`) 위주로 작성
- 별도의 UI 라이브러리는 도입하지 않고 순수 CSS로 구성 (Phase 1 범위에서는 디자인보다 기능 검증이 우선)

## 확인 기준 (Acceptance Criteria)

`docs/PLAN.md`의 "고객님이 확인하실 부분"과 동일하게, 아래 항목이 모두 만족되면 Phase 1 완료로 본다.

- [ ] "PANG" 타이틀과 시작 버튼이 화면에 보인다
- [ ] 시작 버튼 클릭 시 게임 화면(placeholder)으로 전환된다
- [ ] 스페이스바를 눌러도 동일하게 게임 화면으로 전환된다
- [ ] 브라우저 창 크기를 줄이거나 늘려도 레이아웃이 깨지지 않는다

## 범위 밖 (다음 Phase에서 처리)

- 실제 플레이어/작살/풍선 로직 (Phase 2, 3)
- 사운드, 배경 애니메이션, 최고 기록 표시 등 (Phase 5 이후 확장 후보)
