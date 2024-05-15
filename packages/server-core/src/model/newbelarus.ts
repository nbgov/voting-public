import type { Presentation } from '@docknetwork/crypto-wasm-ts'
import type { DockActionTemplate, DockCredential, Poll } from '@smartapps-poll/common'
import { CRED_TYPE_NEWBELARUSTELEGRAM, NEWBELARUS_STRATEGY, TELEGRAM_STRATEGY, dockNBTelegramAction, getTgMeta } from '@smartapps-poll/common'

export const NEWBELARUS_DECENTRALIZED_SERVICE_PREFIX = 'newbelarus-decentralized:'

export const prepareNewBelarusActionRequest = (poll: Poll, mergeTg?: boolean): DockActionTemplate[] => {
  const requests = poll?.requiredProofs?.filter(proof => proof.type === NEWBELARUS_STRATEGY)
    .map(proof => proof.meta as DockActionTemplate) ?? []

  if (mergeTg != null && mergeTg) {
    const tgProof = poll?.requiredProofs?.find(proof => proof.type === TELEGRAM_STRATEGY)
    if (tgProof != null) {
      requests[0].credentialsRequired.push(...dockNBTelegramAction.credentialsRequired)
      requests[0].fieldsToReveal.push(...dockNBTelegramAction.fieldsToReveal)
      const tgMeta = getTgMeta(poll)
      if (tgMeta?.allowInstead) {
        requests[0].optionalCredentials = [true, false]
      }
    }
  }

  return requests
}

export const prepareNewBelarusActionTypes = (poll: Poll, mergeTg?: boolean): string[] => {
  const types: string[] = poll?.requiredProofs?.filter(proof => proof.type === NEWBELARUS_STRATEGY)
    .flatMap(proof => (proof.meta as DockActionTemplate).credentialsRequired) ?? []

  if (mergeTg != null && mergeTg) {
    const tgProof = poll?.requiredProofs?.find(proof => proof.type === TELEGRAM_STRATEGY)
    if (tgProof != null) {
      types.push(CRED_TYPE_NEWBELARUSTELEGRAM)
    }
  }

  return types
}

export const findParticularCredInNbPresentation = <T extends {}>(presentations: Presentation[], type: string): DockCredential<T> | undefined => {
  const credentials = presentations.flatMap(presentation => presentation.spec.credentials.filter(
    credential => (credential.revealedAttributes as DockCredential).type === type
  ))
  if (credentials.length > 0) {
    return credentials[0].revealedAttributes as DockCredential<T>
  }
}
