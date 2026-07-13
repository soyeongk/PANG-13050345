import { useCallback, useEffect, useRef, useState } from 'react'
import Player from './Player'
import Harpoon from './Harpoon'
import BubbleView from './Bubble'
import Hud from './Hud'
import ResultOverlay from './ResultOverlay'
import { useGameLoop } from '../game/useGameLoop'
import { useKeyboard } from '../game/useKeyboard'
import { clamp } from '../game/math'
import { createBubble, updateBubble, splitBubble, type Bubble } from '../game/bubble'
import { harpoonHitsBubble, circleIntersectsRect } from '../game/collision'
import {
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_SPEED,
  PLAYER_BOTTOM_OFFSET,
  PLAYER_INITIAL_HP,
  PLAYER_INITIAL_LIVES,
  HARPOON_WIDTH,
  HARPOON_HEIGHT,
  HARPOON_SPEED,
  BUBBLE_RADIUS,
  BUBBLE_INITIAL_VX,
  INVULNERABILITY_DURATION,
} from '../game/constants'
import './GameScreen.css'

type HarpoonEntity = {
  id: number
  x: number
  y: number
  el: HTMLDivElement | null
}

type BubbleEntity = Bubble & { el: HTMLDivElement | null }

type GameStatus = 'playing' | 'cleared' | 'gameOver'

let nextHarpoonId = 0

type GameScreenProps = {
  onExit: () => void
}

