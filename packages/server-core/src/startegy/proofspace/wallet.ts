import { type CredentialsWalletStrategy, type PsActionTemplate, PROOFSPACE_STRATEGY, filterRequiredActionProofList } from '@smartapps-poll/common'
import { type Context } from '../../types'
import { type ServerStrategy } from '../types'
import { ProofspaceCredsImplError } from './errors'
import axios from 'axios'

export const createProofspaceWalletStrategy = (): CredentialsWalletStrategy<Context> => {
  let strategy: ServerStrategy
  const _strategy: CredentialsWalletStrategy<Context> = {
    setStrategyContext: _strategy => { strategy = _strategy },

    isAuthenticated: () => {
      throw new ProofspaceCredsImplError('isAuthenticated')
    },

    getRequiredProofList: async (kind: string) => {
      const config = strategy.ctx().config.proofspace
      const url = `${config.dashboardBackendUrl}/service/${config.serviceId}/info/action-templates`

      const actions = await axios.get<PsActionTemplate[]>(url)

      return filterRequiredActionProofList(config, kind, actions.data)
    },

    challenge: () => {
      throw new ProofspaceCredsImplError('challenge')
    },

    castProofInfo: () => {
      throw new ProofspaceCredsImplError('castProofInfo')
    },

    getType: () => PROOFSPACE_STRATEGY
  }

  return _strategy
}
