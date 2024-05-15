import { CLEANUP_WORKER, AUTH_CLEAUP_FREQUENCY, QUEUE_CLENUP } from '../../queue/consts'
import { WorkerHandlerWithCtx } from '../../queue/types'
import { makeRepeatMethod, serializeError, stabWaitMethod } from '../../queue/utils'
import { AuthResource } from '../../resources/auth'

export const buildAuthCleanUpHandler: WorkerHandlerWithCtx = ctx => ({
  tags: [CLEANUP_WORKER],
  queue: QUEUE_CLENUP,
  name: 'auth:clean-up',
  handler: async () => {
    try {
      console.info('auth:clean-up')
      const authRes = ctx.db.resource<AuthResource>('auth')
      await authRes.service.cleanUpExpired()
    } catch (e) {
      serializeError(e)
    }
  },

  wait: stabWaitMethod,

  repeat: makeRepeatMethod(ctx, QUEUE_CLENUP, 'auth:clean-up', AUTH_CLEAUP_FREQUENCY)
})
