import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TextareaWithCount from './index.jsx'

it('disables submit when over max', async () => {
  const user = userEvent.setup()
  render(<TextareaWithCount max={5} />)
  const textarea = screen.getByLabelText('message')
  await user.type(textarea, 'abcdef')
  expect(screen.getByText(/6 /)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
})
