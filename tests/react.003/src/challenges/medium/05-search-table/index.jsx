
import React, { useEffect, useState } from 'react'
import cn from 'classnames'

const sample = [
    { id: 1, name: 'Alice', email: 'alice@example.com', age: 28 },
    { id: 2, name: 'Bob', email: 'bob@example.com', age: 35 },
    { id: 3, name: 'Cara', email: 'cara@example.com', age: 22 },
]

export default function SearchTable({ rows = sample }) {
    const [q, setQ] = useState('')
    const [sort, setSort] = useState({ key: 'name', dir: 'asc' })

    const handleSort = (key) => {
        setSort(s => {
            // if switching to a new key, default to ascending
            if (s.key !== key) return { key, dir: 'asc' }
            // otherwise toggle direction
            return { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        })
    }

    const showSortDirection = (k) => {
        if (k !== sort.key) return;
        if (sort.dir == 'asc') {
            return <span data-testid="dir-up">👇</span>
        } else {
            return <span data-testid="dir-down">👆</span>
        }
    }

    const filtered = rows.filter(item => {
        return (
            item.name.trim().toLowerCase().includes(q.trim().toLocaleLowerCase())
            || item.email.trim().toLowerCase().includes(q.trim().toLocaleLowerCase())
            || String(item.age).trim().toLowerCase().includes(q.trim().toLocaleLowerCase())
        )
    })
    const sorted = filtered.slice().sort((a, b) => {
        const dir = sort.dir === 'asc' ? 1 : -1
        const va = a[sort.key]
        const vb = b[sort.key]
        if (typeof va === 'number' && typeof vb === 'number') {
            return (va - vb) * dir
        }
        return String(va).localeCompare(String(vb)) * dir
    })

    return (
        <div>
            <input className="input" aria-label="search" value={q} onChange={e => setQ(e.target.value)} />
            <table className="table">
                <thead>
                    <tr>
                        <th>
                            <button
                                className={cn('button', { 'is-active': sort.key === 'name' })}
                                onClick={() => handleSort('name')}
                            >
                                Name 
                            { showSortDirection('name') }
                            </button>
                        </th>
                        <th>
                            <button
                                className={cn('button', { 'is-active': sort.key === 'email' })}
                                onClick={() => handleSort('email')}
                            >
                                Email
                            { showSortDirection('email') }
                            </button>
                        </th>
                        <th>
                            <button
                                className={cn('button', { 'is-active': sort.key === 'age' })}
                                onClick={() => handleSort('age')}
                            >
                                Age
                            { showSortDirection('age') }
                            </button>
                        </th>
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
