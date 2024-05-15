import type { StoryObj, Meta } from '@storybook/react'
import * as ethers from 'ethers'
import { hydrateEthers } from '@smartapps-poll/common'
import { debugConfig } from '../../config'
import { DebugContextProvider } from '../../../context/debug'
import { ProofspaceRegisterationAsync } from '../../../component/auth-async'

hydrateEthers(ethers)

const config: Meta<typeof ProofspaceRegisterationAsync> = {
  title: 'ProofSpace /Authentication Async /Registeration',
  component: ProofspaceRegisterationAsync
}

export const Primary: StoryObj<typeof ProofspaceRegisterationAsync> = {
  render: () =>
    <DebugContextProvider config={debugConfig}>
      <ProofspaceRegisterationAsync onCreate={async () => { alert('created') }}
        onFailure={async () => { alert('failed') }}
        onCancel={async () => { alert('cancel') }} />
    </DebugContextProvider>
}

export default config
