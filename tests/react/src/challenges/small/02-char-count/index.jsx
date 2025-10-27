import React, { useState } from 'react'

export default function TextareaWithCount({ max = 200 }) {
  const [text, setText] = useState('')

  const over = text.length > max

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <textarea
        aria-label="message"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        cols={40}
      />
      <div aria-live="polite">
        <span aria-label="counter" style={{ color: over ? 'crimson' : 'inherit' }}>
          {text.length} / {max}
        </span>
      </div>
      <button disabled={over}>Submit</button>
    </form>
  )
}
