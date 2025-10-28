import React, { useEffect, useMemo, useRef, useState } from 'react'

const defaultItems = ['Alpha','Beta','Gamma','Delta']

export default function ToggleList({ items = defaultItems }) {
  const [sel, setSel] = useState([])
  const allChecked = false // TODO derive from sel vs items
  const masterRef = useRef(null)

  useEffect(() => {
    // TODO: set masterRef.current.indeterminate when partially selected
  }, [sel, items])

  const toggleAll = () => {
    // TODO
  }

  const toggleOne = (label) => {
    // TODO
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
