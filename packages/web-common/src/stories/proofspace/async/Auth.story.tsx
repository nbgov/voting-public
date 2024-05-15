import { hydrateEthers } from '@smartapps-poll/common'
import type { StoryObj, Meta } from '@storybook/react'
import * as ethers from 'ethers'
import { debugConfig } from '../../config'
import { ProofspaceAuthenticationAsync } from '../../../component/auth-async/auth'
import { DebugContextProvider } from '../../../context/debug'

hydrateEthers(ethers)

const config: Meta<typeof ProofspaceAuthenticationAsync> = {
  title: 'ProofSpace /Authentication Async /Auth',
  component: ProofspaceAuthenticationAsync
}

export const Primary: StoryObj<typeof ProofspaceAuthenticationAsync> = {
  render: () =>
    <DebugContextProvider config={debugConfig}>
      <ProofspaceAuthenticationAsync onSuccess={async () => { alert('success') }}
        onFailure={async () => { alert('failure') }} />
    </DebugContextProvider>
}

export default config
