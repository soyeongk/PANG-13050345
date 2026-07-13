import { useCallback, useEffect, useRef, useState } from 'react'
import Player from './Player'
import Harpoon from './Harpoon'
import { useGameLoop } from '../game/useGameLoop'
import { useKeyboard } from '../game/useKeyboard'
import { clamp } from '../game/math'
import {
  PLAYER_WIDTH,
  PLAYER_SPEED,
  HARPOON_WIDTH,
  HARPOON_SPEED,
} from '../game/constants'
import './GameScreen.css'

type HarpoonEntity = {
  id: number
  x: number
  y: number
  el: HTMLDivElement | null
}

let nextHarpoonId = 0

function GameScreen() {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const playerXRef = useRef(0)
  const keysRef = useKeyboard()
  const harpoonsRef = useRef<HarpoonEntity[]>([])
  const [harpoonIds, setHarpoonIds] = useState<number[]>([])

  useEffect(() => {
    const container = containerRef.current
    const player = playerRef.current
    if (!container || !player) return

    playerXRef.current = container.clientWidth / 2 - PLAYER_WIDTH / 2
    player.style.transform = `translateX(${playerXRef.current}px)`
  }, [])

  const fireHarpoon = useCallback(() => {
    const id = nextHarpoonId++
    harpoonsRef.current.push({
      id,
      x: playerXRef.current + PLAYER_WIDTH / 2 - HARPOON_WIDTH / 2,
      y: 0,
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
    const container = containerRef.current
    const player = playerRef.current
    if (!container || !player) return

    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    let dx = 0
    if (keysRef.current.has('ArrowLeft')) dx -= 1
    if (keysRef.current.has('ArrowRight')) dx += 1
    playerXRef.current = clamp(
      playerXRef.current + dx * PLAYER_SPEED * deltaTime,
      0,
      containerWidth - PLAYER_WIDTH,
    )
    player.style.transform = `translateX(${playerXRef.current}px)`

    const remaining: HarpoonEntity[] = []
    let removed = false
    for (const harpoon of harpoonsRef.current) {
      harpoon.y += HARPOON_SPEED * deltaTime
      if (harpoon.y > containerHeight) {
        removed = true
        continue
      }
      if (harpoon.el) {
        harpoon.el.style.transform = `translate(${harpoon.x}px, -${harpoon.y}px)`
      }
      remaining.push(harpoon)
    }
    harpoonsRef.current = remaining

    if (removed) {
      const remainingIds = new Set(remaining.map((h) => h.id))
      setHarpoonIds((ids) => ids.filter((id) => remainingIds.has(id)))
    }
  })

  const makeHarpoonRef = (id: number) => (el: HTMLDivElement | null) => {
    const entity = harpoonsRef.current.find((h) => h.id === id)
    if (entity) {
      entity.el = el
      if (el) {
        el.style.transform = `translate(${entity.x}px, -${entity.y}px)`
      }
    }
  }

  return (
    <div ref={containerRef} className="game-screen">
      <Player ref={playerRef} />
      {harpoonIds.map((id) => (
        <Harpoon key={id} ref={makeHarpoonRef(id)} />
      ))}
    </div>
  )
}

export default GameScreen
