import React, { useState } from 'react'

export default function ReorderableList({ initial = ['A','B','C'], onChange }) {
  const [items, setItems] = useState(initial)
  // TODO: implement move logic
  return (
    <ul>
      {items.map((it, i) => (
        <li key={it}>
          {it}
          <button aria-label={`up-${it}`}>↑</button>
          <button aria-label={`down-${it}`}>↓</button>
        </li>
      ))}
    </ul>
  )
}
