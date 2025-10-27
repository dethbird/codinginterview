import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThemeToggle from './index.jsx'

it('toggles theme and sets attribute', async () => {
  const user = userEvent.setup()
  render(<ThemeToggle />)
  const btn = screen.getByRole('button')
  expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  await user.click(btn)
  expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
})
