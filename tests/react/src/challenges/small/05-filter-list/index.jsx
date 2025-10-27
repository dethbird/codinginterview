import React, { useMemo, useState } from 'react'

export default function FilterList({ items = [] }) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return items.filter(x => x.toLowerCase().includes(s))
  }, [q, items])

  return (
    <div>
      <input aria-label="search" value={q} onChange={e => setQ(e.target.value)} />
      <ul>
        {filtered.map((x, i) => <li key={i}>{x}</li>)}
      </ul>
    </div>
  )
}
