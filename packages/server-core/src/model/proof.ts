import { NEWBELARUS_STRATEGY, PROOFSPACE_STRATEGY, dockNBPrefedinedActions, type PsActionTemplate, type PsCredential, type RequiredProof, CRED_TYPE_NEWBELARUSPASSPORT, NBServiceData, TELEGRAM_STRATEGY } from '@smartapps-poll/common'
import { type Context } from '../types'
import { createProofspaceWalletStrategy } from '../startegy/proofspace/wallet'
import { type ServiceResource } from '../resources/service'
import { NEWBELARUS_DECENTRALIZED_SERVICE_PREFIX } from './newbelarus'

export const buildProofMeta = async (context: Context, proof: RequiredProof, kind: string): Promise<RequiredProof | undefined> => {
  switch (proof.type) {
    case NEWBELARUS_STRATEGY: {
      const actions = dockNBPrefedinedActions
      const action = actions.find(action => action.actionId === proof._id)
      const srvRes: ServiceResource = context.db.resource('service')
      const pubDocSrv = await srvRes.get(`${NEWBELARUS_DECENTRALIZED_SERVICE_PREFIX}${CRED_TYPE_NEWBELARUSPASSPORT}`)
      const serviceData: NBServiceData = JSON.parse(pubDocSrv?.apiUrl ?? '{"did": ""}')
      return { ...proof, meta: { ...action, allowedIssuers: [serviceData.did] } }
    }
    case PROOFSPACE_STRATEGY: {
      const strategy = createProofspaceWalletStrategy()
      strategy.setStrategyContext(context.strategy)
      const actions = await strategy.getRequiredProofList(kind) as PsActionTemplate[]
      const action = actions.find(action => action.actionId === proof._id)
      return { ...proof, ...(action != null ? { meta: action } : {}) }
    }
    case TELEGRAM_STRATEGY: {
      return { ...proof }
    }
    default:
      return undefined
  }
}

export const filterProofs = (context: Context, creds: PsCredential[]): PsCredential[] => creds.filter(
  cred => ![
    context.config.proofspace.authCred.credentialId,
    context.config.proofspace.keystoreCred.credentialId,
    context.config.proofspace.regCred.credentialId
  ].includes(cred.credentialId)
)
