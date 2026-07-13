import { GRAVITY, BUBBLE_BOUNCE_VY } from './constants'

export type BubbleSize = 'large' | 'medium' | 'small'

export type Bubble = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  size: BubbleSize
}

let nextBubbleId = 0

export function createBubble(params: {
  x: number
  y: number
  vx: number
  radius: number
  size: BubbleSize
}): Bubble {
  return {
    id: nextBubbleId++,
    x: params.x,
    y: params.y,
    vx: params.vx,
    vy: 0,
    radius: params.radius,
    size: params.size,
  }
}

export function updateBubble(
  bubble: Bubble,
  deltaTime: number,
  bounds: { width: number; height: number },
): Bubble {
  const { radius } = bubble
  let { x, y, vx, vy } = bubble

  vy += GRAVITY * deltaTime
  x += vx * deltaTime
  y += vy * deltaTime

  if (x - radius < 0) {
    x = radius
    vx = -vx
  } else if (x + radius > bounds.width) {
    x = bounds.width - radius
    vx = -vx
  }

  if (y - radius < 0) {
    y = radius
    vy = -vy
  }

  if (y + radius > bounds.height) {
    y = bounds.height - radius
    vy = BUBBLE_BOUNCE_VY
  }

  return { ...bubble, x, y, vx, vy }
}
