import { PLAYER_INITIAL_HP, PLAYER_INITIAL_LIVES } from '../game/constants'
import './Hud.css'

type HudProps = {
  hp: number
  lives: number
}

function Hud({ hp, lives }: HudProps) {
  return (
    <div className="hud">
      HP: {hp} / {PLAYER_INITIAL_HP} &nbsp; Life: {lives} / {PLAYER_INITIAL_LIVES}
    </div>
  )
}

export default Hud
