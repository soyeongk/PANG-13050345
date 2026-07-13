import { clamp } from './math'
import { HARPOON_WIDTH } from './constants'

export function harpoonHitsBubble(
  harpoon: { x: number; yFrom: number; yTo: number },
  bubble: { x: number; y: number; radius: number },
): boolean {
  const withinX = Math.abs(harpoon.x - bubble.x) < bubble.radius + HARPOON_WIDTH / 2
  if (!withinX) return false

  const bubbleTop = bubble.y - bubble.radius
  const bubbleBottom = bubble.y + bubble.radius
  // harpoon.yFrom(위쪽 끝) <= bubbleBottom, harpoon.yTo(아래쪽 끝) >= bubbleTop 이면 두 구간이 겹침
  return harpoon.yFrom <= bubbleBottom && harpoon.yTo >= bubbleTop
}

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
