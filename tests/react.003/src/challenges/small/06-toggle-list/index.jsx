
import React, { useEffect, useRef, useState } from 'react'

const defaultItems = ['Alpha', 'Beta', 'Gamma', 'Delta']

export default function ToggleList({ items = defaultItems }) {
    const [sel, setSel] = useState([])
    const [allChecked, setAllChecked] = useState(false)
    const masterRef = useRef(null)

    // TODO: set masterRef.current.indeterminate based on selection
    // TODO: derive allChecked
    useEffect(() => {
        setAllChecked(sel.length === items.length)
    }, [sel, items]);

    const toggleAll = () => {
        setSel(s => {
            if (s.length < items.length) {
                return items;
            } else {
                return [];
            }
        })
    }

    const toggleOne = (label) => {
        if(!sel.includes(label)) {
            setSel(s => {
                return [...s, label];
            })
        } else {
            setSel(s => s.filter(i => i !== label))
        }
    }

    return (
        <div>
            <label>
                <input ref={masterRef} type="checkbox" checked={allChecked} onChange={toggleAll} />
                Select All
            </label>
            <ul>
                {items.map(l => (
                    <li key={l}>
                        <label>
                            <input type="checkbox" checked={sel.includes(l)} onChange={() => toggleOne(l)} />
                            {l}
                        </label>
                    </li>
                ))}
            </ul>
            <div data-testid="summary">{sel.length} of {items.length} selected</div>
        </div>
    )
}
