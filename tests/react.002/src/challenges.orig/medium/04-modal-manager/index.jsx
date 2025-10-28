import React, { createContext, useContext, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const Ctx = createContext(null)

export function ModalProvider({ children }) {
  // TODO implement state and open/close callbacks
  return <Ctx.Provider value={null}>{children}</Ctx.Provider>
}

export function useModal() {
  return useContext(Ctx) // TODO - shape: { open, close }
}

export function ModalRoot() {
  // TODO: read ctx and render portal with content and backdrop; close on ESC/backdrop
  return null
}

export default function Demo() {
  const modal = useModal()
  return (
    <div>
      <button onClick={() => modal?.open(<div>Hi</div>)}>Open</button>
      <ModalRoot />
    </div>
  )
}
