import React, { useMemo, useState } from 'react'

const initial = ['Alpha','Beta','Gamma']

export default function CheckboxGroup() {
  const [selected, setSelected] = useState([])
  const all = useMemo(() => initial, [])
  const allChecked = selected.length === all.length
  const toggleAll = () => setSelected(allChecked ? [] : all)
  const toggle = (label) => setSelected(s => s.includes(label) ? s.filter(x => x !== label) : [...s, label])
  return (
    <div>
      <label><input type="checkbox" checked={allChecked} onChange={toggleAll} /> Select All</label>
      <ul>
        {all.map(l => (
          <li key={l}>
            <label><input type="checkbox" checked={selected.includes(l)} onChange={() => toggle(l)} /> {l}</label>
          </li>
        ))}
      </ul>
    </div>
  )
}
