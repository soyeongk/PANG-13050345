import { forwardRef } from 'react'
import './Player.css'

const Player = forwardRef<HTMLDivElement>((_props, ref) => {
  return <div ref={ref} className="player" />
})

Player.displayName = 'Player'

export default Player
