# Phase 4 설계 - 풍선 분열 & 충돌(HP) 시스템

`docs/PLAN.md`의 Phase 4, `docs/FEATURES/game_rule.md`의 분열/충돌/HP 규칙을 기준으로 실제 구현 설계를 정리한 문서다.

## 목표 (재확인)

- 작살이 풍선에 맞으면 크기 단계에 따라 분열(large → medium → small) 또는 소멸
- 플레이어가 풍선에 닿으면 HP가 1 감소 (초기 HP 5)
- 화면에 현재 HP를 표시
- 목숨(Life) 차감, 게임오버, 스테이지 클리어 처리는 Phase 5에서 다루므로, 이 단계에서는 HP가 0이 되었을 때 더 이상 줄어들지 않도록 클램프만 해둔다

## 충돌 판정 방식

Phase 1~3에서 세운 것처럼 물리/충돌 로직은 순수 함수로 분리하고(`game/collision.ts`), `GameScreen.tsx`의 게임 루프에서 매 프레임 호출한다.

### 작살 vs 풍선

- 작살은 `x` 고정, `y`만 위로 움직이는 얇은 세로 막대이므로 "수직 선분 vs 원" 판정으로 처리
- 판정식: `|harpoon.x - bubble.x| < bubble.radius + HARPOON_WIDTH / 2` 이고, 작살의 y 범위(`[harpoon.y - moved, harpoon.y]`, 이번 프레임 이동 구간)가 `[bubble.y - bubble.radius, bubble.y + bubble.radius]`와 겹치면 충돌로 판정
- 이번 프레임 이동 구간까지 함께 검사하는 이유: 작살/프레임 속도가 빨라 한 프레임에 풍선 반지름보다 더 많이 이동하면 충돌을 못 잡고 통과(터널링)해버릴 수 있기 때문

```ts
export function harpoonHitsBubble(
  harpoon: { x: number; yFrom: number; yTo: number },
  bubble: { x: number; y: number; radius: number },
): boolean {
  const withinX = Math.abs(harpoon.x - bubble.x) < bubble.radius + HARPOON_WIDTH / 2
  if (!withinX) return false

  const bubbleTop = bubble.y - bubble.radius
  const bubbleBottom = bubble.y + bubble.radius
  return harpoon.yTo <= bubbleBottom && harpoon.yFrom >= bubbleTop
}
```

### 플레이어 vs 풍선

- 플레이어는 사각형(AABB), 풍선은 원이므로 "원-사각형" 판정 사용
- 사각형에서 원 중심에 가장 가까운 점을 구한 뒤, 그 점과 원 중심 사이 거리가 반지름보다 작으면 충돌

```ts
export function circleIntersectsRect(
  circle: { x: number; y: number; radius: number },
  rect: { x: number; y: number; width: number; height: number },
): boolean {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width)
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height)
  const dx = circle.x - closestX
  const dy = circle.y - closestY
  return dx * dx + dy * dy < circle.radius * circle.radius
}
```

## 풍선 분열 로직

- `game/bubble.ts`에 `splitBubble(bubble: Bubble): Bubble[]` 순수 함수 추가
- 크기 단계: `large → medium → small → 소멸` (4단계, `docs/FEATURES/game_rule.md` 기준)
- `size === 'small'`이면 빈 배열 반환 (소멸)
- 그 외에는 같은 위치에서 서로 반대 방향(`-BUBBLE_INITIAL_VX`, `+BUBBLE_INITIAL_VX`)으로 튕겨나가는 한 단계 작은 풍선 2개를 생성
- 분열된 풍선은 약간 위로 튀어 오르도록 `vy`를 음수 초기값(`BUBBLE_SPLIT_VY`)으로 설정해, 겹친 상태로 생성되지 않고 자연스럽게 갈라지는 것처럼 보이게 함

