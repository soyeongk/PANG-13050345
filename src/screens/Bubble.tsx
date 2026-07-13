import { forwardRef } from 'react'
import './Bubble.css'

type BubbleProps = {
  diameter: number
}

const Bubble = forwardRef<HTMLDivElement, BubbleProps>(({ diameter }, ref) => {
  return (
    <div
      ref={ref}
      className="bubble"
      style={{ width: `${diameter}px`, height: `${diameter}px` }}
    />
  )
})

Bubble.displayName = 'Bubble'

export default Bubble
