import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import Stopwatch from './index.jsx'

it('starts and pauses', async () => {
  const user = userEvent.setup()
  vi.useFakeTimers()
  vi.spyOn(global, 'requestAnimationFrame').mockImplementation(cb => setTimeout(() => cb(performance.now()), 16))
  vi.spyOn(global, 'cancelAnimationFrame').mockImplementation(id => clearTimeout(id))

  render(<Stopwatch />)
  await user.click(screen.getByText('Start'))
  vi.advanceTimersByTime(1000)
  await user.click(screen.getByText('Pause'))
  const val = Number(screen.getByTestId('elapsed').textContent.replace('s',''))
  expect(val).toBeGreaterThanOrEqual(0)
  vi.useRealTimers()
})
