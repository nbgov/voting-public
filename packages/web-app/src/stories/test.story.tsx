import { hydrateEthers } from '@smartapps-poll/common'
import type { StoryFn, Meta } from '@storybook/react'
import * as ethers from 'ethers'
import type { FunctionComponent } from 'react'

hydrateEthers(ethers)

const TestComp: FunctionComponent = () => {
  return <>Hello world!</>
}

const config: Meta<typeof TestComp> = {
  title: 'Test',
  component: TestComp
}

export const Primary: StoryFn<typeof TestComp> = () => <TestComp />

export default config
