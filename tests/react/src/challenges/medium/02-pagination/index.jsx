import React from 'react'

export default function Pagination({ total, perPage, page = 1, onChange }) {
  const pages = Math.max(1, Math.ceil(total / perPage))
  const set = (p) => onChange?.(Math.min(Math.max(1, p), pages))
  return (
    <div role="navigation" aria-label="pagination">
      <button disabled={page === 1} onClick={() => set(page - 1)}>Prev</button>
      {Array.from({ length: pages }).map((_, i) => (
        <button key={i} aria-current={page === i + 1} onClick={() => set(i + 1)}>{i + 1}</button>
      ))}
      <button disabled={page === pages} onClick={() => set(page + 1)}>Next</button>
    </div>
  )
}
