
import React, { useEffect, useRef, useState } from 'react'

const defaultItems = ['Alpha','Beta','Gamma','Delta']

export default function ToggleList({ items = defaultItems }) {
  const [sel, setSel] = useState([])
  const masterRef = useRef(null)

  // TODO: set masterRef.current.indeterminate based on selection
  // TODO: derive allChecked

  const toggleAll = () => {
    // TODO
  }

  const toggleOne = (label) => {
    // TODO
  }

  return (
    <div>
      <label>
        <input ref={masterRef} type="checkbox" /* checked={allChecked} */ onChange={toggleAll} />
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
