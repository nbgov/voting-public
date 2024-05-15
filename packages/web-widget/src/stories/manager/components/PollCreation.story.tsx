import { hydrateEthers, MemberRole } from '@smartapps-poll/common'
import type { StoryFn, Meta } from '@storybook/react'
import * as ethers from 'ethers'
import { PollCreation } from '../../../manager/components/poll/creation'
import { DebugMain } from '../../../manager/debug'
import { Widget } from '../../../shared/context'
import { debugConfig, debugIntegration } from '../../config'

hydrateEthers(ethers)

const config: Meta<typeof PollCreation> = {
  title: 'Components /Manager /Poll /Creation',
  component: PollCreation
}

export const Primary: StoryFn<typeof PollCreation> = () =>
  <Widget role={MemberRole.MANAGER} config={debugConfig} params={debugIntegration}>
    <DebugMain>
      <PollCreation onCancel={async () => { alert('cancel') }} onSuccess={async id => { alert(`Poll created ${id}`) }} />
    </DebugMain>
  </Widget>

export default config
