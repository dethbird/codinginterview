import React, { useEffect, useState } from 'react'

export default function UserList() {
	const [state, setState] = useState({ status: 'idle', users: [], error: null })

	useEffect(() => {
		let ignore = false
		setState(s => ({ ...s, status: 'loading' }))
		fetch('https://jsonplaceholder.typicode.com/users')
			.then(r => {
				if (!r.ok) throw new Error('Network error')
				return r.json()
			})
			.then(data => !ignore && setState({ status: 'success', users: data, error: null }))
			.catch(err => !ignore && setState({ status: 'error', users: [], error: err.message }))
		return () => { ignore = true }
	}, [])

	if (state.status === 'loading') return <p>Loading…</p>
	if (state.status === 'error') return <p role="alert">Error: {state.error}</p>
	return (
		<ul role="list">
			{state.users.map(u => <li key={u.id}>{u.name}</li>)}
		</ul>
	)
}
