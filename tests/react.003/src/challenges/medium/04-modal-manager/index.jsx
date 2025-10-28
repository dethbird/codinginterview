
import React, { createContext, useContext, useEffect, useState } from 'react'

const Ctx = createContext(null)

export function ModalProvider({ children }) {
  const [content, setContent] = useState(null)
  const open = (node) => setContent(node)
  const close = () => setContent(null)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const value = { open, close }

  return (
    <Ctx.Provider value={value}>
      {children}
      {content && (
        <div>
          <div data-testid="backdrop" onClick={close} />
          <div data-testid="modal">{content}</div>
        </div>
      )}
    </Ctx.Provider>
  )
}

export function useModal() {
  return useContext(Ctx) // { open, close }
}

export default function Demo() {
  const modal = useModal()
  return (
    <div>
      <button onClick={() => modal?.open(<div>Hi</div>)}>Open</button>
    </div>
  )
}
