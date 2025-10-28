import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FormWizard from './index.jsx'

it('navigates steps and submits payload', async () => {
  const user = userEvent.setup()
  render(<FormWizard />)
  // TODO: fill email/password -> Next -> fill name/city -> Next -> Submit
  expect(screen.getByTestId('step')).toHaveTextContent('0')
})
