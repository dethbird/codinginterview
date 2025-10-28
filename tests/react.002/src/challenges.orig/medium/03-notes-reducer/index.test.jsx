import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Notes from './index.jsx'

it('adds, pins to top, deletes, and filters', async () => {
  const user = userEvent.setup()
  render(<Notes />)
  await user.type(screen.getByLabelText('new'), 'alpha{enter}')
  await user.type(screen.getByLabelText('new'), 'beta{enter}')
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
  const secondId = screen.getAllByRole('listitem')[1].querySelector('button[aria-label^="pin-"]').getAttribute('aria-label').split('-')[1]
  await user.click(screen.getByLabelText(`pin-${secondId}`))
  expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('beta')
  await user.clear(screen.getByLabelText('query'))
  await user.type(screen.getByLabelText('query'), 'alp')
  expect(screen.getAllByRole('listitem')).toHaveLength(1)
  expect(screen.getByRole('listitem')).toHaveTextContent('alpha')
  const firstId = screen.getByRole('listitem').querySelector('button[aria-label^="del-"]').getAttribute('aria-label').split('-')[1]
  await user.click(screen.getByLabelText(`del-${firstId}`))
  expect(screen.queryAllByRole('listitem')).toHaveLength(0)
})
