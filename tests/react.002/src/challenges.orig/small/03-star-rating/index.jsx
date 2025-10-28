import React, { useState } from 'react'

export default function StarRating({ max = 5, value, onChange }) {
  const [hover, setHover] = useState(null)
  const [internal, setInternal] = useState(0)
  const current = 0 // TODO: derive from props vs internal vs hover

  // TODO: render max stars as buttons, highlight <= current
  // TODO: handle mouse enter/leave, click to commit (onChange or internal)
  // TODO: keyboard support
  return <div role="group" aria-label="rating">{/* stars here */}</div>
}
