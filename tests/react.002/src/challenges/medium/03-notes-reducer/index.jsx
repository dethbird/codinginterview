import React, { useReducer, useState } from 'react'

function reducer(state, action) {
  // TODO implement actions: add, toggle, delete, query
  return state
}

export default function Notes() {
  const [state, dispatch] = useReducer(reducer, { items: [], q: '' })
  const [text, setText] = useState('')

  const add = (e) => {
    e.preventDefault()
    // TODO dispatch add
    setText('')
  }

  const filtered = state.items // TODO apply query + pinned-first ordering

  return (
    <div>
      <form onSubmit={add}>
        <input aria-label="new" value={text} onChange={e => setText(e.target.value)} />
      </form>
      <input aria-label="query" value={state.q} onChange={e => dispatch({ type: 'query', q: e.target.value })} />
      <ul>
        {filtered.map(n => (
          <li key={n.id}>
            <button aria-label={`pin-${n.id}`}>{n.pinned ? 'Unpin' : 'Pin'}</button>
            <span>{n.text}</span>
            <button aria-label={`del-${n.id}`}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
