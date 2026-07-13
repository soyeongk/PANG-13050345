import { forwardRef } from 'react'
import './Player.css'

type PlayerProps = {
  invulnerable?: boolean
}

const Player = forwardRef<HTMLDivElement, PlayerProps>(({ invulnerable }, ref) => {
  const className = invulnerable ? 'player player--invulnerable' : 'player'
  return <div ref={ref} className={className} />
})

Player.displayName = 'Player'

export default Player
