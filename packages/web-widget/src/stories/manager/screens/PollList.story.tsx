import { hydrateEthers, MemberRole } from '@smartapps-poll/common'
import type { StoryFn, Meta } from '@storybook/react'
import * as ethers from 'ethers'
import { DebugMain } from '../../../manager/debug'
import { PollListScreen } from '../../../manager/screens/poll/list'
import { Widget } from '../../../shared/context'
import { debugConfig, debugIntegration } from '../../config'

hydrateEthers(ethers)

const config: Meta<typeof PollListScreen> = {
  title: 'Screens /Manager /Poll /List',
  component: PollListScreen
}

export const Primary: StoryFn<typeof PollListScreen> = () =>
  <Widget role={MemberRole.MANAGER} config={debugConfig} params={debugIntegration}>
    <DebugMain>
      <PollListScreen onEdit={async id => { alert(`try ${id}`) }} onManage={async id => { alert(`try ${id}`) }} />
    </DebugMain>
  </Widget>

export default config
