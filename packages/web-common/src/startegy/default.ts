import { createBasicStrategyBuilder } from '@smartapps-poll/common'
import { type CommonContext } from '../context'
import { createEthersWalletStrategy } from './ethers/wallet'
import { createProofspaceWalletStrategy } from './proofspace/wallet'
import { type WebStrategy } from './types'
import { createVocdoniServiceStrategy } from './vocdoni/service'

export const createDefaultStrategy = (context: CommonContext): WebStrategy => {
  const _strategy: WebStrategy = createBasicStrategyBuilder(context)
    .credentials.wallet(createProofspaceWalletStrategy())
    .voting.wallet(createEthersWalletStrategy())
    .voting.service(createVocdoniServiceStrategy())
    .build()

  return _strategy
}
