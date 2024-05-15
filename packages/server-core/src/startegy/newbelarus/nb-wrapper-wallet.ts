import { type CredentialsWalletStrategy, NEWBELARUS_STRATEGY, dockNBPrefedinedActions } from '@smartapps-poll/common'
import { type Context } from '../../types'
import { type ServerStrategy } from '../types'
import { NewBelarusCredsImplError } from './errors'

export const createNBWrapperWalletStrategy = (): CredentialsWalletStrategy<Context> => {
  let strategy: ServerStrategy
  const _strategy: CredentialsWalletStrategy<Context> = {
    setStrategyContext: _strategy => { strategy = _strategy },

    isAuthenticated: () => {
      throw new NewBelarusCredsImplError('isAuthenticated')
    },

    getRequiredProofList: async _ => {
      if (strategy == null) {
        throw new NewBelarusCredsImplError('malformed')
      }
      return dockNBPrefedinedActions
    },

    castProofInfo: () => {
      throw new NewBelarusCredsImplError('castProofInfo')
    },

    challenge: () => {
      throw new NewBelarusCredsImplError('challenge')
    },

    getType: () => NEWBELARUS_STRATEGY
  }

  return _strategy
}
