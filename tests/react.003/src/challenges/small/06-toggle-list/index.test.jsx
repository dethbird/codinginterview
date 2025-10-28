
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ToggleList from './index.jsx'

it('select all, reflect indeterminate, and update summary', async () => {
  const user = userEvent.setup()
  render(<ToggleList items={['A','B','C']} />)
  const master = screen.getByLabelText(/Select All/)
  await user.click(master) // select all
  expect(screen.getByTestId('summary')).toHaveTextContent('3 of 3 selected')
  await user.click(screen.getByLabelText('B')) // deselect one -> indeterminate
  expect(master).not.toBeChecked()
})
