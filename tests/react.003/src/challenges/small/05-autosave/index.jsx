
import React, { useEffect, useRef, useState } from 'react'

export default function AutosaveInput({ storageKey = 'autosave', debounceMs = 0 }) {
    // Load from localStorage once (parse stored JSON so we don't double-encode)
    const [text, setText] = useState(() => {
        const raw = localStorage.getItem(storageKey)
        return raw != null ? JSON.parse(raw) : ''
    })
    const timerRef = useRef(null);
    const textRef = useRef(text);

    // keep a ref of latest text so unmount cleanup can access it
    useEffect(() => {
        textRef.current = text
    }, [text])

    // debounce localstorage write to debounceMs
    useEffect(() => {

        // when `text` changes via keystroke, (re)create the setTimeout
        // if one exists kill it
        if (debounceMs > 0) {
            if (timerRef.current) clearTimeout(timerRef.current)
            timerRef.current = setTimeout(() => {
                // save to storage
                localStorage.setItem(storageKey, JSON.stringify(text))
                // clear timer id
                timerRef.current = null;
            }, debounceMs);
        } else {
            // no debounce requested — save immediately
            localStorage.setItem(storageKey, JSON.stringify(text))
        }

        // cleanup function - runs before effect re-run and on unmount
        // Only clear the timeout here. Don't flush previous value on every re-run
        // (that would save the stale previous text). We'll flush on actual unmount
        // using a separate effect.
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };

    }, [text, storageKey, debounceMs]);
    
    // Provide a blur handler to flush pending debounce (tests call input.blur() to force save)
    const handleBlur = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
        localStorage.setItem(storageKey, JSON.stringify(text))
    }

    // flush pending save on unmount (use textRef to get latest value)
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
                localStorage.setItem(storageKey, JSON.stringify(textRef.current))
                timerRef.current = null
            }
        }
    }, [])

    return (
        <div>
            <input aria-label="text" value={text} onChange={e => setText(e.target.value)} onBlur={handleBlur} />
        </div>
    )
}
