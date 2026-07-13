import { useEffect, useRef } from 'react'

export function useGameLoop(callback: (deltaTime: number) => void) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    let rafId: number
    let lastTime = performance.now()

    const tick = (time: number) => {
      const deltaTime = (time - lastTime) / 1000
      lastTime = time
      callbackRef.current(deltaTime)
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])
}
