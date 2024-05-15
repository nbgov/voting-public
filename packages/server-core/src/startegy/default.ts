import { createBasicStrategyBuilder } from '@smartapps-poll/common'
import { type Context } from '../types'
import { createEthersWalletStrategy } from './ethers/wallet'
import { createProofspaceWalletStrategy } from './proofspace/wallet'
import { type ServerStrategy } from './types'
import { createVocdoniServiceStrategy } from './vocdoni/service'

export const createDefaultStrategy = (context: Context): ServerStrategy => {
  const _strategy: ServerStrategy = createBasicStrategyBuilder(context)
    .credentials.wallet(createProofspaceWalletStrategy())
    .voting.wallet(createEthersWalletStrategy())
    .voting.service(createVocdoniServiceStrategy())
    .build()

  return _strategy
}
