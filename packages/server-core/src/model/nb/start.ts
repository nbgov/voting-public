import { DB_WORKER, QUEUE_DB_SYNC } from '../../queue/consts'
import type { WorkerHandlerWithCtx } from '../../queue/types'
import { type DockActionRequest, type DockActionTemplate, AUTH_TYPE_TOKEN_ONETIME_SEED } from '@smartapps-poll/common'
import type { NBStartData } from './types'
import type { PollResource } from '../../resources/poll'
import { NEWBELARUS_DECENTRALIZED_SERVICE_PREFIX, prepareNewBelarusActionRequest, prepareNewBelarusActionTypes } from '../newbelarus'
import type { ServiceResource } from '../../resources/service'
import { NewBelarusError } from '../errors'
import type { AuthResource } from '../../resources/auth'
import { getBytes } from '@vocdoni/sdk'
import { makeWaitMethod, serializeError } from '../../queue/utils'

export const buildNBStartHandler: WorkerHandlerWithCtx<NBStartData, DockActionRequest[]> = ctx => ({
  tags: [DB_WORKER],

  queue: QUEUE_DB_SYNC,

  name: 'nbssi:start',

  handler: async job => {
    try {
      const pollRes: PollResource = ctx.db.resource('poll')
      const poll = await pollRes.get(job.data.votingId)

      const requiredCreds: string[] = poll == null ? [] : prepareNewBelarusActionTypes(poll)

      const srvRes: ServiceResource = ctx.db.resource('service')
      const pubDocs = await srvRes.service.getCredPublicServices(requiredCreds.map(
        cred => `${NEWBELARUS_DECENTRALIZED_SERVICE_PREFIX}${cred}`
      ))

      if (pubDocs.length === 0) {
        throw new NewBelarusError('newbelarus.no.keyservice')
      }

      const authRes: AuthResource = ctx.db.resource('auth')
      const [, nonce] = await authRes.service.createTmpToken(
        Buffer.from(getBytes(64)).toString('hex'), false, AUTH_TYPE_TOKEN_ONETIME_SEED
      )

      const actionRequests: (DockActionRequest | DockActionTemplate)[] = poll == null
        ? [] : prepareNewBelarusActionRequest(poll)

      const result = actionRequests.map(
        request => ({
          ...request, challenge: nonce,
          allowedIssuers: request.credentialsRequired.map(
            type => JSON.parse(pubDocs.find(doc => doc.serviceId.endsWith(type))?.apiUrl ?? '').did
          )
        })
      )

      return result
    } catch (e) {
      serializeError(e)
      throw e
    }
  },

  wait: makeWaitMethod(ctx, QUEUE_DB_SYNC, 'nbssi:start')
})
