import { PLAYER_INITIAL_HP } from '../game/constants'
import './Hud.css'

type HudProps = {
  hp: number
}

function Hud({ hp }: HudProps) {
  return (
    <div className="hud">
      HP: {hp} / {PLAYER_INITIAL_HP}
    </div>
  )
}

export default Hud
