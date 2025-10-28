import React, { useEffect, useRef, useState } from 'react'

export default function UseCountdownDemo() {
	const [log, setLog] = useState([])
	// TODO: use your hook below once implemented
	// const value = 3
	// const start = () => setLog(l => [...l, 'start']) // append to log
	// const stop = () => setLog(l => [...l, 'stop']) // append to log
	// const reset = () => setLog(l => [...l, 'reset']) // append to log
	const [value, start, stop, reset] = useCountdown({ from: 10, intervalMs: 1000,
		onDone: () => setLog(l => [...l, 'done'])
	})

	return (
		<div>
			<div data-testid="value">{value}</div>
			<button className="button" onClick={start}>Start</button>
			<button className="button" onClick={stop}>Stop</button>
			<button className="button" onClick={reset}>Reset</button>
			<pre data-testid="log">{JSON.stringify(log)}</pre>
		</div>
	)
}

// TODO: export your hook here
export function useCountdown({ from, intervalMs = 1000, onDone }) {

	const [value, setValue] = useState(from);
	const timerRef = useRef(null);

	const start = () => {
		console.log('START');
		if (timerRef.current !== null) return; // already running
		timerRef.current = setInterval(() => {
			setValue(v => {
				if (v > 0) {
					return v - 1;
				} else {
					clearInterval(timerRef.current);
					timerRef.current = null;
					if (onDone) onDone();
					return 0;
				}
			})}, intervalMs)
	};


	const stop = () => {
		console.log('STOP');
		clearInterval(timerRef.current);
		timerRef.current = null;
	}
	const reset = () => {
		console.log('RESET');
		clearInterval(timerRef.current);
		timerRef.current = null;
		setValue(from);
	}
	return [
		value,
		start,
		stop,
		reset
	];
}
