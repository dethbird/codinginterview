import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, expect } from 'vitest'
import SearchInput from './index.jsx'

it('debounces calls', async () => {
  const user = userEvent.setup()
  vi.useFakeTimers()
  const spy = vi.fn()
  render(<SearchInput delay={500} onSearch={spy} />)
  const input = screen.getByLabelText('search')
  await user.type(input, 'abc')
  expect(spy).not.toHaveBeenCalled()
  vi.advanceTimersByTime(500)
  expect(spy).toHaveBeenCalledWith('abc')
  vi.useRealTimers()
})
