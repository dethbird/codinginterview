import React, { useMemo, useState } from 'react'

const sample = [
  { id: 1, name: 'Alice', email: 'alice@example.com', age: 28 },
  { id: 2, name: 'Bob', email: 'bob@example.com', age: 35 },
  { id: 3, name: 'Cara', email: 'cara@example.com', age: 22 },
]

export default function SortingTable({ rows = sample }) {
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })
  const sorted = useMemo(() => {
    const arr = [...rows]
    arr.sort((a, b) => {
      const va = a[sort.key]
      const vb = b[sort.key]
      if (va < vb) return sort.dir === 'asc' ? -1 : 1
      if (va > vb) return sort.dir === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [rows, sort])

  const header = (key, label) => (
    <th key={key}>
      <button onClick={() => setSort(s => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))}>
        {label} {sort.key === key ? (sort.dir === 'asc' ? '↑' : '↓') : ''}
      </button>
    </th>
  )

  return (
    <table>
      <thead>
        <tr>
          {header('name', 'Name')}
          {header('email', 'Email')}
          {header('age', 'Age')}
        </tr>
      </thead>
      <tbody>
        {sorted.map(r => (
          <tr key={r.id}>
            <td>{r.name}</td>
            <td>{r.email}</td>
            <td>{r.age}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
