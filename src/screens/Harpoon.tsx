import { forwardRef } from 'react'
import './Harpoon.css'

const Harpoon = forwardRef<HTMLDivElement>((_props, ref) => {
  return <div ref={ref} className="harpoon" />
})

Harpoon.displayName = 'Harpoon'

export default Harpoon
