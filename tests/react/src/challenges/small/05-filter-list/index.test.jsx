import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FilterList from './index.jsx'

it('filters by input', async () => {
  const user = userEvent.setup()
  render(<FilterList items={['Apple','Banana','Pear']} />)
  await user.type(screen.getByLabelText('search'), 'ap')
  expect(screen.getByText('Apple')).toBeInTheDocument()
  expect(screen.queryByText('Banana')).toBeNull()
})
