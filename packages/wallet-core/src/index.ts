import * as Keypair from '@ucanto/authority'
import { Authority } from '@ucanto/authority'
import type { Delegation, SigningAuthority } from '@ucanto/interface'
import * as Access from '@web3-storage/access'
import { IdentityRegister } from '@web3-storage/access/types'
import { base64pad } from 'multiformats/bases/base64'

// Production
const accessApiUrl = new URL('https://access-api.web3.storage')
const accessDid = Authority.parse('did:key:z6MkkHafoFWxxWVNpNXocFdU6PL2RVLyTEgS1qTnD3bRP7V9')
// Staging
// const accessApiUrl = new URL('https://access-api-staging.web3.storage')
// const accessDid = Authority.parse('did:key:z6MknemWKfRSfnprfijbQ2mn67KrnV44SWSuct3WLDanX2Ji')

export interface Identity {
  email: string
  verified: boolean
  signingAuthority: SigningAuthority
}

export interface UnverifiedIdentity extends Identity {
  verified: false
}

export interface VerifiedIdentity extends Identity {
  verified: true
}

export enum AuthStatus {
  /**
   * Identity loaded.
   */
  SignedIn,
  /**
   * Not authorized.
   */
  SignedOut,
  /**
   * Email verification email has been sent.
   */
  EmailVerification
}

export interface WaitIdentityVerificationOptions {
  /**
   * An AbortSignal that can be used to cancel the registration/email validation.
   */
  signal?: AbortSignal
}

export interface Storage {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

/**
 * Create a brand new identity.
 */
export async function createIdentity ({ email }: { email: string }): Promise<UnverifiedIdentity> {
  if (email == null || email === '') {
    throw new Error('missing email address')
  }

  const signingAuthority = await Keypair.SigningAuthority.generate()

  return { email, verified: false, signingAuthority }
}

/**
 * Send verification email.
 */
export async function sendVerificationEmail (identity: UnverifiedIdentity): Promise<void> {
  if (identity.verified) {
    throw new Error('already verified')
  }
  await Access.validate({
    audience: accessDid,
    url: accessApiUrl,
    issuer: identity.signingAuthority,
    caveats: { as: `mailto:${identity.email}` }
  })
}

/**
 * Wait for the passed identity to be verified.
 */
export async function waitIdentityVerification (identity: UnverifiedIdentity, options: WaitIdentityVerificationOptions = {}): Promise<{ identity: VerifiedIdentity, proof: Delegation<[IdentityRegister]> }> {
  if (identity.verified) {
    throw new Error('already verified')
  }
  const proof = await Access.pullRegisterDelegation({
    issuer: identity.signingAuthority,
    url: accessApiUrl,
    signal: options.signal
  })

  return {
    identity: {
      email: identity.email,
      verified: true,
      signingAuthority: identity.signingAuthority
    },
    proof
  }
}

/**
 * Register a verified identity with the service.
 */
export async function registerIdentity (identity: VerifiedIdentity, proof: Delegation<[IdentityRegister]>): Promise<void> {
  if (!identity.verified) {
    throw new Error('identity must be verified')
  }
  await Access.register({
    audience: accessDid,
    url: accessApiUrl,
    issuer: identity.signingAuthority,
    proof
  })
}

/**
 * Load an identity from secure storage.
 */
export async function loadIdentity ({ email }: Pick<Identity, 'email'>, store: Storage): Promise<Identity | undefined> {
  const item = await store.getItem(`__w3ui_id.mailto:${email}`)
  if (item == null) return
  try {
    const { email, verified, signingAuthorityBytes } = JSON.parse(item)
    const signingAuthority = Keypair.SigningAuthority.decode(base64pad.decode(signingAuthorityBytes))
    return { email, verified, signingAuthority }
  } catch (err) {
    console.warn('failed to load identity', err)
  }
}

/**
 * Load the default identity from secure storage.
 */
export async function loadDefaultIdentity (store: Storage): Promise<Identity | undefined> {
  const email = await store.getItem('__w3ui_id.default.email')
  if (email == null) return
  return await loadIdentity({ email }, store)
}

/**
 * Remove the passed identity from secure storage (if exists).
 */
export async function removeIdentity (identity: Identity, store: Storage): Promise<void> {
  await store.removeItem(`__w3ui_id.mailto:${identity.email}`)
  const defaultEmail = localStorage.getItem('__w3ui_id.default.email')
  if (identity.email === defaultEmail) {
    await store.removeItem('__w3ui_id.default.email')
  }
}

/**
 * Store identity locally in secure storage and set the default.
 * TODO: CURRENTLY DOES NOT SAVE SECURELY - SAVES TO LOCALSTORAGE
 */
export async function storeIdentity (identity: Identity, store: Storage): Promise<void> {
  const { email, signingAuthority } = identity
  const signingAuthorityBytes = base64pad.encode(signingAuthority.bytes)
  await store.setItem(
    `__w3ui_id.mailto:${email}`,
    JSON.stringify({ email, signingAuthorityBytes })
  )
  await store.setItem('__w3ui_id.default.email', email)
}
