import React, { useEffect, useReducer, useState } from 'react'

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const text = action.text.trim()
      if (!text) return state
      return [...state, { id: Date.now(), text, done: false }]
    }
    case 'toggle':
      return state.map(t => t.id === action.id ? { ...t, done: !t.done } : t)
    case 'delete':
      return state.filter(t => t.id !== action.id)
    case 'load':
      return action.payload
    default:
      return state
  }
}

export default function Todos() {
  const [todos, dispatch] = useReducer(reducer, [])
  const [text, setText] = useState('')

  // TODO: load/save localStorage

  const add = (e) => {
    e.preventDefault()
    dispatch({ type: 'add', text })
    setText('')
  }

  return (
    <div>
      <form onSubmit={add}>
        <input aria-label="new todo" value={text} onChange={e => setText(e.target.value)} />
        <button>Add</button>
      </form>
      <ul>
        {todos.map(t => (
          <li key={t.id}>
            <label>
              <input type="checkbox" checked={t.done} onChange={() => dispatch({ type: 'toggle', id: t.id })} />
              <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
            </label>
            <button onClick={() => dispatch({ type: 'delete', id: t.id })}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
