import { type User, PollError } from '@smartapps-poll/common'
import { ADMIN_WORKER, QUEUE_ADMIN } from '../../queue/consts'
import type { WorkerHandlerWithCtx } from '../../queue/types'
import { makeWaitMethod, serializeError } from '../../queue/utils'
import { AuhtorizationError, MalformedError } from '../../routes/errors'
import { MemberResource } from '../../resources/member'
import { PollAuthorization, PollResource } from '../../resources/poll'

export const buildPollDeleteHandler: WorkerHandlerWithCtx<{ id: string, user: User }, boolean> = ctx => ({
  tags: [ADMIN_WORKER],

  queue: QUEUE_ADMIN,

  name: 'poll:delete',

  handler: async job => {
    try {
      if (job.data.id == null || job.data.user == null) {
        throw new PollError('poll.delete.data')
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

      return await pollRes.service.delete(presentation, member)
    } catch (e) {
      serializeError(e)
      throw e
    }
  },

  wait: makeWaitMethod(ctx, ADMIN_WORKER, 'poll:delete')
})
