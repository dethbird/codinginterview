import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignUp from './index.jsx'

it('validates and enables submit', async () => {
  const user = userEvent.setup()
  render(<SignUp />)
  await user.type(screen.getByLabelText(/Email/), 'me@site.com')
  await user.type(screen.getByLabelText(/^Password/), 'longenough')
  await user.type(screen.getByLabelText(/^Confirm/), 'longenough')
  expect(screen.getByRole('button', { name: /Sign Up/ })).toBeEnabled()
})
