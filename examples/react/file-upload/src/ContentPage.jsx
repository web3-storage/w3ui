import React, { useState } from 'react'
import { useUploader } from '@w3ui/react-uploader'
import { withIdentity } from './components/Authenticator'

export function ContentPage () {
  const [{ storedDAGShards }, uploader] = useUploader()
  const [file, setFile] = useState(null)
  const [dataCid, setDataCid] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState(null)

  if (!uploader) return null

  const handleUploadSubmit = async e => {
    e.preventDefault()
    try {
      setStatus('uploading')
      const cid = await uploader.uploadFile(file)
      setDataCid(cid)
    } catch (err) {
      console.error(err)
      setError(err)
    } finally {
      setStatus('done')
    }
  }

  if (status === 'uploading') {
    return <Uploading file={file} storedDAGShards={storedDAGShards} />
  }

  if (status === 'done') {
    return error ? <Errored error={error} /> : <Done file={file} dataCid={dataCid} storedDAGShards={storedDAGShards} />
  }

  return (
    <div className="w3ui-uploader-wrapper">
      <form onSubmit={handleUploadSubmit}>
        <div className='w3ui-uploader'>
          <label htmlFor='file' className='w3ui-uploader__label'>File:</label>
          <input id='file' className='w3ui-uploader__input' type='file' onChange={e => setFile(e.target.files[0])} required />
        </div>
        <button type='submit' className='w3ui-button'>Upload</button>
      </form>
    </div>
  )
}

const Uploading = ({ file, storedDAGShards }) => (
  <div className='flex items-center'>
    <div className='spinner mr3 flex-none' />
    <div className='flex-auto'>
      <p className='truncate'>Uploading DAG for {file.name}</p>
      {storedDAGShards.map(({ cid, size }) => (
        <p key={cid.toString()} className='f7 truncate'>
          {cid.toString()} ({size} bytes)
        </p>
      ))}
    </div>
  </div>
)

const Errored = ({ error }) => (
  <div>
    <h1 className='near-white'>⚠️ Error: failed to upload file: {error.message}</h1>
    <p>Check the browser console for details.</p>
  </div>
)

const Done = ({ file, dataCid, storedDAGShards }) => (
  <div>
    <h1 className='near-white'>Done!</h1>
    <p className='f6 code truncate'>{dataCid.toString()}</p>
    <p><a href={`https://w3s.link/ipfs/${dataCid}`} className='blue'>View {file.name} on IPFS Gateway.</a></p>
    <p className='near-white'>Chunks ({storedDAGShards.length}):</p>
    {storedDAGShards.map(({ cid, size }) => (
      <p key={cid.toString()} className='f7 truncate'>
        {cid.toString()} ({size} bytes)
      </p>
    ))}
  </div>
)

export default withIdentity(ContentPage)
