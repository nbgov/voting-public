import { CLEANUP_WORKER, PROOF_CLEAUP_FREQUENCY, QUEUE_CLENUP } from '../../queue/consts'
import { WorkerHandlerWithCtx } from '../../queue/types'
import { makeRepeatMethod, serializeError, stabWaitMethod } from '../../queue/utils'
import { ProofResouce } from '../../resources/proof'

export const buildProofCleanUpHandler: WorkerHandlerWithCtx = ctx => ({
  tags: [CLEANUP_WORKER],
  queue: QUEUE_CLENUP,
  name: 'poll:proof-cleanup',
  handler: async () => {
    try {
      console.log('poll:proof-cleanup')
      const proofRes = ctx.db.resource<ProofResouce>('proof')
      await proofRes.service.cleanUp()
    } catch (e) {
      serializeError(e)
    }
  },
  wait: stabWaitMethod,
  repeat: makeRepeatMethod(ctx, QUEUE_CLENUP, 'poll:proof-cleanup', PROOF_CLEAUP_FREQUENCY)
})
