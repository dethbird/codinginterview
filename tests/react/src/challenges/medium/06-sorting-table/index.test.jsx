import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SortingTable from './index.jsx'

it('sorts by column', async () => {
  const user = userEvent.setup()
  render(<SortingTable />)
  await user.click(screen.getByRole('button', { name: /Age/ }))
  await user.click(screen.getByRole('button', { name: /Age/ }))
  expect(screen.getAllByRole('row')[1]).toHaveTextContent('Bob')
})
