
import React, { useState } from 'react'

export default function Gallery({ images = [] }) {
  const [idx, setIdx] = useState(0)
  if (!images.length) return <p>No images</p>
  const active = images[idx]
  return (
    <div>
      <img src={active.src} alt={active.alt} data-testid="main" />
      <ul>
        {images.map((im, i) => (
          <li key={im.src}>
            <button aria-current={i===idx}>
              <img src={im.src} alt={im.alt} width="32" height="32" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
