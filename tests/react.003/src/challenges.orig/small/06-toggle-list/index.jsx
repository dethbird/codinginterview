import React, { useEffect, useRef, useState } from 'react'

const defaultItems = ['Alpha','Beta','Gamma','Delta']

export default function ToggleList({ items = defaultItems }) {
  const [sel, setSel] = useState([])
  const masterRef = useRef(null)

  useEffect(() => {
    if (!masterRef.current) return
    const all = sel.length === items.length
    const none = sel.length === 0
    masterRef.current.indeterminate = !all && !none
  }, [sel, items])

  const allChecked = sel.length === items.length

  const toggleAll = () => {
    setSel(allChecked ? [] : items.slice())
  }

  const toggleOne = (label) => {
    setSel(s => s.includes(label) ? s.filter(x => x !== label) : [...s, label])
  }

  return (
    <div>
      <label>
        <input ref={masterRef} type="checkbox" checked={allChecked} onChange={toggleAll} />
        Select All
      </label>
      <ul>
        {items.map(l => (
          <li key={l}>
            <label>
              <input type="checkbox" checked={sel.includes(l)} onChange={() => toggleOne(l)} />
              {l}
            </label>
          </li>
        ))}
      </ul>
      <div data-testid="summary">{sel.length} of {items.length} selected</div>
    </div>
  )
}
