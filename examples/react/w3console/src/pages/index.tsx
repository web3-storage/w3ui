
import { useState } from 'react'
import { DIDKey } from '@ucanto/interface'
import { useKeyring } from '@w3ui/react-keyring'
import { NavLink } from 'react-router-dom'

import { AuthenticationEnsurer } from '../components/Authenticator'
import { DefaultLayout } from '../components/Layout'
import { SpaceEnsurer } from '../components/SpaceEnsurer'
import { SpaceSection } from '../components/SpaceSection'
import { SpaceSelector } from './SpaceSelector'
import { Web3BucketLogo } from '../brand'
import Modules from '../components/Modules'

export default function Home (): JSX.Element {
  const [share, setShare] = useState(false)
  const [{ space, spaces }, { setCurrentSpace }] = useKeyring()

  function viewSpace (did: DIDKey): void {
    setShare(false)
    void setCurrentSpace(did)
  }

  return (
    <AuthenticationEnsurer>
      <SpaceEnsurer>
        <DefaultLayout sidebar={
          <div class='flex-grow flex flex-col'>
            <SpaceSelector
              selected={space}
              setSelected={viewSpace}
              spaces={spaces}
            />
            <div className='pt-4'>
              <Modules />
            </div>
          </div>
        }>
          <SpaceSection viewSpace={viewSpace} share={share} setShare={setShare} />
        </DefaultLayout>
      </SpaceEnsurer>
    </AuthenticationEnsurer>
  )
}

