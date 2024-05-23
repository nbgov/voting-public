import { type User, type Poll, PollError, VOCDONI_CENSUS_OFFCHAIN, type RequiredProof, type NewPoll } from '@smartapps-poll/common'
import { ADMIN_WORKER, QUEUE_ADMIN } from '../../queue/consts'
import type { WorkerHandlerWithCtx } from '../../queue/types'
import { makeWaitMethod, serializeError } from '../../queue/utils'
import { IntegrationError } from '../errors'
import { AuhtorizationError } from '../../routes/errors'
import type { MemberResource } from '../../resources/member'
import type { PollResource } from '../../resources/poll'
import { buildProofMeta } from '../proof'

export const buildPollCreateHandler: WorkerHandlerWithCtx<{ poll: NewPoll, user: User }, Poll> = ctx => ({
  tags: [ADMIN_WORKER],

  queue: QUEUE_ADMIN,

  name: 'poll:create',

  handler: async job => {
    try {
      if (job.data.poll == null || job.data.user == null) {
        throw new PollError('poll.create.data')
      }
      const memRes: MemberResource = ctx.db.resource('member')
      const poll = job.data.poll
      const user = job.data.user
      if (poll.serviceId == null || poll.orgId == null || poll.managerId == null) {
        throw new IntegrationError('integration.unknown')
      }
      const member = await memRes.service.authorize(user, poll.serviceId, poll.orgId, poll.managerId)
      if (member == null) {
        throw new AuhtorizationError()
      }
      const newPoll = { ...poll }
      delete newPoll.managerId

      const pollRes: PollResource = ctx.db.resource('poll')

      newPoll.requiredProofs = (await Promise.all(
        newPoll.requiredProofs?.map(async proof => await buildProofMeta(
          ctx, proof, newPoll.census?.type ?? VOCDONI_CENSUS_OFFCHAIN
        )) ?? []
      )).filter(proof => proof != null) as RequiredProof[]

      const result = await pollRes.service.create(newPoll, member)
      if (result == null) {
        throw new PollError('poll.create.failed')
      }
      return result
    } catch (e) {
      serializeError(e)
      throw e
    }
  },

  wait: makeWaitMethod(ctx, QUEUE_ADMIN, 'poll:create')
})
