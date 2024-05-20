import { NEWBELARUS_STRATEGY, PROOFSPACE_STRATEGY, TELEGRAM_STRATEGY, newbelarusAllowedCensus } from './model'
import { proofspaceAllowedCensus } from './model/proofspace/consts'

export const SKIP_CRED_SOURCE = 'skip'

export const EMPTY_ACTION = '_empty'

export const credentialSourceList = [
  SKIP_CRED_SOURCE, NEWBELARUS_STRATEGY, PROOFSPACE_STRATEGY
]

export const nonChoiceStrategies = [TELEGRAM_STRATEGY, NEWBELARUS_STRATEGY]

export const DEFAULT_CRED_SOURCE = NEWBELARUS_STRATEGY

export const supportedCensusBySource = {
  [NEWBELARUS_STRATEGY]: newbelarusAllowedCensus,
  [PROOFSPACE_STRATEGY]: proofspaceAllowedCensus
}

export const ALLOWED_COUNTRIES = ['BY']
export const ALLOWED_PROOFSPACE_COUNTRIES = ['112']
export const DANGEROUS_COUNTRIES = ['BY', 'RU']
