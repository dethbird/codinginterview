import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FormWizard from './index.jsx'

it('navigates steps and submits payload', async () => {
  const user = userEvent.setup()
  render(<FormWizard />)
  // Red test: implement the wizard to make this meaningful.
  expect(screen.getByTestId('step')).toHaveTextContent('0')
})
