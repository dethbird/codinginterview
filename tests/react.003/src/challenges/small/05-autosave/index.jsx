
import React, { useEffect, useState } from 'react'

export default function AutosaveInput({ storageKey = 'autosave' }) {
    // TODO: load from localStorage once
    const [text, setText] = useState(localStorage.getItem(storageKey) || '')
    useEffect(() => {
        console.log(text);
        localStorage.setItem(storageKey, text)
    }, [text]);
    
    // TODO: debounce save with setTimeout + cleanup
    return (
        <div>
            <input aria-label="text" value={text} onChange={e => setText(e.target.value)} />
        </div>
    )
}
