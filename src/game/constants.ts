export const PLAYER_WIDTH = 48
export const PLAYER_HEIGHT = 48
export const PLAYER_SPEED = 320 // px/sec
export const PLAYER_BOTTOM_OFFSET = 24 // px, Player.css의 bottom 값과 일치

export const HARPOON_WIDTH = 4
export const HARPOON_HEIGHT = 24
export const HARPOON_SPEED = 480 // px/sec

export const GRAVITY = 900 // px/sec^2
export const BUBBLE_BOUNCE_VY = -650 // px/sec, 바닥에 닿았을 때 재설정되는 속도
export const BUBBLE_INITIAL_VX = 150 // px/sec

export const BUBBLE_RADIUS = {
  large: 40,
  medium: 28,
  small: 16,
} as const

export const BUBBLE_SPLIT_VY = -300 // px/sec, 분열 직후 위로 튀는 초기 속도

export const PLAYER_INITIAL_HP = 5
export const PLAYER_INITIAL_LIVES = 3
export const INVULNERABILITY_DURATION = 1000 // ms
