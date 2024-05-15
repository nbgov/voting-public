import type { SKIP_CRED_SOURCE } from './consts'
import type { PROOFSPACE_STRATEGY, NEWBELARUS_STRATEGY } from './model'

export type CensusTypeValues = typeof NEWBELARUS_STRATEGY | typeof PROOFSPACE_STRATEGY | typeof SKIP_CRED_SOURCE
