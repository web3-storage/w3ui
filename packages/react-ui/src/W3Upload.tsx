import React from 'react'
import { W3APIProvider } from './providers/W3API'
import { SimpleAuthenticator } from './SimpleAuthenticator'
import { SimpleUploader } from './SimpleUploader'
import { SimpleUploadsList } from './SimpleUploadsList'

export function W3Upload (): JSX.Element {
  return (
    <W3APIProvider>
      <SimpleAuthenticator>
        <SimpleUploader />
        <SimpleUploadsList />
      </SimpleAuthenticator>
    </W3APIProvider>
  )
}
