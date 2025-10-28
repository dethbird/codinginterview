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
    <div className="container is-max-desktop">
      <h1 className="title">React Interview Practice v2</h1>
      <label>
        Challenge:&nbsp;
        <div className="select">
          <select value={selected} onChange={(e) => setSelected(e.target.value)}>
            {list.map(key => (
              <option key={key} value={key}>{prettyName(key)}</option>
            ))}
          </select>
        </div>
      </label>
      <p className="pt-4">
        Edit <code>src/challenges/&lt;tier&gt;/&lt;slug&gt;/index.jsx</code> and run tests.
      </p>
      <div className="pt-4">
        {Comp ? <Comp /> : <em>Loading challenge…</em>}
      </div>
    </div>
  )
}
