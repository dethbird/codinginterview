import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import Pagination from './index.jsx'

function Harness() {
  const [page, setPage] = useState(1)
  return (<>
    <Pagination total={25} perPage={10} page={page} onChange={setPage} />
    <div data-testid="page">{page}</div>
  </>)
}

it('navigates pages', async () => {
  const user = userEvent.setup()
  render(<Harness />)
  await user.click(screen.getByText('2'))
  expect(screen.getByTestId('page')).toHaveTextContent('2')
  await user.click(screen.getByText('Next'))
  expect(screen.getByTestId('page')).toHaveTextContent('3')
  expect(screen.getByText('Next')).toBeDisabled()
})
