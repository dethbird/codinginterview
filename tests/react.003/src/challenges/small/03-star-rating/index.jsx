
import React, { useState } from 'react'

/**
 * Assuming optional prop value means the average rating overall.
 * It could be a controlled value meaning we should re-render on change
 * 
 * @param {*} param0 
 * @returns 
 */
export default function StarRating({ max = 5, value, onChange }) {
    const [hover, setHover] = useState(null)
    const [internal, setInternal] = useState(0)
    // current rating: controlled via `value` prop or internal state
    const current = typeof value === 'number' ? value : internal
    const rootRef = React.useRef(null)

    const renderButtons = () => {
        let buttons = [];
        for (let i = 0; i < max; i++) {
            buttons.push(
                <button 
                    className="button"
                    key={i}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => { setInternal(i + 1); onChange?.(i + 1) }}
                    // indicate preview when hovered
                    data-preview={hover === i ? 'true' : undefined}
                    aria-pressed={current >= i + 1}
                >
                        {i + 1}
                </button>
            )
        }
        return buttons;
    }

    // keyboard handling: Arrow keys adjust the rating when focused
    const handleKeyDown = (e) => {
        const k = e.key
        let next = current
        if (k === 'ArrowRight' || k === 'ArrowUp') {
            e.preventDefault()
            next = Math.min(current + 1, max)
        } else if (k === 'ArrowLeft' || k === 'ArrowDown') {
            e.preventDefault()
            next = Math.max(current - 1, 0)
        } else if (k === 'Home') {
            e.preventDefault()
            next = 0
        } else if (k === 'End') {
            e.preventDefault()
            next = max
        }

        if (next !== current) {
            setInternal(next)
            onChange?.(next)
            // update preview hover index so visuals update
            setHover(next > 0 ? next - 1 : null)
        }
    }

    return (
        <div role="group" aria-label="rating" ref={rootRef} tabIndex={0} onKeyDown={handleKeyDown}>
            { renderButtons() }
        </div>
    )
}
