import React from 'react'
import { Authenticator, useAuthenticator } from '@w3ui/react-keyring'

export function AuthenticationForm (): JSX.Element {
  const [{ submitted }] = useAuthenticator()

  return (
    <Authenticator.Form className='w3ui-simple-authenticator-form'>
      <div className='email-field'>
        <label htmlFor='w3ui-simple-authenticator-email'>Email address:</label>
        <Authenticator.EmailInput id='w3ui-simple-authenticator-email' required />
      </div>
      <button className='register' type='submit' disabled={submitted}>Register</button>
    </Authenticator.Form>
  )
}

export function AuthenticationSubmitted (): JSX.Element {
  const [{ email }] = useAuthenticator()

  return (
    <div className='w3ui-simple-authenticator-verify-email'>
      <h1 className='message'>Verify your email address!</h1>
      <p className='detail'>Click the link in the email we sent to {email} to sign in.</p>
      <Authenticator.CancelButton className='cancel'>
        Cancel
      </Authenticator.CancelButton>
    </div>
  )
}

export function AuthenticationEnsurer ({ children }: { children: JSX.Element | JSX.Element[] }): JSX.Element {
  const [{ space, submitted }] = useAuthenticator()
  const registered = Boolean(space?.registered())
  if (registered) {
    return <>{children}</>
  } else if (submitted) {
    return <AuthenticationSubmitted />
  } else {
    return <AuthenticationForm />
  }
}

export function SimpleAuthenticator ({ children }: { children: JSX.Element | JSX.Element[] }): JSX.Element {
  return (
    <Authenticator>
      <AuthenticationEnsurer>
        {children}
      </AuthenticationEnsurer>
    </Authenticator>
  )
}

/**
 * Wrapping a component with this HoC ensures an identity exists.
 */
export function withIdentity<C extends React.JSXElementConstructor<P>, P> (Component: C) {
  return (props: any) => (
    <SimpleAuthenticator>
      <Component {...props} />
    </SimpleAuthenticator>
  )
}
