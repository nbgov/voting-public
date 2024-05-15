
import type { StoryFn, Meta } from '@storybook/react'
import { DebugContextProvider } from '../../../context/debug'
import * as ethers from 'ethers'
import { hydrateEthers } from '@smartapps-poll/common'
import { DebugIntegration } from '../../../component/debug/integration'
import { debugConfig } from '../../config'
import { ProofspaceIntegratedAuthorization } from '../../../component/authorization'

hydrateEthers(ethers)

const config: Meta<typeof ProofspaceIntegratedAuthorization> = {
  title: 'Proofspace /Integration /Authorization',
  component: ProofspaceIntegratedAuthorization
}

export const Primary: StoryFn<typeof ProofspaceIntegratedAuthorization> = () =>
  <DebugContextProvider config={debugConfig}>
    <DebugIntegration />
    <ProofspaceIntegratedAuthorization pollId={process.env.DEBUG_POLL_ID ?? ''} onBack={async () => { alert('on back') }} onSuccess={async () => { alert('success') }} />
  </DebugContextProvider>

export default config
