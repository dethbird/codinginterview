import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from './index.jsx'

it('closes on backdrop click', async () => {
  const user = userEvent.setup()
  const onClose = vi.fn()
  render(<Modal open onClose={onClose}><button>Inside</button></Modal>)
  await user.click(screen.getByRole('dialog'))
  expect(onClose).toHaveBeenCalled()
})
