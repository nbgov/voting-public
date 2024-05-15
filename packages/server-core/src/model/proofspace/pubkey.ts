import axios from 'axios'
import type { WorkerHandlerWithCtx } from '../../queue/types'
import { QUEUE_REMOTE_SYNC, REMOTE_WORKER } from '../../queue/consts'
import type { PsPubKeyRequest, PsPubKeyResponse } from './types'
import type { PsPubKeyJson } from '../../auth/method/proofspace/types'
import { makeWaitMethod, serializeError } from '../../queue/utils'

export const proofspacePubKeyRequest: WorkerHandlerWithCtx<PsPubKeyRequest, PsPubKeyResponse> = (ctx) => ({
  tags: [REMOTE_WORKER],

  name: 'proofsapce:pubkey',

  queue: QUEUE_REMOTE_SYNC,

  handler: async job => {
    try {
      const result = await axios.get<PsPubKeyJson>(
        job.data.pattern.replace('{service}', job.data.did).replace('{pubkey}', job.data.key)
      )
      return result.data
    } catch (e) {
      console.error(e)
      serializeError(e)
      throw e
    }
  },

  wait: makeWaitMethod(ctx, QUEUE_REMOTE_SYNC, 'proofsapce:pubkey')
})
