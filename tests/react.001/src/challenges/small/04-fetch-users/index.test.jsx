import { render, screen, waitFor } from '@testing-library/react'
import UserList from './index.jsx'

beforeEach(() => {
  global.fetch = vi.fn()
})
afterEach(() => {
  vi.restoreAllMocks()
})

it('shows users after loading', async () => {
  fetch.mockResolvedValueOnce({ ok: true, json: async () => [{ id: 1, name: 'Leanne' }] })
  render(<UserList />)
  expect(screen.getByText(/Loading/)).toBeInTheDocument()
  await waitFor(() => expect(screen.getByText('Leanne')).toBeInTheDocument())
})

it('handles error', async () => {
  fetch.mockResolvedValueOnce({ ok: false })
  render(<UserList />)
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Error/))
})
