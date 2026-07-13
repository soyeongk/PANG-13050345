# Phase 5 설계 - 목숨(Life) 시스템 & Mission 1 클리어/게임오버

`docs/PLAN.md`의 Phase 5, `docs/FEATURES/mission1.md`의 목숨/클리어/실패 조건을 기준으로 실제 구현 설계를 정리한 문서다. 이 Phase가 끝나면 메인 화면부터 클리어/게임오버까지 막힘 없이 플레이 가능한 Mission 1 완성본이 된다.

## 목표 (재확인)

- 목숨 3개, HP가 0이 되면 목숨 1개 차감 후 HP 5로 리셋되어 스테이지 재시작
- 목숨을 모두 소진하면 게임 오버 화면 표시, 재시작 가능
- 화면 내 모든 풍선(분열된 풍선 포함)을 제거하면 Mission 1 클리어 화면 표시

## 상태(Status) 모델

`GameScreen`에 현재 플레이 상태를 나타내는 `status`를 추가한다.

```ts
type GameStatus = 'playing' | 'cleared' | 'gameOver'
const [status, setStatus] = useState<GameStatus>('playing')
```

- 게임 루프(`useGameLoop` 콜백)는 `status !== 'playing'`이면 맨 앞에서 즉시 return해 이동/충돌/물리 갱신을 모두 멈춘다 (클리어/게임오버 화면이 떠 있는 동안 캐릭터나 풍선이 계속 움직이지 않도록)
- `status`가 `'cleared'` 또는 `'gameOver'`일 때 `ResultOverlay` 컴포넌트를 게임 화면 위에 오버레이로 띄운다

## 목숨(Life) 시스템

- `const [lives, setLives] = useState(PLAYER_INITIAL_LIVES)` (`PLAYER_INITIAL_LIVES = 3`, `game/constants.ts`에 추가)
- 기존 HP 감소 로직(Phase 4의 "7. 플레이어-풍선 충돌 판정") 안에서, HP가 감소한 결과 값이 0이 되는 순간을 감지해 처리 분기:
  - `lives - 1 <= 0` → `setStatus('gameOver')`
  - 그 외 → `setLives((l) => l - 1)` 후 `resetStage()` 호출 (아래 참고)

```ts
if (isHit) {
  setHp((prev) => {
    const next = clamp(prev - 1, 0, PLAYER_INITIAL_HP)
    if (next === 0) {
      if (lives <= 1) {
        setStatus('gameOver')
      } else {
        setLives((l) => l - 1)
        resetStage()
      }
    }
    return next
  })
  invulnerableRemainingRef.current = INVULNERABILITY_DURATION
  setIsInvulnerable(true)
}
```

- `lives`를 `setHp` 콜백 안에서 참조하므로, 최신 값을 안전하게 읽기 위해 `livesRef`(ref로 최신 lives 미러링)를 함께 두는 방식도 고려했으나, 목숨 차감은 매우 드물게 발생하는 이벤트이므로 클로저 캡처 이슈를 피하기 위해 `setLives`도 함수형 업데이트로 통일해 처리한다

## 스테이지 재시작 (`resetStage`)

HP 소진으로 목숨을 잃었지만 게임오버는 아닌 경우, 아래를 초기화하고 플레이를 이어간다.

- HP를 `PLAYER_INITIAL_HP`(5)로 리셋
- 화면 내 모든 작살 제거 (`harpoonsRef.current = []`, `setHarpoonIds([])`)
- 화면 내 모든 풍선 제거 후, Mission 1 초기 배치대로 큰 풍선 다시 생성 (초기 마운트 시 로직과 동일하므로 함수로 공통화: `spawnInitialBubbles(container)`)
- 플레이어 위치를 화면 중앙으로 재배치
- 무적 시간을 짧게 부여해(재시작 직후 바로 다시 맞는 것을 방지) `invulnerableRemainingRef.current = INVULNERABILITY_DURATION`

## 클리어(Clear) 판정

- 매 프레임 풍선 충돌 처리(Phase 4의 "4. 작살/풍선 정리") 이후, `bubblesRef.current.length === 0`이면 클리어로 판정
- 판정 위치: 분열 로직까지 모두 반영된 뒤의 최종 풍선 개수를 봐야 하므로, "작살-풍선 충돌 → 분열된 풍선 추가/제거 반영" 단계 바로 다음에 검사
- `bubblesRef.current.length === 0 && status === 'playing'`이면 `setStatus('cleared')`

## 재시작 / 종료 UI

- `ResultOverlay` 컴포넌트: `status`가 `'cleared'` 또는 `'gameOver'`일 때 표시되는 오버레이
  - 클리어: "MISSION 1 CLEAR" 문구
  - 게임오버: "GAME OVER" 문구
  - 공통 버튼: "다시 시작" (Mission 1을 처음부터 재시작: HP/목숨/풍선/작살/플레이어 위치 전부 초기화 후 `status`를 `'playing'`으로)
  - 공통 버튼: "메인으로" (App의 화면 상태를 `'main'`으로 되돌림 → `GameScreen`에 `onExit: () => void` prop 추가해 `App.tsx`에서 전달)

```ts
type ResultOverlayProps = {
  status: 'cleared' | 'gameOver'
  onRestart: () => void
  onExit: () => void
}
```

- "다시 시작"은 `resetStage()`와 유사하지만 `lives`도 `PLAYER_INITIAL_LIVES`로 되돌리는 `resetMission()` 함수로 별도 정의 (목숨 차감 후 재시작과, 미션 전체 재시작을 구분)

## HUD 확장

- 기존 `Hud`에 목숨 표시 추가: `HP: {hp} / 5   Life: {lives} / 3`
- `Hud` props에 `lives: number` 추가

## 파일 구조 변경

```
src/
  game/
    constants.ts        # PLAYER_INITIAL_LIVES 추가
  screens/
    GameScreen.tsx        # status/lives state, resetStage/resetMission, 클리어 판정 추가
    Hud.tsx                 # lives 표시 추가
    ResultOverlay.tsx        # 클리어/게임오버 오버레이 (신규)
    ResultOverlay.css
  App.tsx                  # GameScreen에 onExit 콜백 전달
```

## 확인 기준 (Acceptance Criteria)

`docs/PLAN.md`의 "고객님이 확인하실 부분"과 동일하게, 아래 항목이 모두 만족되면 Phase 5 완료로 본다.

- [ ] HP가 0이 되었을 때(목숨이 남아있는 경우) 목숨이 1개 줄고, HP가 다시 5로 채워지며 화면의 풍선/작살이 초기 상태로 재배치된다
- [ ] 목숨을 모두 잃으면 "GAME OVER" 화면이 뜨고, "다시 시작" 버튼으로 Mission 1을 처음부터 다시 플레이할 수 있다
- [ ] 모든 풍선(분열된 풍선 포함)을 제거하면 "MISSION 1 CLEAR" 화면이 뜬다
- [ ] 클리어/게임오버 화면이 떠 있는 동안 캐릭터나 풍선이 움직이지 않는다
- [ ] "메인으로" 버튼으로 메인 화면까지 되돌아갈 수 있다
- [ ] 메인 화면 → 게임 시작 → (플레이) → 클리어 또는 게임오버 → 재시작/메인으로, 전체 흐름이 막힘 없이 동작한다

## 범위 밖 (Mission 1 이후 확장)

- 점수(Score) 시스템 및 점수 기반 보너스 라이프
- 더블 와이어 등 파워업 아이템
- Mission 2 이상의 추가 스테이지, 스테이지 선택 UI
