import { type PollInfo, PollStatus, VOCDONI_CENSUS_OFFCHAIN, VOCDONI_CSP_CENSUSES } from '@smartapps-poll/common'

export const isCspCensus = (poll: PollInfo) =>
  () => VOCDONI_CSP_CENSUSES.includes(poll.census?.type ?? '')

export const isOffchainCensus = (poll: PollInfo) =>
  () => poll.census?.type == null || poll.census?.type === '' || poll.census?.type === VOCDONI_CENSUS_OFFCHAIN

export const isPublishingRequired = (poll: PollInfo) =>
  poll.status === PollStatus.UNPUBLISHED // && isOffchainCensus(poll)()

export const canStartVoting = (poll: PollInfo) =>
  poll.status === PollStatus.PUBLISHED || (poll.status === PollStatus.UNPUBLISHED && isCspCensus(poll)())
