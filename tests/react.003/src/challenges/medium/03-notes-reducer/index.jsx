
import React, { useReducer, useState } from 'react'

const newItem = (id, text, pinned = false) => {
    return {
        id,
        text,
        pinned
    }
}

const reducer =(state, action) => {
    // TODO implement actions: add, toggle, delete, query
    switch (action.type) {
        case 'add':
            return {... state, items: [...state.items, newItem(state.items.length, action.payload)]}
        case 'remove':
            return {... state, items: state.items.filter((item) => item.id !== action.payload)}
        case 'togglePin':
            // one-liner for reducer
            return { ...state, items: state.items.map(item => item.id === action.payload ? { ...item, pinned: !item.pinned } : item) }
        case 'query':
            return {... state, q: action.payload}
        default:
            return state;
    }
}

export default function Notes() {
    const [state, dispatch] = useReducer(reducer, { items: [], q: '' })
    const [text, setText] = useState('')

    const add = (e) => {
        e.preventDefault()
        // TODO dispatch add
        dispatch({type: 'add', payload: text})
        setText('')
    }

    const q = state.q.trim().toLowerCase();
    const filteredItems = q
      ? state.items.filter(item => item.text.toLowerCase().includes(q))
      : state.items;

    const filtered = [
      ...filteredItems.filter(item => item.pinned),
      ...filteredItems.filter(item => !item.pinned)
    ];// TODO apply query + pinned-first ordering
    

    return (
        <div>
            <form onSubmit={add}>
                <input 
                    className="input" 
                    aria-label="new" 
                    value={text} 
                    onChange={e => setText(e.target.value)} 
                    placeholder='new note ...'
                />
            </form>
            <input 
                className="input" 
                aria-label="query" 
                value={state.q} 
                onChange={e => dispatch({ type: 'query', payload: e.target.value })}
                placeholder='search ... '
            />
            <ul>
                {filtered.map(n => (
                    <li key={n.id}>
                        <button className="button" aria-label={`pin-${n.id}`} onClick={() => { dispatch({type: 'togglePin', payload: n.id}) }}>{n.pinned ? 'Unpin' : 'Pin'}</button>
                        <span>{n.text}</span>
                        <button className="button" aria-label={`del-${n.id}`} onClick={() => { dispatch({type: 'remove', payload: n.id}) }}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    )
}
