import { type ProofspaceConfig } from '../../config'
import { VOCDONI_CSP_CENSUSES } from '../vocdoni/consts'
import type { PsHookRequest, PsActionTemplate } from './types'

export const makeProofspaceNow = (): number => Math.floor((new Date().getTime() / 1000))

export const filterProofspaceActions = (actions: PsActionTemplate[] | undefined, requiredCreds: string[], filterIds: string[] = []): PsActionTemplate[] => {
  if (actions != null && Array.isArray(actions)) {
    return actions.filter(action => {
      if (filterIds.includes(action.actionId)) {
        return false
      }
      if (!action.media.some(media => media.type === 'QR')) {
        return false
      }
      if (action.credentialsIssued.length > 0) {
        return false
      }
      if (action.credentialsRequired.length < 2) {
        return false
      }
      if (requiredCreds.some(credId => !action.credentialsRequired.includes(credId))) {
        return false
      }

      return true
    }).map(action => ({ ...action, type: 'proofspace' }))
  }

  return []
}

export const isPsRequestProper = (action: PsHookRequest, code: string): boolean => {
  const [actionId, actionInstanceId] = code.split('|', 2)
  return action.actionId === actionId && action.actionInstanceId === actionInstanceId
}

export const filterProofspaceRequiredCreds = (action: PsActionTemplate, systemCreds: string[]): string[] =>
  action.credentialsRequired.filter(credId => !systemCreds.includes(credId))

export const filterRequiredActionProofList = (config: ProofspaceConfig, kind: string, actions: PsActionTemplate[]): PsActionTemplate[] => {
  const filterIds = [
    config.authCred.interaction?.split('|', 2)[0] as string,
    config.regCred.interaction?.split('|', 2)[0] as string
  ]

  const requiredIds = VOCDONI_CSP_CENSUSES.includes(kind)
    ? [config.authCred.credentialId]
    : [config.keystoreCred.credentialId, config.authCred.credentialId]

  return filterProofspaceActions(actions, requiredIds, filterIds)
}

export const isPsAuthenticationRequired = (action: PsActionTemplate, config: ProofspaceConfig): boolean => 
  action.credentialsRequired.includes(config.keystoreCred.credentialId)
