import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThemeToggle from './index.jsx'

beforeEach(() => {
  localStorage.clear();
});

it('toggles theme and sets attribute as data attribute on documentElement: data-theme="dark|light"', async () => {
  const user = userEvent.setup()
  render(<ThemeToggle />)

  const btn = screen.getByRole('button')
  expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  
  await user.click(btn)
  expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
})

it ('Persist in localStorage `theme`', async () => {
  expect(localStorage.getItem('theme')).toBeNull();

  const user = userEvent.setup()
  const { unmount } = render(<ThemeToggle />)
  const btn = screen.getByRole('button')

  // localStorage should persist the initial state if not persisted already
  expect(localStorage.getItem('theme')).toBe('light');

  // onSwitch, localStorage should the new value
  await user.click(btn)
  expect(localStorage.getItem('theme')).toBe('dark');

  // on page reload, localStorage should have the same value as before unmount
  unmount();
  render(<ThemeToggle />)
  expect(localStorage.getItem('theme')).toBe('dark');
  
})