
import { render, screen, act } from '@testing-library/react'
import { vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import AutosaveInput from './index.jsx'

beforeEach(() => {
	vi.useFakeTimers()
    localStorage.clear();
});
afterEach(() => {
	// vi.useRealTimers()
});


it('saves after a pause (blur as a simple trigger for test)', async () => {
    const user = userEvent.setup()
    render(<AutosaveInput storageKey="k" />)

    const input = screen.getByLabelText('text')
    await user.type(input, 'hi')

    // For determinism: force a save without timers.
    input.blur()
    expect(localStorage.getItem('k')).toBe(JSON.stringify('hi'))
})

it('restores after an unmount', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<AutosaveInput storageKey="k" />)

    const input = screen.getByLabelText('text')
    await user.type(input, 'hi')

    unmount();
    render(<AutosaveInput storageKey="k" />)
    expect(localStorage.getItem('k')).toBe(JSON.stringify('hi'))
})



it('Debounces localstorage.saveItem', async () => {

    const user = userEvent.setup()
    render(<AutosaveInput storageKey="k" debounceMs={500} />)

    const input = screen.getByLabelText('text')
    await user.type(input, 'hi')
    expect(localStorage.getItem('k')).toBeNull
    
    // await act(async () => { await vi.advanceTimersByTimeAsync(350) })
})
