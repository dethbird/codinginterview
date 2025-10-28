import React, { useEffect, useMemo, useState } from 'react'
import { registry, prettyName } from './challengeLoader.js'

function useSelectedChallenge() {
  const url = new URL(window.location.href)
  const initial = url.searchParams.get('challenge') || 'small-01-counter'
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
    <div class="container is-max-desktop">
      <section class="section">
        <h1 class="title">React Interview Practice</h1>
        <label>
          Challenge:&nbsp;
          <div class="select">
            <select value={selected} onChange={(e) => setSelected(e.target.value)}>
              {list.map(key => (
                <option key={key} value={key}>{prettyName(key)}</option>
              ))}
            </select>
          </div>
        </label>
      <p class="mt-4">
        Open <code>src/challenges/&lt;tier&gt;/&lt;slug&gt;/index.jsx</code> to edit.
        See the challenge README for requirements.
      </p>
      </section>
      <section class="section pt-0">
        <div class="box">
          {Comp ? <Comp /> : <em>Loading challenge…</em>}
        </div>
      </section>
    </div>
  )
}
