import { DB_WORKER, QUEUE_DB_SYNC } from '../../queue/consts'
import type { WorkerHandlerWithCtx } from '../../queue/types'
import { makeWaitMethod, serializeError } from '../../queue/utils'
import { PollAuthorization, type PollResource } from '../../resources/poll'
import type { ProofResouce } from '../../resources/proof'
import type { CensusRegisterData } from './types'
import { AuhtorizationError, MalformedError } from '../../routes/errors'
import { CensusSyntaxError, PollStatus } from '@smartapps-poll/common'
import { CensusRegistration } from '../errors'

export const buildCensusRegisterHandler: WorkerHandlerWithCtx<CensusRegisterData, {}> = ctx => ({
  tags: [DB_WORKER],

  queue: QUEUE_DB_SYNC,

  name: 'vocdoni:census-register',

  handler: async job => {
    try {
      const { user, id } = job.data
      const pollRes: PollResource = ctx.db.resource('poll')
      const proofRes: ProofResouce = ctx.db.resource('proof')
      if (user == null) {
        throw new AuhtorizationError()
      }
      if (id == null) {
        throw new MalformedError('census.poll.id')
      }
      const poll = await pollRes.get(id)
      if (poll == null) {
        throw new MalformedError('census.missed.poll')
      }
      if (poll.status !== PollStatus.PUBLISHED) {
        throw new CensusRegistration('census.closed')
      }
      const filterResult = await proofRes.service.matchPoll(user._id, poll)
      if (!filterResult.match) {
        throw new CensusRegistration('census.denied')
      }

      try {
        const presentation = await pollRes.service.authorize(poll, user, PollAuthorization.INTERNAL)
        const result = await ctx.strategy.service().census.register(presentation, user)

        return result as {}
      } catch (e) {
        console.error(e)
        if (e instanceof CensusSyntaxError) {
          throw e
        }
        throw new CensusRegistration('census.cant')
      }
    } catch (e) {
      serializeError(e)
      throw e
    }
  },

  wait: makeWaitMethod(ctx, QUEUE_DB_SYNC, 'vocdoni:census-register')
})
