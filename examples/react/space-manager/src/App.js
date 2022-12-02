import React, { useState, useEffect } from 'react'
import { KeyringProvider, useKeyring } from '@w3ui/react-keyring'
import { UploaderProvider, useUploader } from '@w3ui/react-uploader'
import { UploadsListProvider, useUploadsList } from '@w3ui/react-uploads-list'
import { createBrowserRouter, RouterProvider, useNavigate, useParams } from 'react-router-dom'
import * as DID from '@ipld/dag-ucan/did'
import md5 from 'blueimp-md5'
import { PanelPage, Panel } from './components/Panel'
import { NavbarPage } from './components/Navbar'

import {
  accessServicePrincipal,
  accessServiceConnection,
  uploadServicePrincipal,
  uploadServiceConnection
} from './staging-service.js'

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />
  },
  {
    path: '/space/select',
    element: <SpaceSelectPage />
  },
  {
    path: '/space/new',
    element: <NewSpacePage />
  },
  {
    path: '/space/:did',
    element: <SpacePage />
  },
  {
    path: '/upload',
    element: <UploadPage />
  }
])

function App () {
  return (
    <KeyringProvider servicePrincipal={accessServicePrincipal} connection={accessServiceConnection}>
      <UploaderProvider servicePrincipal={uploadServicePrincipal} connection={uploadServiceConnection}>
        <UploadsListProvider servicePrincipal={uploadServicePrincipal} connection={uploadServiceConnection}>
          <RouterProvider router={router} />
        </UploadsListProvider>
      </UploaderProvider>
    </KeyringProvider>
  )
}

function HomePage () {
  const [{ space }, { loadAgent }] = useKeyring()
  const navigate = useNavigate()
  let timeoutID
  useEffect(() => {
    loadAgent()
    clearTimeout(timeoutID)
    if (space) return navigate(`/space/${space.did()}`)
    // navigate to space selection if not loaded in 1 sec
    timeoutID = setTimeout(() => navigate('/space/select'), 1000)
  }, [space])
  return <PanelPage title='Loading'><div className='f2 tc'>⏳</div></PanelPage>
}

function SpaceSelectPage () {
  const navigate = useNavigate()
  const [{ agent, spaces }, { loadAgent }] = useKeyring()

  if (!agent) {
    loadAgent()
    return null
  }

  const handleNewSpaceSubmit = e => {
    e.preventDefault()
    navigate('/space/new')
  }
  const handleSpaceSelectSubmit = e => {
    e.preventDefault()
    navigate(`/space/${e.currentTarget.dataset.space}`)
  }

  return (
    <PanelPage title='Choose space:'>
      <ul className='list ph0 overflow-y-scroll' style={{ maxHeight: 330 }}>
        {spaces.filter(s => s.registered()).map((s, i) => (
          <li key={s.did()} className={`${i ? 'bt' : ''} b--dark-gray`}>
            <form data-space={s.did()} onSubmit={handleSpaceSelectSubmit}>
              <button type='submit' className='input-reset pointer bg-transparent bw0 near-white hover-bg-white-10 pa3 flex w-100'>
                <div>
                  <img src={`https://www.gravatar.com/avatar/${md5(s.did())}?d=identicon`} width='45' className='ba br2 mr3' />
                </div>
                <div className='tl'>
                  <div className='lh-copy'>{s.name()}</div>
                  <div className='lh-copy white-50 f6'>{s.did()}</div>
                </div>
              </button>
            </form>
          </li>
        ))}
      </ul>
      <form onSubmit={handleNewSpaceSubmit} className='tc ma3'>
        <button type='submit' className='input-reset pointer near-white pv3 ph4 bg-transparent b--transparent hover-bg-white-10 br2'>+ New Space</button>
      </form>
    </PanelPage>
  )
}

