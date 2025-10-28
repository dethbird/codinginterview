import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchTable from './index.jsx'

it('filters and sorts rows', async () => {
  const user = userEvent.setup()
  render(<SearchTable />)
  await user.type(screen.getByLabelText('search'), 'bo')
  expect(screen.getAllByRole('row')).toHaveLength(2)
  await user.clear(screen.getByLabelText('search'))
  await user.click(screen.getByRole('button', { name: /Age/ }))
  await user.click(screen.getByRole('button', { name: /Age/ }))
  expect(screen.getAllByRole('row')[1]).toHaveTextContent('Bob')
})
