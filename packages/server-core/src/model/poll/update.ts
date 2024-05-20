import { type User, PollError, type PollInfo } from '@smartapps-poll/common'
import { DB_WORKER, QUEUE_DB_SYNC } from '../../queue/consts'
import type { WorkerHandlerWithCtx } from '../../queue/types'
import { makeWaitMethod, serializeError } from '../../queue/utils'
import { AuhtorizationError, MalformedError } from '../../routes/errors'
import type { MemberResource } from '../../resources/member'
import { PollAuthorization, type PollResource } from '../../resources/poll'

export const buildPollUpdateHandler: WorkerHandlerWithCtx<{ id: string, poll: PollInfo, user: User }, PollInfo> = ctx => ({
  tags: [DB_WORKER],

  queue: QUEUE_DB_SYNC,

  name: 'poll:update',

  handler: async job => {
    try {
      if (job.data.id == null || job.data.poll == null || job.data.user == null) {
        throw new PollError('poll.update.data')
      }
      const user = job.data.user
      const memRes: MemberResource = ctx.db.resource('member')
      const pollRes: PollResource = ctx.db.resource('poll')
      const poll = await pollRes.get(job.data.id)
      if (poll == null) {
        throw new MalformedError('missed.poll')
      }
      const member = await memRes.service.authorize(user, poll.serviceId, poll.orgId)
      if (member == null) {
        throw new AuhtorizationError('member.unauthorized')
      }
      const presentation = await pollRes.service.authorize(poll, user, PollAuthorization.MANAGEMENT)
      if (presentation.manager == null) {
        throw new AuhtorizationError('poll.manager.unauthorized')
      }

      const updated = await pollRes.service.update(presentation, job.data.poll, member, PollAuthorization.MANAGEMENT)
      if (updated == null) {
        throw new PollError('poll.update.failed')
      }
      return updated
    } catch (e) {
      serializeError(e)
      throw e
    }
  },

  wait: makeWaitMethod(ctx, QUEUE_DB_SYNC, 'poll:update')
})
