import type { Presentation } from '@docknetwork/crypto-wasm-ts'
import type { DockCredential, NBTgSubject, RequiredProof, TgProofMeta } from '@smartapps-poll/common'
import { CRED_TYPE_NEWBELARUSTELEGRAM, TG_VALIDATOR_GOLOS } from '@smartapps-poll/common'
import { findParticularCredInNbPresentation } from '../newbelarus'
import { ProofError } from '../../resources/errors'

export const assertTgCredSufficienty = (presentations: Presentation[], cred: RequiredProof<TgProofMeta> | undefined): boolean | never => {
  if (cred != null && cred.meta?.allowInstead) {
    const presCred = findParticularCredInNbPresentation<NBTgSubject>(presentations, CRED_TYPE_NEWBELARUSTELEGRAM)
    if (presCred != null) {
      if (cred.meta.allowInstead) {
        if (cred.meta.allowAny) {
          if (!cred.meta.validators?.some(validator => validatorPredicate(validator, presCred, cred))) {
            throw new ProofError('validator.missed')
          }
        } else {
          if (!cred.meta.validators?.every(validator => validatorPredicate(validator, presCred, cred))) {
            throw new ProofError('validator.missed')
          }
        }

        return true
      }
    }
  }

  return false
}

const validatorPredicate = (validator: string, cred: DockCredential<NBTgSubject>, proof: RequiredProof<TgProofMeta>) => {
  switch (validator) {
    case TG_VALIDATOR_GOLOS:
      return proof.meta?.validators?.includes(validator) && cred.credentialSubject.hasGolos
  }

  return false
}
