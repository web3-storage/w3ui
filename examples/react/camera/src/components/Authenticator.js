import React, { useState } from 'react'
import { useAuth, AuthStatus } from '@w3ui/react-wallet'

const popFaceIDregister = async (username) => {
  const challengeBuffer = Uint8Array.from(
    'MYCHALLENGE',
    (c) => c.charCodeAt(0)
  )

  const userIdBuffer = Uint8Array.from(username, (c) => c.charCodeAt(0))

  const params = {
    challenge: challengeBuffer,
    rp: {
      name: 'w3ui',
      id: window.location.hostname
    },
    user: {
      id: userIdBuffer,
      name: username,
      displayName: username
    },
    // SUPPORT ALL PASSKEYS
    pubKeyCredParams: [
      {
        type: 'public-key',
        alg: -7
      },
      {
        type: 'public-key',
        alg: -35
      },
      {
        type: 'public-key',
        alg: -36
      },
      {
        type: 'public-key',
        alg: -257
      },
      {
        type: 'public-key',
        alg: -258
      },
      {
        type: 'public-key',
        alg: -259
      },
      {
        type: 'public-key',
        alg: -37
      },
      {
        type: 'public-key',
        alg: -38
      },
      {
        type: 'public-key',
        alg: -39
      },
      {
        type: 'public-key',
        alg: -8
      }
    ],
    timeout: 15000,
    attestation: 'direct'
  }
  return await navigator.credentials.create({
    publicKey: params
  })
}

export default function Authenticator ({ children }) {
  const { authStatus, identity, registerAndStoreIdentity, cancelRegisterAndStoreIdentity } = useAuth()
  const [email, setEmail] = useState('')

  if (authStatus === AuthStatus.SignedIn) {
    return children
  }

  if (authStatus === AuthStatus.EmailVerification) {
    return (
      <div>
        <h1>Verify your email address!</h1>
        <p>Click the link in the email we sent to {identity && identity.email} to sign in.</p>
        <form onSubmit={e => { e.preventDefault(); cancelRegisterAndStoreIdentity() }}>
          <button type='submit' className='ph3 pv2'>Cancel</button>
        </form>
      </div>
    )
  }

  const handleRegisterSubmit = async e => {
    e.preventDefault()
    try {
      ///
      await popFaceIDregister(email)
      await registerAndStoreIdentity(email)
    } catch (err) {
      console.error(err)
      throw new Error('failed to register', { cause: err })
    }
  }

  return (
    <form onSubmit={handleRegisterSubmit}>
      <div className='mb3'>
        <label htmlFor='email' className='db mb2'>Email address:</label>
        <input id='email' className='db pa2 w-100' type='email' value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <button type='submit' className='ph3 pv2'>Register</button>
    </form>
  )
}

/**
 * Wrapping a component with this HoC ensures an identity exists.
 */
export function withIdentity (Component) {
  return props => (
    <Authenticator>
      <Component {...props} />
    </Authenticator>
  )
}
