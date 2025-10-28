import React, { useState } from 'react'

export default function StarRating({ max = 5, value, onChange }) {
  const [hover, setHover] = useState(null)
  const [internal, setInternal] = useState(0)
  const current = 0 // TODO

  return (
    <div role="group" aria-label="rating">
      {/* TODO render stars as buttons, hover/commit/keyboard */}
    </div>
  )
}
