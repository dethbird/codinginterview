import React, { useEffect, useState } from 'react'

export default function SearchInput({ onSearch, delay = 500 }) {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (!onSearch) return
    const id = setTimeout(() => onSearch(value), delay)
    return () => clearTimeout(id)
  }, [value, delay, onSearch])

  return <input aria-label="search" value={value} onChange={e => setValue(e.target.value)} />
}
