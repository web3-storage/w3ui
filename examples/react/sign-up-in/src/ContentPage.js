import React, { useEffect, useState } from 'react'
import { useAuth, AuthStatus } from '@w3ui/react-wallet'

export default function ContentPage () {
  const { authStatus, identity, loadIdentity, registerIdentity } = useAuth()
  const [email, setEmail] = useState('')

  useEffect(() => { loadIdentity() }, []) // try load current identity - once.

  if (authStatus === AuthStatus.SignedIn) {
    return (
      <div style={{ textAlign: 'center' }}>
        <h1>Welcome {identity.email}!</h1>
        <p>You are logged in!!</p>
      </div>
    )
  }

  if (authStatus === AuthStatus.EmailVerification) {
    return (
      <div style={{ textAlign: 'center' }}>
        <h1>Verify your email address!</h1>
        <p>Click the link in the email we sent to {email} to sign in.</p>
      </div>
    )
  }

  const handleRegisterSubmit = async e => {
    e.preventDefault()
    try {
      await registerIdentity(email)
    } catch (err) {
      throw new Error('failed to register', { cause: err })
    }
  }

  return (
    <form onSubmit={handleRegisterSubmit}>
      <input type='email' value={email} onChange={e => setEmail(e.target.value)} required />
      <button type='submit'>Register</button>
    </form>
  )
}
