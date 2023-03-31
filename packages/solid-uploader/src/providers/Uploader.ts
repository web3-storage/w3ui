import type {
  CARMetadata,
  ProgressStatus,
  ServiceConfig,
  UploaderContextState,
  UploaderContextActions,
} from '@w3ui/uploader-core'

import {
  createContext,
  useContext,
  createComponent,
  ParentComponent
} from 'solid-js'
import { createStore } from 'solid-js/store'
import { uploadFile, uploadDirectory } from '@w3ui/uploader-core'
import { useKeyring } from '@w3ui/solid-keyring'
import { add as storeAdd } from '@web3-storage/capabilities/store'
import { add as uploadAdd } from '@web3-storage/capabilities/upload'

export type UploaderContextValue = [
  state: UploaderContextState,
  actions: UploaderContextActions
]

const UploaderContext = createContext<UploaderContextValue>([
  { storedDAGShards: [] },
  {
    uploadFile: async () => {
      throw new Error('missing uploader context provider')
    },
    uploadDirectory: async () => {
      throw new Error('missing uploader context provider')
    }
  }
])

export interface UploaderProviderProps extends ServiceConfig {}

/**
 * Provider for actions and state to facilitate uploads to the service.
 */
export const UploaderProvider: ParentComponent<UploaderProviderProps> = (
  props
) => {
  const [keyringState, keyringActions] = useKeyring()
  const [state, setState] = createStore<UploaderContextState>({
    storedDAGShards: [],
    progressStatus: undefined,
  })

  const actions: UploaderContextActions = {
    async uploadFile (file: Blob) {
      if (keyringState.space == null) throw new Error('missing space')
      if (keyringState.agent == null) throw new Error('missing agent')

      const storedShards: CARMetadata[] = []
      setState('storedDAGShards', storedShards)

      const conf = {
        issuer: keyringState.agent,
        with: keyringState.space.did(),
        audience: props.servicePrincipal,
        proofs: await keyringActions.getProofs([
          { can: storeAdd.can, with: keyringState.space.did() },
          { can: uploadAdd.can, with: keyringState.space.did() }
        ]),
      }

      const result = await uploadFile(conf, file, {
        onShardStored: (meta) => {
          storedShards.push(meta)
          setState('storedDAGShards', [...storedShards])
        },
        onUploadProgress: (status: ProgressStatus) => {
          setState('progressStatus', status)
        },
        connection: props.connection
      })
      setState('progressStatus', undefined)
      return result
    },
    async uploadDirectory (files: File[]) {
      if (keyringState.space == null) throw new Error('missing space')
      if (keyringState.agent == null) throw new Error('missing agent')

      const storedShards: CARMetadata[] = []
      setState('storedDAGShards', storedShards)

      const conf = {
        issuer: keyringState.agent,
        with: keyringState.space.did(),
        audience: props.servicePrincipal,
        proofs: await keyringActions.getProofs([
          { can: storeAdd.can, with: keyringState.space.did() },
          { can: uploadAdd.can, with: keyringState.space.did() }
        ]),
      }

      const result = await uploadDirectory(conf, files, {
        onShardStored: (meta) => {
          storedShards.push(meta)
          setState('storedDAGShards', [...storedShards])
        },
        onUploadProgress: (status: ProgressStatus) => {
          setState('progressStatus', status)
        },
        connection: props.connection
      })
      setState('progressStatus', undefined)
      return result
    }
  }

  return createComponent(UploaderContext.Provider, {
    value: [state, actions],
    get children () {
      return props.children
    }
  })
}

/**
 * Use the scoped uploader context state from a parent `UploaderProvider`.
 */
export function useUploader (): UploaderContextValue {
  return useContext(UploaderContext)
}
