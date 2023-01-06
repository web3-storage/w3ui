import React, { useEffect } from 'react'
import { KeyringProvider, useKeyring } from '@w3ui/react-keyring'
import { UploaderProvider } from '@w3ui/react-uploader'
import ContentPage from './ContentPage'
import logo from './logo.png'

function App () {
  return (
    <KeyringProvider>
      <UploaderProvider>
        <AgentLoader>
          <div className='w3ui-app'>
            <header>
              <img src={logo} width='250' alt='logo' />
            </header>
            <div>
              <ContentPage />
            </div>
          </div>
        </AgentLoader>
      </UploaderProvider>
    </KeyringProvider>
  )
}

function AgentLoader ({ children }) {
  const [, { loadAgent }] = useKeyring()
  // eslint-disable-next-line
  useEffect(() => { loadAgent() }, []) // load agent - once.
  return children
}

export default App
