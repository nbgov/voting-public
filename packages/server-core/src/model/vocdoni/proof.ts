import type { WorkerHandlerWithCtx } from '../../queue/types'
import { DB_WORKER, QUEUE_DB_SYNC } from '../../queue/consts'
import { makeWaitMethod, serializeError } from '../../queue/utils'
import type { PollResource } from '../../resources/poll'
import { AuhtorizationError, MalformedError } from '../../routes/errors'
import type { CensusProofData, CensusProofResult } from './types'
import { CensusSyntaxError } from '@smartapps-poll/common'

export const buildCensusProofHandler: WorkerHandlerWithCtx<CensusProofData, CensusProofResult> = ctx => ({
  tags: [DB_WORKER],

  queue: QUEUE_DB_SYNC,

  name: 'vocdoni:census-proof',

  handler: async job => {
    try {
      const { address, user, id } = job.data
      const pollRes: PollResource = ctx.db.resource('poll')
      if (user == null && address == null) {
        throw new AuhtorizationError()
      }
      if (id == null) {
        throw new MalformedError('census.poll.id')
      }
      const poll = await pollRes.get(id)
      if (poll == null) {
        throw new MalformedError('census.missed.poll')
      }
      try {
        if (address != null) {
          const result = await ctx.strategy.service().census.check(poll, address)

          return result as CensusProofResult
        } else if (user != null) {
          const result = await ctx.strategy.service().census.check(poll, user.votingAddress)

          return result as CensusProofResult
        } else {
          throw new MalformedError('unreachable')
        }
      } catch (e) {
        if (e instanceof CensusSyntaxError) {
          throw e
        }
        return null
      }
    } catch (e) {
      serializeError(e)
      throw e
    }
  },

  wait: makeWaitMethod(ctx, QUEUE_DB_SYNC, 'vocdoni:census-proof')
})
