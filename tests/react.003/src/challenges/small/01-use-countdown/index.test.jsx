import { render, screen, act, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import React, { useEffect } from 'react'
import { useCountdown } from './index.jsx'

// Reusable harness for tests. By default it auto-starts so tests can
// render the same component and rely on consistent behavior.
function Harness({ from = 3, intervalMs = 100, autoStart = true }) {
	const [v, start, stop, reset ] = useCountdown({ from, intervalMs })
	useEffect(() => {
		if (autoStart) start()
	}, [autoStart, start])
	return (
		<div>
			<div data-testid="v">{v}</div>
			<button onClick={stop}>stop</button>
			<button onClick={start}>start</button>
			<button onClick={reset}>reset</button>
		</div>
	)
}

beforeEach(() => {
	vi.useFakeTimers()
});

afterEach(() => {
	vi.useRealTimers()
});

it('counts down and stops at 0 (auto-start, stable)', async () => {
	render(<Harness />)

	await act(async () => { await vi.advanceTimersByTimeAsync(350) })
	expect(screen.getByTestId('v')).toHaveTextContent('0')

	// move time, it's still 0
	await act(async () => { await vi.advanceTimersByTimeAsync(300) })
	expect(screen.getByTestId('v')).toHaveTextContent('0')
})

it('`stop()` pauses the timer, and picks up again on `start()`', async () => {
	render(<Harness />)

	// advance a bit so counter goes from 3 -> 2
	await act(async () => { await vi.advanceTimersByTimeAsync(110) })
	expect(screen.getByTestId('v')).toHaveTextContent('2')

	// stop the countdown
	act(() => { fireEvent.click(screen.getByText('stop')) })

	// advance time a lot, it should stay paused
	await act(async () => { await vi.advanceTimersByTimeAsync(500) })
	expect(screen.getByTestId('v')).toHaveTextContent('2')

	// play the countdown again so it definitely is at 0
	act(() => { fireEvent.click(screen.getByText('start')) })
	await act(async () => { await vi.advanceTimersByTimeAsync(500) })
	expect(screen.getByTestId('v')).toHaveTextContent('0')

})

it('`reset()` sets value back to `from` but does not stop timer', async () => {
	render(<Harness />)

	// advance so counter goes from 3 -> 1
	await act(async () => { await vi.advanceTimersByTimeAsync(210) })
	expect(screen.getByTestId('v')).toHaveTextContent('1')

	// back to `from` while timer is still running
	act(() => { fireEvent.click(screen.getByText('reset')) })
	expect(screen.getByTestId('v')).toHaveTextContent('3')

	// advance so counter goes from 3 -> 2
	await act(async () => { await vi.advanceTimersByTimeAsync(100) })
	expect(screen.getByTestId('v')).toHaveTextContent('2')
})
