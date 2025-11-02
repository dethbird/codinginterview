
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

it('closes modal when Escape is pressed', async () => {
    const user = userEvent.setup()
    render(<ModalProvider><Harness /></ModalProvider>)

    await user.click(screen.getByText('open'))
    expect(screen.getByTestId('modal')).toBeInTheDocument()

    // press Escape to close
    await user.keyboard('{Escape}')
    expect(screen.queryByTestId('modal')).toBeNull()
})

it('only one modal is shown at a time (opening replaces existing)', async () => {
    const user = userEvent.setup()

    function TwoHarness() {
        const modal = useModal()
        return (
            <div>
                <button onClick={() => modal.open(<div>First</div>)}>open-first</button>
                <button onClick={() => modal.open(<div>Second</div>)}>open-second</button>
            </div>
        )
    }

    render(<ModalProvider><TwoHarness /></ModalProvider>)

    await user.click(screen.getByText('open-first'))
    expect(screen.getByTestId('modal')).toHaveTextContent('First')

    await user.click(screen.getByText('open-second'))
    // should now show Second and only one modal element
    expect(screen.getByTestId('modal')).toHaveTextContent('Second')
    expect(screen.queryAllByTestId('modal')).toHaveLength(1)
})

it('modal content can close itself via useModal()', async () => {
    const user = userEvent.setup()

    function Inner() {
        const { close } = useModal()
        return <button onClick={() => close()}>close-inside</button>
    }

    function OpenInner() {
        const modal = useModal()
        return <button onClick={() => modal.open(<Inner />)}>open-inner</button>
    }

    render(<ModalProvider><OpenInner /></ModalProvider>)

    await user.click(screen.getByText('open-inner'))
    expect(screen.getByTestId('modal')).toBeInTheDocument()

    await user.click(screen.getByText('close-inside'))
    expect(screen.queryByTestId('modal')).toBeNull()
})
