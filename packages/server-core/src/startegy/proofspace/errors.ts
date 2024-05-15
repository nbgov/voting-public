import { CredsStartegyImplError, PROOFSPACE_STRATEGY } from '@smartapps-poll/common'

export class ProofspaceCredsImplError extends CredsStartegyImplError {
  constructor (method: string) {
    super(PROOFSPACE_STRATEGY, method)
  }
}
