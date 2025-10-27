import React, { useState } from 'react'

export default function Tabs({ tabs = [] }) {
  const [active, setActive] = useState(0)
  return (
    <div>
      <div role="tablist">
        {tabs.map((t, i) => (
          <button role="tab" key={i} aria-selected={active === i} onClick={() => setActive(i)}>
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{tabs[active]?.content}</div>
    </div>
  )
}
