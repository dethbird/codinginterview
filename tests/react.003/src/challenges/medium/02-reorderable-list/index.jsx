
import React, { useEffect, useState } from 'react'

export default function ReorderableList({ initial = ['A', 'B', 'C', 'D'], onChange }) {
    const [items, setItems] = useState(initial)
    const reorder = (idx, direction) => {
        
        if (idx === 0 && direction === 'up') return items;
        if (idx === (items.length -1) && direction === 'down') return items;
        
        // calculate the index to swap;
        let newItems = [...items];
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        // swap
        [newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]]
        
        setItems(newItems);

        // broadcast
        if(onChange) onChange(newItems)
        
    }
    return (
        <ul>
            {items.map((it, i) => (
                <li key={it}>
                    <span className="tag is-large" role="listitem">{it}</span>
                    <button 
                        className="button" 
                        aria-label={`up-${it}`} 
                        onClick={ () => { reorder(i, 'up') } }
                        disabled={i === 0}
                    >↑</button>
                    <button 
                        className="button" 
                        aria-label={`down-${it}`} 
                        onClick={ () => { reorder(i, 'down') } }
                        disabled={i === items.length -1}
                    >↓</button>
                </li>
            ))}
        </ul>
    )
}
