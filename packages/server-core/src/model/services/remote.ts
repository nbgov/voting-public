import type { IntegrationResponse } from '@smartapps-poll/common'
import type { ServiceAuthenticationRequest } from './types'
import axios from 'axios'
import type { WorkerHandlerWithCtx } from '../../queue/types'
import { QUEUE_REMOTE_SYNC, REMOTE_WORKER } from '../../queue/consts'
import { makeWaitMethod, serializeError } from '../../queue/utils'

export const serviceAuthenticationRequest: WorkerHandlerWithCtx<ServiceAuthenticationRequest, IntegrationResponse> = ctx => ({
  tags: [REMOTE_WORKER],

  name: 'service:authentication-request',

  queue: QUEUE_REMOTE_SYNC,

  handler: async job => {
    try {
      const result = await axios.post<IntegrationResponse>(job.data.url, job.data.payload)
      return result.data
    } catch (e) {
      serializeError(e)
      throw e
    }
  },

  wait: makeWaitMethod(ctx, QUEUE_REMOTE_SYNC, 'service:authentication-request')
})
