import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import Demo, { useCountdown } from './index.jsx'

it('counts down and stops at 0', async () => {
  vi.useFakeTimers()
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  function Harness() {
    const [v, start, stop, reset] = useCountdown({ from: 3, intervalMs: 100 })
    return (<div>
      <div data-testid="v">{v}</div>
      <button onClick={start}>start</button>
      <button onClick={stop}>stop</button>
      <button onClick={reset}>reset</button>
    </div>)
  }
  render(<Harness />)
  await user.click(screen.getByText('start'))
  vi.advanceTimersByTime(350)
  expect(screen.getByTestId('v')).toHaveTextContent('0')
  vi.advanceTimersByTime(500)
  expect(screen.getByTestId('v')).toHaveTextContent('0')
  vi.useRealTimers()
})
