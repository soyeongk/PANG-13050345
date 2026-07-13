import { useEffect } from 'react'
import './MainScreen.css'

type MainScreenProps = {
  onStart: () => void
}

function MainScreen({ onStart }: MainScreenProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        onStart()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onStart])

  return (
    <div className="main-screen">
      <h1 className="main-screen__title">PANG</h1>
      <button
        type="button"
        className="main-screen__start-button"
        onClick={onStart}
      >
        게임 시작
      </button>
      <ul className="main-screen__controls">
        <li>이동: ← / →</li>
        <li>발사: Space</li>
      </ul>
    </div>
  )
}

export default MainScreen
