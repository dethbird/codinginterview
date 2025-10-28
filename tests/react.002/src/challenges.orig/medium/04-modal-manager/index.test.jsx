import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModalProvider, ModalRoot, useModal } from './index.jsx'

function Harness() {
  const modal = useModal()
  return (
    <div>
      <button onClick={() => modal.open(<div>Dialog</div>)}>open</button>
      <ModalRoot />
    </div>
  )
}

it('opens and closes modal', async () => {
  const user = userEvent.setup()
  render(<ModalProvider><Harness /></ModalProvider>)
  await user.click(screen.getByText('open'))
  expect(screen.getByText('Dialog')).toBeInTheDocument()
  await user.click(screen.getByTestId('backdrop'))
  expect(screen.queryByText('Dialog')).toBeNull()
})
