import { hydrateEthers, MemberRole } from '@smartapps-poll/common'
import type { StoryFn, Meta } from '@storybook/react'
import * as ethers from 'ethers'
import { PollEdit } from '../../../manager/components/poll/edit'
import { DebugMain } from '../../../manager/debug'
import { Widget } from '../../../shared/context'
import { debugConfig, debugIntegration } from '../../config'

hydrateEthers(ethers)

const config: Meta<typeof PollEdit> = {
  title: 'Components /Manager /Poll /Editing',
  component: PollEdit
}

export const Primary: StoryFn<typeof PollEdit> = () =>
  <Widget role={MemberRole.MANAGER} config={debugConfig} params={debugIntegration}>
    <DebugMain>
      <PollEdit id={process.env.DEBUG_POLL_ID ?? ''}
        onCancel={async () => { alert('cancel') }} onSuccess={async () => { alert('success') }} />
    </DebugMain>
  </Widget>

export default config
