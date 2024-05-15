import type { PollInfo } from '../poll'
import { CYBERVOTER_TOKEN_DELIMITER, CYBERVOTER_TOKEN_PREFIX, TELEGRAM_STRATEGY } from './consts'
import type { TgProofMeta } from './types'

export const getTgMeta = (poll: PollInfo): TgProofMeta | undefined =>
  poll.requiredProofs?.find(proof => proof.type === TELEGRAM_STRATEGY)?.meta as TgProofMeta | undefined

export const isCyberVoterToken = (token: string): boolean =>
  token.startsWith(CYBERVOTER_TOKEN_PREFIX)

export const cleanToken = (token: string): string =>
  isCyberVoterToken(token) ? token.split(CYBERVOTER_TOKEN_DELIMITER, 2)[1] : token
