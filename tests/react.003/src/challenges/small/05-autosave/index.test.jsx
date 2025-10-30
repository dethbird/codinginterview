
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
    const user = userEvent.setup({ delay: 0 })
    render(<AutosaveInput storageKey="k" />)

    const input = screen.getByLabelText('text')
    // use real timers for userEvent typing to avoid fake-timer/userEvent deadlock
    vi.useRealTimers()
    await user.type(input, 'hi')
    // restore fake timers for the rest of the test environment
    vi.useFakeTimers()

    // For determinism: force a save without timers.
    input.blur()
    expect(localStorage.getItem('k')).toBe(JSON.stringify('hi'))
})

it('restores after an unmount', async () => {
    const user = userEvent.setup({ delay: 0 })
    const { unmount } = render(<AutosaveInput storageKey="k" />)

    const input = screen.getByLabelText('text')
    vi.useRealTimers()
    await user.type(input, 'hi')
    vi.useFakeTimers()

    unmount();
    render(<AutosaveInput storageKey="k" />)
    expect(localStorage.getItem('k')).toBe(JSON.stringify('hi'))
})



it('Debounces localstorage.saveItem', async () => {
    const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTimeAsync(ms), delay: 0 })
    render(<AutosaveInput storageKey="k" debounceMs={500} />)

    const input = screen.getByLabelText('text')
    await user.type(input, 'hi')

    // advance timers just before debounce should fire
    await act(async () => { await vi.advanceTimersByTimeAsync(499) })
    expect(localStorage.getItem('k')).toBeNull()

    // move time forward to trigger debounce completion
    await act(async () => { await vi.advanceTimersByTimeAsync(1) })
    expect(localStorage.getItem('k')).toBe(JSON.stringify('hi'))

})
