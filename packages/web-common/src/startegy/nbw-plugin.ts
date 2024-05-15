import { createBasicStrategyBuilder } from '@smartapps-poll/common'
import { type CommonContext } from '../context'
import { type WebStrategy } from './types'
import { createEthersWalletStrategy } from './ethers/wallet'
import { createVocdoniServiceStrategy } from './vocdoni/service'
import { createNBWrapperWalletStrategy } from './newbelarus/nb-wrapper-wallet'

export const createNBWPluginStrategy = (context: CommonContext): WebStrategy => {
  const _strategy: WebStrategy = createBasicStrategyBuilder(context)
    .credentials.wallet(createNBWrapperWalletStrategy())
    .voting.wallet(createEthersWalletStrategy())
    .voting.service(createVocdoniServiceStrategy())
    .build()

  return _strategy
}
