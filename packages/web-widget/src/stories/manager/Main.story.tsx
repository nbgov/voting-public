import { hydrateEthers, MemberRole } from '@smartapps-poll/common'
import type { StoryFn, Meta } from '@storybook/react'
import * as ethers from 'ethers'
import { DebugMain } from '../../manager/debug'
import { Main } from '../../manager/main'
import { Widget } from '../../shared/context'
import { debugConfig, debugIntegration } from '../config'

hydrateEthers(ethers)

const config: Meta<typeof Main> = {
  title: 'Widget /Manager /Main',
  component: Main
}

export const Primary: StoryFn<typeof Main> = () =>
  <Widget role={MemberRole.MANAGER} config={debugConfig} params={debugIntegration}>
    <DebugMain />
  </Widget>

export default config
