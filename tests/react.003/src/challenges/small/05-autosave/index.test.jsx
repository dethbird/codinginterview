
import { render, screen, act, fireEvent } from '@testing-library/react'
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
    render(<AutosaveInput storageKey="k" />)

    const input = screen.getByLabelText('text')
    // simulate typing synchronously to avoid fake-timer/userEvent interaction
    await act(async () => {
        fireEvent.change(input, { target: { value: 'hi' } })
    })

    // For determinism: force a save without timers.
    input.blur()
    expect(localStorage.getItem('k')).toBe(JSON.stringify('hi'))
})

it('restores after an unmount', async () => {
    const { unmount } = render(<AutosaveInput storageKey="k" />)

    const input = screen.getByLabelText('text')
    await act(async () => {
        fireEvent.change(input, { target: { value: 'hi' } })
    })

    unmount();
    render(<AutosaveInput storageKey="k" />)
    expect(localStorage.getItem('k')).toBe(JSON.stringify('hi'))
})



it('Debounces localstorage.saveItem', async () => {

    render(<AutosaveInput storageKey="k" debounceMs={500} />)

    const input = screen.getByLabelText('text')
    await act(async () => {
        fireEvent.change(input, { target: { value: 'hi' } })
    })

    // advance timers just before debounce should fire
    await act(async () => { await vi.advanceTimersByTimeAsync(499) })
    expect(localStorage.getItem('k')).toBeNull()

    // move time forward to trigger debounce completion
    await act(async () => { await vi.advanceTimersByTimeAsync(1) })
    expect(localStorage.getItem('k')).toBe(JSON.stringify('hi'))

})
