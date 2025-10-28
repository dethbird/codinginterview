import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

function ensureRoot() {
  let el = document.getElementById('modal-root')
  if (!el) {
    el = document.createElement('div')
    el.id = 'modal-root'
    document.body.appendChild(el)
  }
  return el
}

export default function Modal({ open, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const root = ensureRoot()

  const content = (
    <div role="dialog" aria-modal="true" onClick={onClose} style={{
      position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.4)'
    }}>
      <div onClick={(e) => e.stopPropagation()} tabIndex={-1} style={{ background: 'white', padding: 16, minWidth: 300 }}>
        {children}
      </div>
    </div>
  )
  return createPortal(content, root)
}
