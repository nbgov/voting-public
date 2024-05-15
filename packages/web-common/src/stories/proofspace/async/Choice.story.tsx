
import type { StoryObj, Meta } from '@storybook/react'
import * as ethers from 'ethers'
import { hydrateEthers } from '@smartapps-poll/common'
import { debugConfig } from '../../config'
import { ProofspaceAuthChoiceAsync } from '../../../component'
import { DebugContextProvider } from '../../../context/debug'

hydrateEthers(ethers)

const config: Meta<typeof ProofspaceAuthChoiceAsync> = {
  title: 'ProofSpace /Authentication Async /Choice',
  component: ProofspaceAuthChoiceAsync
}

export const Primary: StoryObj<typeof ProofspaceAuthChoiceAsync> = {
  render: () =>
    <DebugContextProvider config={debugConfig}>
      <ProofspaceAuthChoiceAsync onSuccess={async () => { alert('success') }} />
    </DebugContextProvider>
}

export default config
