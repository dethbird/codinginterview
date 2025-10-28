import React, { useEffect, useState } from 'react'

export default function AutosaveInput({ storageKey = 'autosave' }) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  // TODO: load from localStorage once
  // TODO: debounce 500ms then save
  return (
    <div>
      <input aria-label="text" value={text} onChange={e => setText(e.target.value)} />
      {saving && <span>Saving…</span>}
    </div>
  )
}