function GameScreen({ onExit }: GameScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const playerXRef = useRef(0)
  const keysRef = useKeyboard()
  const harpoonsRef = useRef<HarpoonEntity[]>([])
  const [harpoonIds, setHarpoonIds] = useState<number[]>([])
  const bubblesRef = useRef<BubbleEntity[]>([])
  const [bubbleIds, setBubbleIds] = useState<number[]>([])
  const invulnerableRemainingRef = useRef(0)
  const [hp, setHp] = useState(PLAYER_INITIAL_HP)
  const [lives, setLives] = useState(PLAYER_INITIAL_LIVES)
  const [isInvulnerable, setIsInvulnerable] = useState(false)
  const [status, setStatus] = useState<GameStatus>('playing')

  const spawnInitialBubbles = useCallback((container: HTMLDivElement) => {
    const bubble = createBubble({
      x: container.clientWidth / 2,
      y: BUBBLE_RADIUS.large,
      vx: BUBBLE_INITIAL_VX,
      radius: BUBBLE_RADIUS.large,
      size: 'large',
    })
    bubblesRef.current = [{ ...bubble, el: null }]
    setBubbleIds([bubble.id])
  }, [])

  const resetStage = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    setHp(PLAYER_INITIAL_HP)
    harpoonsRef.current = []
    setHarpoonIds([])
    spawnInitialBubbles(container)

    playerXRef.current = container.clientWidth / 2 - PLAYER_WIDTH / 2
    if (playerRef.current) {
      playerRef.current.style.transform = `translateX(${playerXRef.current}px)`
    }

    invulnerableRemainingRef.current = INVULNERABILITY_DURATION
    setIsInvulnerable(true)
  }, [spawnInitialBubbles])

  const resetMission = useCallback(() => {
    setLives(PLAYER_INITIAL_LIVES)
    resetStage()
    setStatus('playing')
  }, [resetStage])

  useEffect(() => {
    const container = containerRef.current
    const player = playerRef.current
    if (!container || !player) return

    playerXRef.current = container.clientWidth / 2 - PLAYER_WIDTH / 2
    player.style.transform = `translateX(${playerXRef.current}px)`

    spawnInitialBubbles(container)
  }, [spawnInitialBubbles])

  const fireHarpoon = useCallback(() => {
    const id = nextHarpoonId++
    const container = containerRef.current
    const startY = (container?.clientHeight ?? 0) - PLAYER_BOTTOM_OFFSET - PLAYER_HEIGHT
    harpoonsRef.current.push({
      id,
      x: playerXRef.current + PLAYER_WIDTH / 2 - HARPOON_WIDTH / 2,
      y: startY,
      el: null,
    })
    setHarpoonIds((ids) => [...ids, id])
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && !e.repeat) {
        fireHarpoon()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fireHarpoon])

  useGameLoop((deltaTime) => {
    if (status !== 'playing') return

    const container = containerRef.current
    const player = playerRef.current
    if (!container || !player) return

    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    // 1. 플레이어 이동
    let dx = 0
    if (keysRef.current.has('ArrowLeft')) dx -= 1
    if (keysRef.current.has('ArrowRight')) dx += 1
    playerXRef.current = clamp(
      playerXRef.current + dx * PLAYER_SPEED * deltaTime,
      0,
      containerWidth - PLAYER_WIDTH,
    )
    player.style.transform = `translateX(${playerXRef.current}px)`

    // 2. 작살 이동
    for (const harpoon of harpoonsRef.current) {
      harpoon.y -= HARPOON_SPEED * deltaTime
    }

    // 3. 작살-풍선 충돌 판정
    const hitBubbleIds = new Set<number>()
    const spawnedBubbles: BubbleEntity[] = []
    const hitHarpoonIds = new Set<number>()

    for (const harpoon of harpoonsRef.current) {
      const harpoonCenterX = harpoon.x + HARPOON_WIDTH / 2
      for (const bubble of bubblesRef.current) {
        if (hitBubbleIds.has(bubble.id)) continue
        const hit = harpoonHitsBubble(
          { x: harpoonCenterX, yFrom: harpoon.y, yTo: harpoon.y + HARPOON_HEIGHT },
          { x: bubble.x, y: bubble.y, radius: bubble.radius },
        )
        if (hit) {
          hitHarpoonIds.add(harpoon.id)
          hitBubbleIds.add(bubble.id)
          for (const fragment of splitBubble(bubble)) {
            spawnedBubbles.push({ ...fragment, el: null })
          }
          break
        }
      }
    }

    // 4. 작살/풍선 정리 (제거 + 분열된 풍선 추가)
    const remainingHarpoons: HarpoonEntity[] = []
    let harpoonsChanged = hitHarpoonIds.size > 0
    for (const harpoon of harpoonsRef.current) {
      if (hitHarpoonIds.has(harpoon.id)) continue
      if (harpoon.y + HARPOON_HEIGHT < 0) {
        harpoonsChanged = true
        continue
      }
      if (harpoon.el) {
        harpoon.el.style.transform = `translate(${harpoon.x}px, ${harpoon.y}px)`
      }
      remainingHarpoons.push(harpoon)
    }
    harpoonsRef.current = remainingHarpoons

    if (harpoonsChanged) {
      const remainingIds = new Set(remainingHarpoons.map((h) => h.id))
      setHarpoonIds((ids) => ids.filter((id) => remainingIds.has(id)))
    }

    const bubblesAfterHits = bubblesRef.current.filter((b) => !hitBubbleIds.has(b.id))
    bubblesRef.current = [...bubblesAfterHits, ...spawnedBubbles]

    if (hitBubbleIds.size > 0 || spawnedBubbles.length > 0) {
      setBubbleIds(bubblesRef.current.map((b) => b.id))
    }

    // 4-1. 클리어 판정: 모든 풍선(분열 포함)이 제거되었는지 확인
    if (bubblesRef.current.length === 0) {
      setStatus('cleared')
      return
    }

    // 5. 풍선 물리 갱신
    const bounds = { width: containerWidth, height: containerHeight }
    for (const bubble of bubblesRef.current) {
      const updated = updateBubble(bubble, deltaTime, bounds)
      bubble.x = updated.x
      bubble.y = updated.y
      bubble.vx = updated.vx
      bubble.vy = updated.vy
      if (bubble.el) {
        bubble.el.style.transform = `translate(${bubble.x - bubble.radius}px, ${bubble.y - bubble.radius}px)`
      }
    }

    // 6. 무적 시간 갱신
    if (invulnerableRemainingRef.current > 0) {
      invulnerableRemainingRef.current -= deltaTime * 1000
      if (invulnerableRemainingRef.current <= 0) {
        invulnerableRemainingRef.current = 0
        setIsInvulnerable(false)
      }
    }

    // 7. 플레이어-풍선 충돌 판정
    if (invulnerableRemainingRef.current <= 0) {
      const playerRect = {
        x: playerXRef.current,
        y: containerHeight - PLAYER_BOTTOM_OFFSET - PLAYER_HEIGHT,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
      }
      const isHit = bubblesRef.current.some((bubble) =>
        circleIntersectsRect(
          { x: bubble.x, y: bubble.y, radius: bubble.radius },
          playerRect,
        ),
      )
      if (isHit) {
        const nextHp = clamp(hp - 1, 0, PLAYER_INITIAL_HP)
        setHp(nextHp)

        if (nextHp === 0) {
          if (lives <= 1) {
            setLives(0)
            setStatus('gameOver')
          } else {
            setLives((prev) => prev - 1)
            resetStage()
          }
        } else {
          invulnerableRemainingRef.current = INVULNERABILITY_DURATION
          setIsInvulnerable(true)
        }
      }
    }
  })

  const makeHarpoonRef = (id: number) => (el: HTMLDivElement | null) => {
    const entity = harpoonsRef.current.find((h) => h.id === id)
    if (entity) {
      entity.el = el
      if (el) {
        el.style.transform = `translate(${entity.x}px, ${entity.y}px)`
      }
    }
  }

  const makeBubbleRef = (id: number) => (el: HTMLDivElement | null) => {
    const entity = bubblesRef.current.find((b) => b.id === id)
    if (entity) {
      entity.el = el
      if (el) {
        el.style.transform = `translate(${entity.x - entity.radius}px, ${entity.y - entity.radius}px)`
      }
    }
  }

  return (
    <div ref={containerRef} className="game-screen">
      <Hud hp={hp} lives={lives} />
      <Player ref={playerRef} invulnerable={isInvulnerable} />
      {harpoonIds.map((id) => (
        <Harpoon key={id} ref={makeHarpoonRef(id)} />
      ))}
      {bubbleIds.map((id) => {
        const entity = bubblesRef.current.find((b) => b.id === id)
        const diameter = (entity?.radius ?? BUBBLE_RADIUS.large) * 2
        return <BubbleView key={id} ref={makeBubbleRef(id)} diameter={diameter} />
      })}
      {status !== 'playing' && (
        <ResultOverlay status={status} onRestart={resetMission} onExit={onExit} />
      )}
    </div>
  )
}

export default GameScreen
