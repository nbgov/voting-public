import { getWalletUtils, type VotingWalletStrategy } from '@smartapps-poll/common'
import { type CommonContext } from '../../context/types'
import { type WebWallet } from '../../service'
import { type WebStrategy } from '../types'
import { ETHERS_STARTEGY } from './consts'

export const createEthersWalletStrategy = (): VotingWalletStrategy<CommonContext> => {
  const _: { strategy?: WebStrategy } = {}

  const _strategy: VotingWalletStrategy<CommonContext> = {
    setStrategyContext: strategy => {
      _.strategy = strategy
    },

    setWallet: w => {
      _.strategy?.ctx().vocdoni.setWallet(w as WebWallet)
    },

    createWallet: async <W>() => {
      const wallet = getWalletUtils().createRandom()
      _strategy.setWallet(wallet)

      return wallet as W
    },

    get: <W>() => _.strategy?.ctx().vocdoni.wallet() as W,

    isAuthenticated: () =>
      _.strategy?.ctx().vocdoni.account.entity != null,

    export: async password =>
      await (_.strategy?.ctx().vocdoni.encrypt(password) as Promise<string>),

    import: async <W>(password: string, store: string) =>
      await (getWalletUtils().fromEncryptedJson(store, password) as Promise<W>),

    getAddress: async () => await _.strategy?.ctx().vocdoni.wallet().getAddress(),

    getType: () => ETHERS_STARTEGY
  }

  return _strategy
}
