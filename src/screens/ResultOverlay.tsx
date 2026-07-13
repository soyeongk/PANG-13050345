import './ResultOverlay.css'

type ResultOverlayProps = {
  status: 'cleared' | 'gameOver'
  onRestart: () => void
  onExit: () => void
}

function ResultOverlay({ status, onRestart, onExit }: ResultOverlayProps) {
  const title = status === 'cleared' ? 'MISSION 1 CLEAR' : 'GAME OVER'

  return (
    <div className="result-overlay">
      <p className="result-overlay__title">{title}</p>
      <div className="result-overlay__actions">
        <button type="button" onClick={onRestart}>
          다시 시작
        </button>
        <button type="button" onClick={onExit}>
          메인으로
        </button>
      </div>
    </div>
  )
}

export default ResultOverlay
