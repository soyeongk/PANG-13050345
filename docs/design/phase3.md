# Phase 3 설계 - 풍선 등장 및 튕기는 물리

`docs/PLAN.md`의 Phase 3, `docs/FEATURES/game_rule.md`의 풍선(Bubble) 시스템을 기준으로 실제 구현 설계를 정리한 문서다.

## 목표 (재확인)

- 화면에 큰 풍선이 등장해 중력의 영향을 받으며 벽/바닥/천장에 부딪혀 튕기는 움직임을 구현
- 아직 작살-풍선, 플레이어-풍선 충돌 처리는 없음 (Phase 4에서 추가). 이 단계는 순수하게 "풍선의 움직임이 자연스러운지"만 검증

## 물리 모델

- 풍선은 `(x, y)` 위치와 `(vx, vy)` 속도를 가짐
- 매 프레임 중력 가속도(`GRAVITY`)를 `vy`에 더해 아래로 떨어지도록 함
- 바닥에 닿으면(`y + radius >= floorY`) `vy`를 반전시키되, 팡 특유의 "일정한 높이로 튕기는" 느낌을 위해 반전 시 속도 크기를 고정값으로 재설정 (감쇠 없이 일정 높이 유지)
- 좌/우 벽에 닿으면 `vx`를 반전 (좌우 이동은 감쇠 없이 등속 유지)
- 천장에 닿으면 `vy`를 반전 (아래로 향하게)
- 요약하면 팡의 풍선은 당구공처럼 에너지 손실 없이 튕기는 단순 모델로 구현하고, 사실적인 물리 시뮬레이션은 지향하지 않음 (아케이드 게임 특유의 예측 가능한 튕김이 목적)

```ts
type Bubble = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  size: BubbleSize // 'large' | 'medium' | 'small' (Phase 4에서 분열 시 활용)
}
```

- Phase 3 범위에서는 `size`는 `'large'` 고정, 분열 로직은 다루지 않음 (타입만 미리 정의해 Phase 4에서 그대로 재사용)

## 컴포넌트/파일 구조

```
src/
  game/
    constants.ts        # GRAVITY, BUBBLE_BOUNCE_VY, BUBBLE_RADIUS 등 추가
    bubble.ts            # Bubble 타입, createBubble, updateBubble(물리 갱신 순수 함수)
  screens/
    GameScreen.tsx        # bubblesRef 추가, 게임 루프에서 updateBubble 호출 후 DOM transform 반영
    Bubble.tsx             # 풍선 표시 전용 컴포넌트 (Player/Harpoon과 동일한 forwardRef 패턴)
    Bubble.css
```

- 물리 갱신 로직(`updateBubble`)은 순수 함수로 `game/bubble.ts`에 분리해 Phase 4에서 충돌/분열 로직을 붙이기 쉽게 함
- 렌더링 컴포넌트(`Bubble.tsx`)는 Player/Harpoon과 동일하게 위치를 직접 `transform`으로 갱신하는 ref 기반 패턴 유지 (Phase 1~2에서 세운 방식과 일관성 유지)

## 게임 루프 통합

- `GameScreen.tsx`의 기존 `useGameLoop` 콜백 안에 풍선 갱신 단계 추가
- 처리 순서: 플레이어 이동 → 작살 이동 → 풍선 물리 갱신 (충돌 판정은 없으므로 순서 자체는 중요하지 않으나, 이후 Phase 4에서 "작살 이동 → 충돌 판정 → 풍선 갱신" 순서로 자연스럽게 확장되도록 지금부터 이 순서를 유지)
- 풍선은 스테이지 시작 시 1개, 화면 중앙 상단 근처에서 생성 (Mission 1의 난이도 초안대로 초기에는 적은 수로 시작)

## 스타일링 방침

- 원형 풍선을 표현하기 위해 `border-radius: 50%` 사용
- Player/Harpoon과 동일하게 `position: absolute` + `will-change: transform`
- 크기(`size`)에 따라 지름이 달라지므로, 지름 값을 CSS 변수(`--diameter`)로 받아 인라인 스타일로 지정 (Phase 4에서 분열 시 크기별 스타일 재사용을 위함)

## 확인 기준 (Acceptance Criteria)

`docs/PLAN.md`의 "고객님이 확인하실 부분"과 동일하게, 아래 항목이 모두 만족되면 Phase 3 완료로 본다.

- [ ] 풍선이 통통 튀는 움직임이 자연스럽다 (너무 빠르거나 느리지 않다)
- [ ] 풍선이 화면 좌/우/상/하 경계를 벗어나지 않고 반사된다
- [ ] 풍선이 특정 위치에 끼거나(clipping) 멈추는 등 비정상 동작 없이 계속 움직인다

## 범위 밖 (다음 Phase에서 처리)

- 작살-풍선 충돌 및 크기별 분열/소멸 로직 (Phase 4)
- 플레이어-풍선 충돌 및 HP 감소 (Phase 4)
- 풍선이 여러 개 동시에 존재할 때의 배치/난이도 조정 (Mission 1 최종 난이도는 `docs/FEATURES/mission1.md` 기준으로 Phase 4~5에서 조정)
