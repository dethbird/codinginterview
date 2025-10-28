import React, { useState } from 'react'

const sample = [
  { id: 1, name: 'Alice', email: 'alice@example.com', age: 28 },
  { id: 2, name: 'Bob', email: 'bob@example.com', age: 35 },
  { id: 3, name: 'Cara', email: 'cara@example.com', age: 22 },
]

export default function SearchTable({ rows = sample }) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })

  const filtered = rows // TODO
  const sorted = filtered // TODO

  return (
    <div>
      <input aria-label="search" value={q} onChange={e => setQ(e.target.value)} />
      <table>
        <thead>
          <tr>
            <th><button>Name</button></th>
            <th><button>Email</button></th>
            <th><button>Age</button></th>
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
    </div>
  )
}
