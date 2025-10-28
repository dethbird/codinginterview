import React, { useEffect, useState } from 'react'

export default function AutosaveInput({ storageKey = 'autosave' }) {
  const [text, setText] = useState('')
  // TODO: load from localStorage once
  // TODO: debounce save with setTimeout + cleanup
  return (
    <div>
      <input aria-label="text" value={text} onChange={e => setText(e.target.value)} />
    </div>
  )
}
