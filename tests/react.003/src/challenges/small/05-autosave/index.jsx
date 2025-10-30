
import React, { useEffect, useRef, useState } from 'react'

export default function AutosaveInput({ storageKey = 'autosave', debounceMs = 500 }) {
    // Load from localStorage once (parse stored JSON so we don't double-encode)
    const [text, setText] = useState(() => {
        const raw = localStorage.getItem(storageKey)
        return raw != null ? JSON.parse(raw) : ''
    })
    const timerRef = useRef(null);

    // debounce localstorage write to debounceMs
    useEffect(() => {
        
        // when `text` changes via keystroke, (re)create the setTimeout
        // if one exists kill it
        if(timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
            console.log('saving to storage')
            // save to storage
            localStorage.setItem(storageKey, JSON.stringify(text))
            // clear timer
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }, debounceMs);

        // cleanup function
        return () => {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        };

        
    }, [text, storageKey, debounceMs]);
    
    // TODO: debounce save with setTimeout + cleanup
    return (
        <div>
            <input aria-label="text" value={text} onChange={e => setText(e.target.value)} />
        </div>
    )
}
