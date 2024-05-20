
import type { StoryFn, Meta } from '@storybook/react'
import { DebugContextProvider } from '../../../context/debug'
import * as ethers from 'ethers'
import { hydrateEthers } from '@smartapps-poll/common'
import { debugConfig } from '../../config'
import { AuthorizationChoice } from '../../../component/authorization'

hydrateEthers(ethers)

const config: Meta<typeof AuthorizationChoice> = {
  title: 'ProofSpace /Authorization /Choice',
  component: AuthorizationChoice
}

export const Primary: StoryFn<typeof AuthorizationChoice> = () =>
  <DebugContextProvider config={debugConfig}>
    <AuthorizationChoice pollId={process.env.DEBUG_POLL_ID ?? ''} onBack={() => alert('back')} onSuccess={async () => { alert('success') }} />
  </DebugContextProvider>

export default config
