import React, { useEffect, useMemo, useState } from 'react'
import { registry, prettyName } from './challengeLoader.js'

function useSelectedChallenge() {
  const url = new URL(window.location.href)
  const initial = url.searchParams.get('challenge') || Object.keys(registry)[0]
  const [selected, setSelected] = useState(initial)
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('challenge', selected)
    window.history.replaceState({}, '', url.toString())
  }, [selected])
  return [selected, setSelected]
}

export default function App() {
  const [selected, setSelected] = useSelectedChallenge()
  const [Comp, setComp] = useState(null)
  const list = useMemo(() => Object.keys(registry).sort(), [])

  useEffect(() => {
    (async () => {
      setComp(null)
      const loader = registry[selected]
      if (loader) {
        const mod = await loader()
        setComp(() => mod.default)
      }
    })()
  }, [selected])

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 20, lineHeight: 1.45 }}>
      <h1>React Interview Practice v2</h1>
      <label>
        Challenge:&nbsp;
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {list.map(key => (
            <option key={key} value={key}>{prettyName(key)}</option>
          ))}
        </select>
      </label>
      <p style={{ opacity: 0.7, marginTop: 6 }}>
        Edit <code>src/challenges/&lt;tier&gt;/&lt;slug&gt;/index.jsx</code> and run tests.
      </p>
      <div style={{ borderTop: '1px solid #eee', marginTop: 16, paddingTop: 16 }}>
        {Comp ? <Comp /> : <em>Loading challenge…</em>}
      </div>
    </div>
  )
}
