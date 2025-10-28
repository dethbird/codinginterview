import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CheckboxGroup from './index.jsx'

it('selects all and toggles item', async () => {
  const user = userEvent.setup()
  render(<CheckboxGroup />)
  const selectAll = screen.getByLabelText(/Select All/)
  await user.click(selectAll)
  expect(screen.getAllByRole('checkbox')).toHaveLength(4) // 1 master + 3 items
  await user.click(screen.getByLabelText(/Beta/))
  expect(selectAll).not.toBeChecked()
})
