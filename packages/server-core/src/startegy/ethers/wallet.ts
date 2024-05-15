import { getWalletUtils, type VotingWalletStrategy } from '@smartapps-poll/common'
import { type HDNodeWallet } from 'ethers'
import { type Context } from '../../types'
import { type ServerStrategy } from '../types'
import { EthersWalletImplError } from './errors'
import { ETHERS_STARTEGY } from './consts'

export const createEthersWalletStrategy = (): VotingWalletStrategy<Context> => {
  const _: {
    strategy?: ServerStrategy
    wallet?: HDNodeWallet
  } = {}

  const _strategy: VotingWalletStrategy<Context> = {
    setStrategyContext: strategy => {
      _.strategy = strategy
    },

    setWallet: w => {
      _.wallet = w as HDNodeWallet
    },

    createWallet: async <W>() => {
      const wallet = getWalletUtils().createRandom()
      _strategy.setWallet(wallet)

      return wallet as W
    },

    get: <W>() => _.wallet as W,

    isAuthenticated: () => {
      throw new EthersWalletImplError('isAuthenticated')
    },

    export: async () => {
      throw new EthersWalletImplError('export')
    },

    import: async () => {
      throw new EthersWalletImplError('import')
    },

    getAddress: async () => _.wallet?.address,

    getType: () => ETHERS_STARTEGY
  }

  return _strategy
}
