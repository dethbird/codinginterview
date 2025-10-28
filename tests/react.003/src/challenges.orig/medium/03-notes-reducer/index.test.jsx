import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Notes from './index.jsx'

it('adds, pins to top, deletes, and filters', async () => {
  const user = userEvent.setup()
  render(<Notes />)
  // Red test until reducer is implemented.
  expect(screen.queryAllByRole('listitem')).toHaveLength(0)
})
