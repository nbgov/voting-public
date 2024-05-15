import { type CredentialsWalletStrategy, type PsActionTemplate, filterRequiredActionProofList, type RequiredProof } from '@smartapps-poll/common'
import { type CommonContext } from '../../context/types'
import { type WebStrategy } from '../types'
import { PROOFSPACE_STRATEGY } from './consts'
import { ProofspaceCredsImplError, ProofspaceWalletInteractionError } from './errors'

export const createProofspaceWalletStrategy = (): CredentialsWalletStrategy<CommonContext> => {
  let strategy: WebStrategy
  const _strategy: CredentialsWalletStrategy<CommonContext> = {
    setStrategyContext: _strategy => { strategy = _strategy },

    isAuthenticated: () => strategy.ctx().web.authToken != null,

    getRequiredProofList: async (kind) => {
      const config = await strategy.ctx().web.config.proofspace()
      const url = `${config.dashboardBackendUrl}/service/${config.serviceId}/info/action-templates`

      const client = strategy.ctx().web.client()
      const actions = await client.get<PsActionTemplate[]>(url)

      return filterRequiredActionProofList(config, kind, actions.data)
    },

    challenge: () => {
      throw new ProofspaceCredsImplError('challenge')
    },

    castProofInfo: proof => {
      proof = Array.isArray(proof)
        ? proof.find(proof => proof.type === PROOFSPACE_STRATEGY) as RequiredProof
        : proof

      if (proof.type !== PROOFSPACE_STRATEGY) {
        throw new ProofspaceWalletInteractionError('wallet.proof.mismatch')
      }

      const meta: PsActionTemplate = proof.meta as PsActionTemplate
      return meta != null ? {
        type: proof.type,
        refId: proof._id,
        guideUrl: proof.guideUrl,
        title: meta.actionName
      } : {
        type: proof.type,
        refId: proof._id,
        guideUrl: proof.guideUrl,
        title: 'voting.cred.main'
      }
    },

    getType: () => PROOFSPACE_STRATEGY
  }

  return _strategy
}
