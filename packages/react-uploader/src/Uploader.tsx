import React, { useContext, useMemo, createContext, useState } from 'react'
import { Link, Version } from 'multiformats'
import { CARMetadata, UploaderContextState, UploaderContextActions } from '@w3ui/uploader-core'
import { useUploader } from './providers/Uploader'

export type UploaderComponentContextState = UploaderContextState & {
  /**
   * A string indicating the status of this component - can be 'uploading', 'done' or ''.
   */
  status?: string
  /**
   * Error thrown by upload process.
   */
  error?: Error
  /**
   * a File to be uploaded
   */
  file?: File
  /**
   * A callback that can be passed to an `onSubmit` handler to
   * upload `file` to web3.storage via the w3up API
   */
  handleUploadSubmit?: (e: Event) => Promise<void>
  /**
   * The CID of a successful upload
   */
  dataCid?: Link<unknown, number, number, Version>
  /**
   * Shards of a DAG uploaded to web3.storage
   */
  storedDAGShards?: CARMetadata[]
}

export type UploaderComponentContextActions = UploaderContextActions & {
  /**
   * Set a file to be uploaded to web3.storage. The file will be uploaded
   * when `handleUploadSubmit` is called.
   */
  setFile: React.Dispatch<React.SetStateAction<File | undefined>>
}

export type UploaderComponentContextValue = [
  state: UploaderComponentContextState,
  actions: UploaderComponentContextActions
]

const UploaderComponentContext = createContext<UploaderComponentContextValue>([
  {
    storedDAGShards: []
  },
  {
    setFile: () => { throw new Error('missing set file function') },
    uploadFile: async () => { throw new Error('missing uploader context provider') },
    uploadDirectory: async () => { throw new Error('missing uploader context provider') }
  }
])

export interface UploaderComponentProps {
  children?: JSX.Element
}

/**
 * Top level component of the headless Uploader.
 *
 * Designed to be used with Uploader.Form and Uploader.Input
 * to easily create a custom component for uploading files to
 * web3.storage.
 */
export const Uploader = ({
  children
}: UploaderComponentProps): JSX.Element => {
  const [uploaderState, uploaderActions] = useUploader()
  const [file, setFile] = useState<File>()
  const [dataCid, setDataCid] = useState<Link<unknown, number, number, Version>>()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState()

  const handleUploadSubmit = async (e: Event): Promise<void> => {
    e.preventDefault()
    if (file != null) {
      try {
        setUploading(true)
        const cid = await uploaderActions.uploadFile(file)
        setDataCid(cid)
      } catch (err: any) {
        setError(err)
      } finally {
        setUploading(true)
      }
    }
  }

  const uploaderComponentContextValue = useMemo<UploaderComponentContextValue>(() => [
    { ...uploaderState, file, dataCid, uploading, error, handleUploadSubmit },
    { ...uploaderActions, setFile }
  ], [uploaderState, file, dataCid, status, error, handleUploadSubmit, uploaderActions, setFile])

  return (
    <UploaderComponentContext.Provider value={uploaderComponentContextValue}>
      {children}
    </UploaderComponentContext.Provider>
  )
}

/**
 * Input component for the headless Uploader.
 *
 * A file `input` designed to work with `Uploader`. Any passed props will
 * be passed along to the `input` component.
 */
Uploader.Input = (props: any): JSX.Element => {
  const [, { setFile }] = useContext(UploaderComponentContext)
  return (
    <input type='file' onChange={e => setFile(e?.target?.files?.[0])} {...props} />
  )
}

/**
 * Form component for the headless Uploader.
 *
 * A `form` designed to work with `Uploader`. Any passed props will
 * be passed along to the `form` component.
 */
Uploader.Form = ({ children, ...props }: { children: React.ReactNode } & any): JSX.Element => {
  const [{ handleUploadSubmit }] = useContext(UploaderComponentContext)
  return (
    <form onSubmit={handleUploadSubmit} {...props}>
      {children}
    </form>
  )
}

/**
 * Use the scoped uploader context state from a parent `Uploader`.
 */
export function useUploaderComponent (): UploaderComponentContextValue {
  return useContext(UploaderComponentContext)
}
