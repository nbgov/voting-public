
import type { StoryObj, Meta } from '@storybook/react'
import * as ethers from 'ethers'
import { hydrateEthers } from '@smartapps-poll/common'
import { debugConfig } from '../../config'
import { DebugIntegration, ProofspaceIntegratedAuthAsync } from '../../../component'
import { DebugContextProvider } from '../../../context/debug'

hydrateEthers(ethers)

const config: Meta<typeof ProofspaceIntegratedAuthAsync> = {
  title: 'Proofspace /Integration /Authentication Async',
  component: ProofspaceIntegratedAuthAsync
}

export const Primary: StoryObj<typeof ProofspaceIntegratedAuthAsync> = {
  render: () =>
    <DebugContextProvider config={debugConfig}>
      <DebugIntegration />
      <ProofspaceIntegratedAuthAsync onSuccess={async () => { alert('success') }} />
    </DebugContextProvider>
}

export default config
