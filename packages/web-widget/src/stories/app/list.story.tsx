import { hydrateEthers, MemberRole } from '@smartapps-poll/common'
import type { Meta, StoryFn } from '@storybook/react'
import * as ethers from 'ethers'
import { debugConfig, debugIntegration } from '../config'
import { Widget } from '../../shared/context'
import { DebugMain } from '../../manager/debug'
import { PublicPollList } from '../../app/components/poll/list'

hydrateEthers(ethers)

const config: Meta<typeof PublicPollList> = {
  title: 'Components /App /Poll /List',
  component: PublicPollList
}

export const Primary: StoryFn<typeof PublicPollList> = () =>
  <Widget role={MemberRole.MANAGER} config={debugConfig} params={debugIntegration}>
    <DebugMain>
      <PublicPollList open={async id => { alert(id) }} />
    </DebugMain>
  </Widget>

export default config
