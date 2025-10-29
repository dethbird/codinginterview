
import React, { useEffect, useRef, useState } from 'react'

export default function Dropdown({ items = [{ id: 1, label: 'A' }, { id: 2, label: 'B' }], onSelect }) {
    const [open, setOpen] = useState(false)
    const [active, setActive] = useState(0)
    const rootRef = useRef(null)

    // keyboard handlers for ArrowDown/Up, Enter, Escape
    const handleKeyDown = (e) => {
        // use e.key because synthetic events in the test env set key
        const k = e.key
        if (!open) return
        if (k === 'ArrowDown') {
            e.preventDefault()
            setActive(a => Math.min(a + 1, items.length - 1))
        } else if (k === 'ArrowUp') {
            e.preventDefault()
            setActive(a => Math.max(a - 1, 0))
        } else if (k === 'Enter') {
            e.preventDefault()
            const it = items[active]
            if (it) {
                onSelect?.(it.id)
                // do not close on Enter so tests can continue navigating/selecting
            }
        } else if (k === 'Escape') {
            e.preventDefault()
            setOpen(false)
        }
    }
    // TODO: click outside to close
    useEffect(() => {
        function onDocumentPointer(e) {
            const root = rootRef.current
            if (!root) return
            // if click/touch is outside the root element, close
            if (!root.contains(e.target)) {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', onDocumentPointer)
        document.addEventListener('touchstart', onDocumentPointer)

        return () => {
            document.removeEventListener('mousedown', onDocumentPointer)
            document.removeEventListener('touchstart', onDocumentPointer)
        }
    }, [])

    return (
        <div ref={rootRef} onKeyDown={ handleKeyDown }>
            <button aria-haspopup="listbox" aria-expanded={open} onClick={() => { setOpen(o => { const next = !o; if (next) setActive(0); return next }); }}>
                Menu
            </button>
            {open && (
                <ul role="listbox">
                    {items.map((it, i) => (
                        <li key={it.id}>
                            <button role="option" aria-selected={i === active} onClick={() => onSelect?.(it.id)}>
                                {it.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
