import React, { useEffect, useRef, useState } from 'react'

function fakeFetch(page) {
  // 3 pages of 10 items each
  if (page > 3) return Promise.resolve({ items: [], done: true })
  const items = Array.from({ length: 10 }, (_, i) => `Item ${(page - 1) * 10 + i + 1}`)
  return new Promise(res => setTimeout(() => res({ items, done: page === 3 }), 300))
}

export default function InfiniteList() {
  const [page, setPage] = useState(1)
  const [items, setItems] = useState([])
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef(null)

  useEffect(() => {
    let ignore = false
    setLoading(true)
    fakeFetch(page).then(({ items: next, done }) => {
      if (ignore) return
      setItems(prev => [...prev, ...next])
      setDone(done)
      setLoading(false)
    })
    return () => { ignore = true }
  }, [page])

  useEffect(() => {
    if (done) return
    const node = sentinelRef.current
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setPage(p => p + 1)
    })
    if (node) io.observe(node)
    return () => io.disconnect()
  }, [done])

  return (
    <div>
      <ul>
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
      {!done && <div ref={sentinelRef} data-testid="sentinel" style={{ height: 1 }} />}
      {loading && <p>Loading…</p>}
      {done && <p>End.</p>}
    </div>
  )
}
