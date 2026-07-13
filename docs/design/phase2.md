# Phase 2 설계 - 플레이어 이동 & 작살 발사

`docs/PLAN.md`의 Phase 2, `docs/FEATURES/game_rule.md`의 플레이어/작살 규칙을 기준으로 실제 구현 설계를 정리한 문서다.

## 목표 (재확인)

- Phase 1의 `GameScreen`(placeholder)을 실제 플레이 가능한 화면으로 교체
- 화면 하단에 플레이어 캐릭터가 등장하고, 좌우 방향키로 이동
- 스페이스바(또는 클릭)로 작살(와이어)을 위쪽으로 발사
- 아직 풍선/충돌 로직은 없으므로, 이동과 발사의 조작감만 검증하는 단계

## 렌더링 방식

- 별도의 canvas/WebGL 도입 없이, Phase 1과 동일하게 순수 DOM 엘리먼트(`<div>`)를 `position: absolute`로 배치하고 `transform: translate(x, y)`로 위치를 갱신
- 이유: Phase 2 범위는 "이동/발사가 잘 되는지" 검증이 목적이므로, 렌더링 기술 도입보다 게임 루프/입력 처리 구조를 먼저 검증하는 것이 우선. 이후 풍선 수가 많아지고 충돌 연산이 늘어나면(Phase 3~4) canvas 전환을 재검토

## 게임 루프

- `requestAnimationFrame`으로 매 프레임마다 플레이어 위치, 작살 목록을 갱신
- 프레임 간 시간 차(`deltaTime`)를 계산해 이동 속도가 기기 성능에 따라 달라지지 않도록 처리
- 잦은 리렌더링을 피하기 위해 위치 값은 `useRef`로 들고 있다가, DOM에는 `ref.current.style.transform`을 직접 갱신하는 방식 사용 (React state로 매 프레임 re-render하지 않음)

```ts
function useGameLoop(callback: (deltaTime: number) => void) {
  useEffect(() => {
    let rafId: number
    let lastTime = performance.now()

    const tick = (time: number) => {
      const deltaTime = time - lastTime
      lastTime = time
      callback(deltaTime)
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [callback])
}
```

## 입력 처리

- `useKeyboard` 훅으로 현재 눌려있는 키 목록을 `Set<string>`(ref)에 저장
  - `keydown`에서 추가, `keyup`에서 제거
  - 게임 루프에서 매 프레임 이 Set을 읽어 이동/발사 여부 판단 (React state로 처리하면 매 keydown마다 re-render가 발생하므로 지양)
- 이동: `ArrowLeft`/`ArrowRight`가 눌려있는 동안 매 프레임 플레이어 x좌표 이동
- 발사: `Space` 또는 클릭 시 작살 1개 생성 (누르고 있다고 연속 발사되지 않도록, `keydown` 이벤트 기준으로 1회만 트리거하고 `keyup` 전까지 재발사 안 됨)

## 컴포넌트/파일 구조

```
src/
  game/
    useGameLoop.ts      # requestAnimationFrame 기반 게임 루프 훅
    useKeyboard.ts       # 눌려있는 키 集合을 관리하는 훅
    constants.ts          # 이동 속도, 작살 속도 등 상수
  screens/
    GameScreen.tsx        # 게임 루프 구성, Player/Harpoon 렌더링
    GameScreen.css
    Player.tsx             # 플레이어 캐릭터 표시 (위치는 부모가 ref로 직접 제어)
    Player.css
    Harpoon.tsx             # 작살 표시
    Harpoon.css
```

- 기존 Phase 1의 placeholder `GameScreen.tsx` 내용을 교체
- Player/Harpoon은 표시 전용 컴포넌트로 두고, 위치/속도 등 로직은 `GameScreen.tsx` + `game/` 훅에서 관리 (관심사 분리)

## 플레이어(Player) 설계

- 위치: `x` (좌우), `y`는 화면 하단 고정
- 이동 범위: 화면 좌우 경계를 벗어나지 않도록 clamp 처리
- 이동 속도: 상수로 관리 (`PLAYER_SPEED`), 이후 난이도 조정 시 이 값만 변경하면 되도록 `constants.ts`에 분리

## 작살(Harpoon) 설계

- 발사 시 플레이어의 현재 x좌표, 화면 하단 y좌표에서 시작하는 작살 객체를 배열에 추가
  ```ts
  type Harpoon = { id: number; x: number; y: number }
  ```
- 매 프레임 `y`값을 위로 이동 (`HARPOON_SPEED`)
- `y`가 화면 상단을 벗어나면 배열에서 제거 (아직 풍선과의 충돌 판정은 없음, Phase 4에서 추가)
- 여러 발이 동시에 존재할 수 있도록 배열로 관리하고, 고유 `id`로 각 작살을 구분해 렌더링 시 key로 사용

## 스타일링 방침

- Phase 1과 동일하게 순수 CSS 사용
- 플레이어/작살은 절대 위치(`position: absolute`) + `transform`으로 배치, 게임 영역(`GameScreen`)은 `position: relative`인 컨테이너로 기준점 역할

## 확인 기준 (Acceptance Criteria)

`docs/PLAN.md`의 "고객님이 확인하실 부분"과 동일하게, 아래 항목이 모두 만족되면 Phase 2 완료로 본다.

- [ ] 화면 하단에 플레이어 캐릭터가 보인다
- [ ] 좌/우 방향키를 누르고 있는 동안 캐릭터가 부드럽게 이동하고, 화면 밖으로 나가지 않는다
- [ ] 스페이스바(또는 클릭)로 작살을 발사하면 화면 위쪽까지 올라가다가 자연스럽게 사라진다
- [ ] 연속으로 여러 번 발사해도 각 작살이 독립적으로 움직이며 겹치거나 끊기지 않는다

## 범위 밖 (다음 Phase에서 처리)

- 풍선 등장 및 물리(Phase 3)
- 작살-풍선 충돌, 풍선 분열, 플레이어-풍선 충돌/HP(Phase 4)
