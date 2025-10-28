import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModalProvider, useModal } from './index.jsx'

function Harness() {
  const modal = useModal()
  return (
    <div>
      <button onClick={() => modal.open(<div>Dialog</div>)}>open</button>
    </div>
  )
}

it('opens and closes modal deterministically', async () => {
  const user = userEvent.setup()
  render(<ModalProvider><Harness /></ModalProvider>)
  await user.click(screen.getByText('open'))
  expect(screen.getByTestId('modal')).toHaveTextContent('Dialog')
  await user.click(screen.getByTestId('backdrop'))
  expect(screen.queryByTestId('modal')).toBeNull()
})
