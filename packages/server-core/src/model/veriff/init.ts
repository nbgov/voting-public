import { PollError, VeriffInitParams, randomToken, type VeriffInitResponse } from '@smartapps-poll/common'
import type { WorkerHandlerWithCtx } from '../../queue/types'
import { FREQUENT_WORKER, QUEUE_REMOTE_SYNC, REMOTE_WORKER } from '../../queue/consts'
import { makeWaitMethod, serializeError } from '../../queue/utils'
import { buildStoreHelper } from '../redis'
import { buildVeriffService } from './model'
import { PollVerification } from './types'
import { PollResource } from '../../resources/poll'

export const buildVeriffInitHandler: WorkerHandlerWithCtx<VeriffInitParams, VeriffInitResponse> = ctx => ({
  tags: [REMOTE_WORKER, FREQUENT_WORKER],

  queue: QUEUE_REMOTE_SYNC,

  name: 'veriff:init',

  handler: async job => {
    try {
      const service = buildVeriffService(ctx)

      const pollRes: PollResource = ctx.db.resource('poll')
      const poll = await pollRes.get(job.data.pollId)
      if (poll == null || poll.externalId == null) {
        throw new PollError('no.poll')
      }

      const seed = randomToken()
      const token = await buildStoreHelper(ctx).tokenize<PollVerification>(
        { seed, id: poll.externalId }, 'veriff-seed', 1800
      )

      /**
       * @TODO etc. https://app.clickup.com/t/8694j553c
       */
      const result = await service.createSession(token)
      return { token, seed, sessionUrl: result.verification.url }
    } catch (e) {
      serializeError(e)
      throw e
    }
  },

  wait: makeWaitMethod(ctx, QUEUE_REMOTE_SYNC, 'veriff:init')
})
