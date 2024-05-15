import { hydrateEthers, MemberRole } from '@smartapps-poll/common'
import type { StoryFn, Meta } from '@storybook/react'
import * as ethers from 'ethers'
import { PollView } from '../shared'
import { debugConfig, debugIntegration } from './config'
import { Widget } from '../shared/context'
import { DebugMain } from '../manager/debug'

hydrateEthers(ethers)

const config: Meta<typeof PollView> = {
  title: 'Screens /Shared /Poll /View',
  component: PollView
}

export const Primary: StoryFn<typeof PollView> = () =>
  <Widget role={MemberRole.MANAGER} config={debugConfig} params={debugIntegration}>
    <DebugMain>
      <PollView id={process.env.DEBUG_POLL_ID ?? ''} />
    </DebugMain>
  </Widget>

export default config
