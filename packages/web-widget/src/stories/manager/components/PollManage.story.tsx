import { hydrateEthers, MemberRole } from '@smartapps-poll/common'
import type { StoryFn, Meta } from '@storybook/react'
import * as ethers from 'ethers'
import { DebugMain } from '../../../manager/debug'
import { Widget } from '../../../shared/context'
import { debugConfig, debugIntegration } from '../../config'
import { PollManage } from '../../../manager/components/poll/manage'

hydrateEthers(ethers)

const config: Meta<typeof PollManage> = {
  title: 'Components /Manager /Poll /Management',
  component: PollManage
}

export const Primary: StoryFn<typeof PollManage> = () =>
  <Widget role={MemberRole.MANAGER} config={debugConfig} params={debugIntegration}>
    <DebugMain>
      <PollManage id={process.env.DEBUG_POLL_ID ?? ''}
        onCancel={async () => { alert('cancel') }} onSuccess={async () => { alert('success') }} />
    </DebugMain>
  </Widget>

export default config
