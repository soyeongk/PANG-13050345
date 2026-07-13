import { useState } from 'react'
import MainScreen from './screens/MainScreen'
import GameScreen from './screens/GameScreen'

type Screen = 'main' | 'game'

function App() {
  const [screen, setScreen] = useState<Screen>('main')

  if (screen === 'game') {
    return <GameScreen />
  }

  return <MainScreen onStart={() => setScreen('game')} />
}

export default App