function NewSpacePage () {
  const navigate = useNavigate()
  const [, { createSpace, registerSpace, cancelRegisterSpace }] = useKeyring()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [named, setNamed] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <PanelPage title='Verify your email address!'>
        <p className='tc'>Click the link in the email we sent to {email}.</p>
        <form onSubmit={e => { e.preventDefault(); cancelRegisterSpace() }}>
          <div className='tc'>
            <button type='submit' className='input-reset pointer near-white pv3 ph4 bg-transparent b--transparent hover-bg-white-10 br2'>Cancel</button>
          </div>
        </form>
      </PanelPage>
    )
  }

  if (named) {
    const handleRegisterSubmit = async e => {
      e.preventDefault()
      setSubmitted(true)
      try {
        const did = await createSpace(name)
        await registerSpace(email)
        navigate(`/space/${did}`)
      } catch (err) {
        console.log(err)
        throw new Error('failed to register', { cause: err })
      } finally {
        setSubmitted(false)
      }
    }

    return (
      <PanelPage title='Verify space'>
        <form onSubmit={handleRegisterSubmit}>
          <p>Verify your email address to start using your space.</p>
          <div className='mb3'>
            <label htmlFor='email' className='db mb2'>Email:</label>
            <input id='email' className='db pa2 w-100' type='email' value={email} onChange={e => setEmail(e.target.value)} required placeholder='you@email.com' />
          </div>
          <div className='tc'>
            <button type='submit' className='input-reset pointer near-white pv3 ph4 bg-transparent b--transparent hover-bg-white-10 br2' disabled={submitted}>Verify</button>
          </div>
        </form>
      </PanelPage>
    )
  }

  return (
    <PanelPage title='New space'>
      <form onSubmit={async e => { e.preventDefault(); setNamed(true) }}>
        <div className='mb3'>
          <label htmlFor='name' className='db mb2'>Name:</label>
          <input id='name' className='db pa2 w-100 border-box' value={name} onChange={e => setName(e.target.value)} required placeholder='e.g. Pictures, Videos, Documents' />
        </div>
        <div className='tc'>
          <button type='submit' className='input-reset pointer near-white pv3 ph4 bg-transparent b--transparent hover-bg-white-10 br2' disabled={named}>Next</button>
        </div>
      </form>
    </PanelPage>
  )
}

function SpacePage () {
  const navigate = useNavigate()
  const { did } = useParams()
  const [{ space }, { setCurrentSpace }] = useKeyring()
  const [{ loading, error, data }, { next, reload }] = useUploadsList()

  useEffect(() => { reload() }, [space])

  if (!space) {
    (async () => {
      try {
        const spacePrincipal = DID.parse(String(did))
        await setCurrentSpace(spacePrincipal.did())
      } catch (err) {
        console.error(err)
        navigate('/space/select')
      }
    })()
    return <p>Space not found</p>
  }

  if (error) return <ErrorPage space={space} error={error} />

  if (loading) {
    return (
      <NavbarPage space={space}>
        <h1 className='near-white tc normal mv5'>⏳ Loading...</h1>
      </NavbarPage>
    )
  }

  const handleUploadCtaSubmit = e => {
    e.preventDefault()
    navigate('/upload')
  }

  return (
    <NavbarPage space={space}>
      {data?.length
        ? (
          <>
            <div className='overflow-auto'>
              <table className='w-100 mb3 collapse'>
                <thead className='near-white tl'>
                  <tr>
                    <th className='pa3'>Data CID</th>
                    <th className='pa3'>CAR CID</th>
                    <th className='pa3'>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(({ dataCid, carCids, uploadedAt }) => (
                    <tr key={dataCid} className='stripe-light'>
                      <td className='pa3'>{dataCid}</td>
                      <td className='pa3'>{carCids[0]}</td>
                      <td className='pa3'>{uploadedAt.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type='button' onClick={reload} className='ph3 pv2 mr3'>Refresh</button>
            <button type='button' onClick={next} className='ph3 pv2 mr3'>Next</button>
          </>
          )
        : (
          <>
            <h1 className='near-white tc normal mt5 mb4'>No uploads yet!</h1>
            <form className='tc' onSubmit={handleUploadCtaSubmit}>
              <button type='submit' className='input-reset pointer near-white pv3 ph4 bg-transparent b--transparent hover-bg-white-10 br2'>↑ Upload a file</button>
            </form>
          </>
          )}
    </NavbarPage>
  )
}

function UploadPage () {
  const [{ space }] = useKeyring()
  const [{ storedDAGShards }, uploader] = useUploader()
  const [file, setFile] = useState(null)
  const [dataCID, setDataCID] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState(null)

  if (!uploader) return null

  const handleUploadSubmit = async e => {
    e.preventDefault()
    try {
      setStatus('uploading')
      const cid = await uploader.uploadFile(file)
      setDataCID(cid.toString())
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
    return error ? <ErrorPage space={space} error={error} /> : <Done file={file} dataCid={dataCID} storedDAGShards={storedDAGShards} />
  }

  return (
    <NavbarPage space={space}>
      <Panel title='Choose a file:' className='center mv5' style={{ maxWidth: 560 }}>
        <form onSubmit={handleUploadSubmit}>
          <div className='mt4 mb3'>
            <input className='db pa2 w-100 ba br2 white-50' type='file' onChange={e => setFile(e.target.files[0])} required />
          </div>
          <div className='tc'>
            <button type='submit' className='input-reset pointer near-white pv3 ph4 bg-transparent b--transparent hover-bg-white-10 br2'>↑ Upload</button>
          </div>
        </form>
      </Panel>
    </NavbarPage>
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

const ErrorPage = ({ error, space }) => (
  <NavbarPage space={space}>
    <div>
      <h1 className='near-white'>⚠️ Error: {error.message}</h1>
      <p>Check the browser console for details.</p>
    </div>
  </NavbarPage>
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

export default App
