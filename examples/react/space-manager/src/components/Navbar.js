import React from 'react'
import { useNavigate } from 'react-router-dom'
import md5 from 'blueimp-md5'
import logo from '../logo.png'

export function Navbar ({ space }) {
  const navigate = useNavigate()

  const handleSwitchSpaceSubmit = e => {
    e.preventDefault()
    navigate('/space/select')
  }

  return (
    <header className='bg-white-10 flex items-center pv2 ph3'>
      <div className='flex-auto'>
        <img src={logo} width='125' alt='logo' />
      </div>
      <div className='flex-auto'>
        {space
          ? (
            <p className='f4 near-white tc mv0'>
              <img src={`https://www.gravatar.com/avatar/${md5(space.did())}?d=identicon`} width='16' className='ba br2 mr2 v-mid' />
              <span className='v-mid'>{space.name()}</span><br />
              <span className='white-50 f7'>{space.did()}</span>
            </p>
            )
          : null}
      </div>
      <div className='flex-auto tr'>
        <form onSubmit={handleSwitchSpaceSubmit}>
          <button type='submit' className='input-reset pointer near-white pv3 ph4 bg-transparent b--transparent hover-bg-white-10 br2'>↩ Switch</button>
        </form>
      </div>
    </header>
  )
}

export function NavbarPage ({ space, children }) {
  return (
    <div>
      <Navbar space={space} />
      <div className='w-90 mw9 center'>
        {children}
      </div>
    </div>
  )
}
