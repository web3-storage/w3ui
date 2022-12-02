import React from 'react'
import logo from '../logo.png'

export function PanelPage ({ title, children }) {
  return (
    <div className='vh-100 flex flex-column justify-center items-center light-silver'>
      <Panel title={title} showLogo>
        {children}
      </Panel>
    </div>
  )
}

export function Panel ({ title, className = '', style = {}, showLogo = false, children }) {
  return (
    <div className={`ba b--dark-gray br2 pa4 bg-black-10 ${className}`} style={{ minWidth: 560, ...style }}>
      <div className='tc'>
        {showLogo ? <img src={logo} width='125' alt='logo' /> : null}
        <h1 className='f3 normal near-white mt0'>{title}</h1>
      </div>
      {children}
    </div>
  )
}
