import { hydrateEthers } from '@smartapps-poll/common'
import type { StoryFn, Meta } from '@storybook/react'
import * as ethers from 'ethers'
import { ManagerWidget } from '../../manager'
import { debugConfig, debugIntegration } from '../config'

hydrateEthers(ethers)

const config: Meta<typeof ManagerWidget> = {
  title: 'Widget /Manager',
  component: ManagerWidget
}

export const Primary: StoryFn<typeof ManagerWidget> = () => <ManagerWidget config={debugConfig} params={debugIntegration} />

export default config
