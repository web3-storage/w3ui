import React, { useState, useRef, useEffect } from 'react'
import { useUploader } from '@w3ui/react-uploader'
import { withIdentity } from './components/Authenticator'
import { Camera } from 'react-camera-pro'

import './spinner.css'

function dataURLtoFile (dataurl) {
  const arr = dataurl.split(','); const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1]); let n = bstr.length; const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  const blob = new Blob([u8arr], { type: mime })
  return new File([blob], 'camera-image')
}

const popTouchIdLogin = async () => {
  const challengeBuffer = Uint8Array.from('MYCHALLENGE', (c) => c.charCodeAt(0))
  const publicKeyCredentialRequestOptions = {
    challenge: challengeBuffer,
    rpId: window.location.hostname,
    userVerification: 'preferred',
    timeout: 60000
  }

  return await navigator.credentials.get({
    publicKey: publicKeyCredentialRequestOptions
  })
}

export function ContentPage () {
  const { uploader } = useUploader()
  const [file, setFile] = useState(null)
  const [rootCid, setRootCid] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState(null)

  // camera
  const camera = useRef(null)
  const [image, setImage] = useState(null)

  useEffect(() => {
    popTouchIdLogin()
  }, [])

  if (!uploader) return null

  const takePhoto = async e => {
    e.preventDefault()
    const imgdata = camera.current.takePhoto()
    setImage(imgdata)

    try {
      // Build a DAG from the file data to obtain the root CID.
      setStatus('encoding')
      const theFile = dataURLtoFile(imgdata)
      setFile(theFile)
      const { cid, car } = await uploader.encodeFile(theFile)
      setRootCid(cid.toString())

      // Upload the DAG to the service.
      setStatus('uploading')
      await uploader.uploadCar(car)
    } catch (err) {
      console.error(err)
      setError(err)
    } finally {
      setStatus('done')
    }
  }

  if (status === 'encoding') {
    return <Encoding file={file} image={image} />
  }

  if (status === 'uploading') {
    return <Uploading file={file} image={image} cid={rootCid} />
  }

  if (status === 'done') {
    return error ? <Errored error={error} image={image} /> : <Done file={file} image={image} cid={rootCid} again={() => { setStatus('') }} />
  }

  return (
    <div>
      <div>
        <button onClick={takePhoto}>Take photo</button>
        <Camera ref={camera} />
      </div>
    </div>

  )
}

const Encoding = ({ file, image }) => (
  <div className='flex items-center'>
    <div className='spinner mr3 flex-none' />
    <img src={image} alt='Just captured' />
    <div className='flex-auto'>
      <p className='truncate'>Building DAG for {file.name}</p>
    </div>
  </div>
)

const Uploading = ({ file, image, cid }) => (
  <div className='flex items-center'>
    <div className='spinner mr3 flex-none' />
    <img src={image} alt='Just captured' />
    <div className='flex-auto'>
      <p className='truncate'>Uploading DAG for {file.name}</p>
      <p className='f6 code truncate'>{cid}</p>
    </div>
  </div>
)

const Errored = ({ error, image }) => (
  <div>
    <h1>⚠️ Error: failed to upload file: {error.message}</h1>
    <p>Check the browser console for details.</p>
    <img src={image} alt='Not saved' />
  </div>
)

const Done = ({ file, image, cid, again }) => (
  <div>
    <h1>Done!</h1>
    <img src={image} alt='Just captured' />
    <p className='f6 code truncate'>{cid}</p>
    <p><a href={`https://w3s.link/ipfs/${cid}`}>View {file.name} on IPFS Gateway.</a></p>
    <button onClick={again}>Take another photo</button>

  </div>
)

export default withIdentity(ContentPage)
