
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReorderableList from './index.jsx'

it('moves items up and down', async () => {
    const user = userEvent.setup()
    render(<ReorderableList initial={['A', 'B', 'C']} />)
    console.log(screen.getByLabelText('down-A'));
    
    await user.click(screen.getByLabelText('down-A'))
    expect(screen.getAllByRole('listitem')[1]).toHaveTextContent('A')
    
    await user.click(screen.getByLabelText('up-C'))
    expect(screen.getAllByRole('listitem')[1]).toHaveTextContent('C')
})
