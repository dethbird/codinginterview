import React, { useMemo, useState } from 'react'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const errors = useMemo(() => {
    const e = {}
    if (!email.includes('@')) e.email = 'Invalid email'
    if (password.length < 8) e.password = 'Min 8 chars'
    if (confirm !== password) e.confirm = 'Passwords must match'
    return e
  }, [email, password, confirm])

  const valid = Object.keys(errors).length === 0

  const onSubmit = (ev) => {
    ev.preventDefault()
    if (!valid) return
    alert('Submitted!')
  }

  return (
    <form onSubmit={onSubmit}>
      <label>Email <input value={email} onChange={e => setEmail(e.target.value)} /></label>
      {errors.email && <div role="alert">{errors.email}</div>}
      <label>Password <input type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>
      {errors.password && <div role="alert">{errors.password}</div>}
      <label>Confirm <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
      {errors.confirm && <div role="alert">{errors.confirm}</div>}
      <button disabled={!valid}>Sign Up</button>
    </form>
  )
}
