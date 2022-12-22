import React, { useEffect } from 'react'
import { KeyringProvider, useKeyring } from '@w3ui/react-keyring'
import { UploadsListProvider } from '@w3ui/react-uploads-list'
import ContentPage from './ContentPage'
import logo from './logo.png'

function App () {
  return (
    <KeyringProvider>
      <UploadsListProvider>
        <div className='vh-100 flex flex-column justify-center items-center sans-serif light-silver'>
          <header>
            <img src={logo} width='250' alt='logo' />
          </header>
          <ContentPage />
        </div>
      </UploadsListProvider>
    </KeyringProvider>
  )
}

export default App
