import { AbstractStrategyError, CredsStartegyImplError, NEWBELARUS_STRATEGY, StrategyErrorType } from '@smartapps-poll/common'

export class NewBelarusWalletInteractionError extends CredsStartegyImplError {
  constructor (code?: string) {
    super(NEWBELARUS_STRATEGY, code ?? 'wallet.interaction')
  }
}

export class NewBelarusWalletNotFound extends AbstractStrategyError {
  constructor (code?: string) {
    super(NEWBELARUS_STRATEGY, StrategyErrorType.CREDS, code ?? 'cred.not.found')
  }
}
