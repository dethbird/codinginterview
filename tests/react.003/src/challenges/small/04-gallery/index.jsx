
import React, { useState } from 'react'


const imgs = [
  { src: 'https://cdn.midjourney.com/292223cb-60d8-4bc2-8323-2c6f91f661c7/0_0.png', alt: 'one' },
  { src: 'https://cdn.midjourney.com/553e5694-d574-47be-991a-1000a549b5f6/0_0.png', alt: 'two' },
  { src: 'https://cdn.midjourney.com/96744753-2839-4683-a09f-95e76dfb0d9d/0_0.png', alt: 'three' },
]


export default function Gallery({ images = imgs }) {
    const [idx, setIdx] = useState(0)
    const handleThumnailClick = (i) => {
        setIdx(i);
    }
    const handleKeyDown = (e) => {
        if(!e.key) return;
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            setIdx(i => {
                if (i - 1 < 0) {
                    return images.length - 1
                }
                return i - 1
            });
        }
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            setIdx(i => {
                if (i + 1 === images.length) {
                    return 0
                }
                return i + 1
            });
        }
    }
    if (!images.length) return <p>No images</p>
    const active = images[idx]
    return (
        <div onKeyDown={ handleKeyDown }>
            <img src={active.src} alt={active.alt} data-testid="main" />
            <ul>
                {images.map((im, i) => (
                    <li key={im.src}>
                        <button aria-current={i === idx} onClick={ () => handleThumnailClick(i) }>
                            <img src={im.src} alt={im.alt} width="32" height="32" />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}
