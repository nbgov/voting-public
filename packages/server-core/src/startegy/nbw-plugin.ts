import { createBasicStrategyBuilder } from '@smartapps-poll/common'
import { type Context } from '../types'
import { createEthersWalletStrategy } from './ethers/wallet'
import { createVocdoniServiceStrategy } from './vocdoni/service'
import { createNBWrapperWalletStrategy } from './newbelarus/nb-wrapper-wallet'
import { type ServerStrategy } from './types'

export const createNBWPluginStrategy = (context: Context): ServerStrategy => {
  const _strategy: ServerStrategy = createBasicStrategyBuilder(context)
    .credentials.wallet(createNBWrapperWalletStrategy())
    .voting.wallet(createEthersWalletStrategy())
    .voting.service(createVocdoniServiceStrategy())
    .build()

  return _strategy
}
