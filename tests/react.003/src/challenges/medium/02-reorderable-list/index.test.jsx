
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReorderableList from './index.jsx'
import { expect, vi } from 'vitest'

it('moves items up and down', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn();
    render(<ReorderableList initial={['A', 'B', 'C']}  onChange={onChange} />)
    
    await user.click(screen.getByLabelText('down-A'))
    expect(screen.getAllByRole('listitem')[1]).toHaveTextContent('A')
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(['B', 'A', 'C']);
    
    await user.click(screen.getByLabelText('up-C'))
    expect(screen.getAllByRole('listitem')[1]).toHaveTextContent('C')
    expect(onChange).toHaveBeenCalledTimes(2);
})
