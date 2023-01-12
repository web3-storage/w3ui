import React from 'react'
import { UploadsList } from '@w3ui/react-uploads-list'

export const SimpleUploadsList = (): JSX.Element => {
  return (
    <UploadsList>
      {(props) => (
        <div className='w3-uploads-list'>
          <nav>
            <UploadsList.NextButton className='next'>
              Next
            </UploadsList.NextButton>
            <UploadsList.ReloadButton className='reload'>
              Reload
            </UploadsList.ReloadButton>
          </nav>
          <table>
            <thead>
              <tr>
                <th>Root CID</th>
              </tr>
            </thead>
            <tbody>
              {props.uploadsList?.[0].data?.map(({ root }) => (
                <tr key={root.toString()}>
                  <td>{root.toString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </UploadsList>
  )
}
