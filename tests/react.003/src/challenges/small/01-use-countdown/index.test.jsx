import { render, screen, act } from '@testing-library/react'
import { vi } from 'vitest'
import React, { useEffect } from 'react'
import { useCountdown } from './index.jsx'

it('counts down and stops at 0 (stable harness)', async () => {
  vi.useFakeTimers()

  function Harness() {
    const [v, start] = useCountdown({ from: 3, intervalMs: 100 })
    useEffect(() => { start() }, []) // start once on mount
    return <div data-testid="v">{v}</div>
  }

  render(<Harness />)

  await act(async () => { await vi.advanceTimersByTimeAsync(350) })
  expect(screen.getByTestId('v')).toHaveTextContent('0')

  await act(async () => { await vi.advanceTimersByTimeAsync(500) })
  expect(screen.getByTestId('v')).toHaveTextContent('0')

  vi.useRealTimers()
})
