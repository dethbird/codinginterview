
import React, { useEffect, useRef, useState } from 'react'

export default function Dropdown({ items = [], onSelect }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef(null)

  // TODO: keyboard handlers for ArrowDown/Up, Enter, Escape
  // TODO: click outside to close

  return (
    <div ref={rootRef}>
      <button aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        Menu
      </button>
      {open && (
        <ul role="listbox">
          {items.map((it, i) => (
            <li key={it.id}>
              <button role="option" aria-selected={i === active} onClick={() => onSelect?.(it.id)}>
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
