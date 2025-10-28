import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import AutosaveInput from './index.jsx'

it('debounces save to localStorage', async () => {
  vi.useFakeTimers()
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  localStorage.clear()
  render(<AutosaveInput storageKey="k" />)

  await user.type(screen.getByLabelText('text'), 'hi')
  expect(localStorage.getItem('k')).toBeNull()
  vi.advanceTimersByTime(500)
  expect(localStorage.getItem('k')).toBe(JSON.stringify('hi'))
  vi.useRealTimers()
})
