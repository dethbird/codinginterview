import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Todos from './index.jsx'

it('adds, toggles, and deletes', async () => {
  const user = userEvent.setup()
  render(<Todos />)
  await user.type(screen.getByLabelText('new todo'), 'Task A')
  await user.click(screen.getByText('Add'))
  expect(screen.getByText('Task A')).toBeInTheDocument()
  await user.click(screen.getByRole('checkbox'))
  expect(screen.getByText('Task A')).toHaveStyle({ textDecoration: 'line-through' })
  await user.click(screen.getByText('Delete'))
  expect(screen.queryByText('Task A')).toBeNull()
})