```ts
export function splitBubble(bubble: Bubble): Bubble[] {
  const nextSize = NEXT_SIZE[bubble.size] // large -> medium -> small -> null
  if (!nextSize) return []

  const radius = BUBBLE_RADIUS[nextSize]
  return [
    createBubble({ x: bubble.x, y: bubble.y, vx: -BUBBLE_INITIAL_VX, radius, size: nextSize }),
    createBubble({ x: bubble.x, y: bubble.y, vx: BUBBLE_INITIAL_VX, radius, size: nextSize }),
  ].map((b) => ({ ...b, vy: BUBBLE_SPLIT_VY }))
}
```

## 게임 루프 통합 (충돌 판정 단계 추가)

Phase 3에서 정한 순서(플레이어 이동 → 작살 이동 → 풍선 물리 갱신)에 아래 단계를 추가한다.

1. 플레이어 이동
2. 작살 이동
3. **작살-풍선 충돌 판정** → 맞은 작살/풍선 제거, `splitBubble` 결과를 풍선 목록에 추가
4. 풍선 물리 갱신
5. **플레이어-풍선 충돌 판정** → 충돌 시 HP 감소 (무적 시간 처리, 아래 참고)

작살 하나가 한 프레임에 여러 풍선과 동시에 겹치는 경우는 가장 먼저 발견된 풍선 하나만 처리(작살은 1개 명중 후 사라짐).

## HP 및 무적 시간(Invulnerability)

- 플레이어 HP는 `useState`로 관리 (변경 빈도가 낮아 리렌더링 비용 문제 없음)
- 풍선에 닿을 때마다 매 프레임 HP가 깎이는 것을 막기 위해, 충돌 시 짧은 무적 시간(`INVULNERABILITY_DURATION`, 예: 1000ms)을 부여하고 그동안은 추가 충돌을 무시
- 무적 시간 동안 플레이어를 반투명하게 표시해 시각적으로 피드백 (깜빡임 효과)
- HP는 0 미만으로 내려가지 않도록 클램프. HP가 0이 된 이후의 처리(목숨 차감, 재시작, 게임오버)는 Phase 5 범위

## 파일 구조 변경

```
src/
  game/
    constants.ts        # PLAYER_INITIAL_HP, INVULNERABILITY_DURATION, BUBBLE_SPLIT_VY 추가
    collision.ts          # harpoonHitsBubble, circleIntersectsRect
    bubble.ts              # splitBubble 추가 (기존 createBubble/updateBubble 유지)
  screens/
    GameScreen.tsx         # 충돌 판정 단계 추가, HP state 관리
    Hud.tsx                 # 현재 HP를 화면에 표시하는 오버레이 컴포넌트
    Hud.css
    Player.tsx              # 무적 시간 동안 반투명 처리를 위한 className 조건 추가
```

## HUD(체력 표시) 설계

- `GameScreen` 상단에 고정 위치로 `Hud` 컴포넌트를 오버레이
- 표시 내용: `HP: {hp} / 5` 텍스트만 (막대 UI 등은 이후 폴리싱 단계에서 고려)

## 확인 기준 (Acceptance Criteria)

`docs/PLAN.md`의 "고객님이 확인하실 부분"과 동일하게, 아래 항목이 모두 만족되면 Phase 4 완료로 본다.

- [ ] 큰 풍선을 작살로 맞췄을 때 두 개의 중간 풍선으로 분열된다
- [ ] 중간 풍선을 맞췄을 때 두 개의 작은 풍선으로 분열된다
- [ ] 가장 작은 풍선을 맞췄을 때 완전히 사라진다
- [ ] 화면 상단에 HP가 표시되고, 풍선에 닿으면 실제로 줄어든다
- [ ] 풍선에 닿은 직후 짧은 무적 시간 동안 연속으로 HP가 깎이지 않는다
- [ ] HP가 0이 되면 더 이상 음수로 내려가지 않는다

## 범위 밖 (다음 Phase에서 처리)

- 목숨(Life) 차감 및 HP 리셋, 스테이지 재시작 (Phase 5)
- 게임오버 화면, 모든 풍선 제거 시 클리어 화면 (Phase 5)
- 점수(Score) 시스템, 보너스 라이프, 파워업 (Mission 1 이후 확장)
