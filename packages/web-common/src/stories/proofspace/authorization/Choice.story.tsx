
import type { StoryFn, Meta } from '@storybook/react'
import { DebugContextProvider } from '../../../context/debug'
import * as ethers from 'ethers'
import { hydrateEthers } from '@smartapps-poll/common'
import { debugConfig } from '../../config'
import { ProofspaceAuthorizationChoice } from '../../../component/authorization'

hydrateEthers(ethers)

const config: Meta<typeof ProofspaceAuthorizationChoice> = {
  title: 'ProofSpace /Authorization /Choice',
  component: ProofspaceAuthorizationChoice
}

export const Primary: StoryFn<typeof ProofspaceAuthorizationChoice> = () =>
  <DebugContextProvider config={debugConfig}>
    <ProofspaceAuthorizationChoice pollId={process.env.DEBUG_POLL_ID ?? ''} onBack={() => alert('back')} onSuccess={async () => { alert('success') }} />
  </DebugContextProvider>

export default config
