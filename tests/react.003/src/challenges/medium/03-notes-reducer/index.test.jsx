
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Notes from './index.jsx'
import { expect } from 'vitest'

it('adds and removes notes', async () => {
    const user = userEvent.setup()
    render(<Notes />)

    // no notes
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)

    const newInput = screen.queryByLabelText('new')
    await user.type(newInput, 'note 1')
    await user.keyboard('{Enter}')

    // new note
    expect(screen.queryAllByRole('listitem')).toHaveLength(1)
    // field cleared out
    expect(newInput).toHaveValue('')

    await user.type(newInput, 'note 2')
    await user.keyboard('{Enter}')

    await user.type(newInput, 'note 3')
    await user.keyboard('{Enter}')

    expect(screen.queryAllByRole('listitem')).toHaveLength(3)

    // delete 2nd note
    await user.click(await screen.getByLabelText('del-1'))
    expect(screen.queryAllByRole('listitem')).toHaveLength(2)    
})

it('orders by pinned at top', async () => {
    const user = userEvent.setup()
    render(<Notes />)


    const newInput = screen.queryByLabelText('new')
    await user.type(newInput, 'note 1')
    await user.keyboard('{Enter}')
    await user.type(newInput, 'note 2')
    await user.keyboard('{Enter}')
    await user.type(newInput, 'note 3')
    await user.keyboard('{Enter}')

    // pin 2nd note
    await user.click(await screen.getByLabelText('pin-1'))
    // pin 3rd note
    await user.click(await screen.getByLabelText('pin-2'))

    // still 3 notes
    expect(screen.queryAllByRole('listitem')).toHaveLength(3)    

    const notes = screen.queryAllByRole('listitem');
    expect(notes[0]).toHaveTextContent('note 2')
    expect(notes[1]).toHaveTextContent('note 3')
    expect(notes[2]).toHaveTextContent('note 1')
})

it('filters by search query', async () => {
    const user = userEvent.setup()
    render(<Notes />)


    const newInput = screen.queryByLabelText('new')
    await user.type(newInput, 'note 1')
    await user.keyboard('{Enter}')
    await user.type(newInput, 'note 2')
    await user.keyboard('{Enter}')
    await user.type(newInput, 'note 3')
    await user.keyboard('{Enter}')
    await user.type(newInput, 'pizza')
    await user.keyboard('{Enter}')
    await user.type(newInput, 'pizza party')
    await user.keyboard('{Enter}')

    const queryInput = screen.queryByLabelText('query')
    
    await user.type(queryInput, 'note')
    let notes = screen.queryAllByRole('listitem');
    expect(notes).toHaveLength(3)

    await user.clear(queryInput)
    await user.type(queryInput, 'pizza')
    notes = screen.queryAllByRole('listitem');
    expect(notes).toHaveLength(2)
})
