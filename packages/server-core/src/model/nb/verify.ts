import { DB_WORKER, QUEUE_DB_SYNC } from '../../queue/consts'
import type { WorkerHandlerWithCtx } from '../../queue/types'
import type { NBVerifyData } from './types'
import { makeWaitMethod, serializeError } from '../../queue/utils'
import type { AuthResource } from '../../resources/auth'
import { AUTH_TYPE_TOKEN_ONETIME_SEED, type TmpTokenAuthenticationMethod } from '@smartapps-poll/common'
import { AuthError, NewBelarusError } from '../errors'
import { Presentation } from '@docknetwork/crypto-wasm-ts'
import type { PollResource } from '../../resources/poll'
import { buildProofService } from '../proof/service'

export const buildNBVerifyHandler: WorkerHandlerWithCtx<NBVerifyData> = ctx => ({
  tags: [DB_WORKER],

  queue: QUEUE_DB_SYNC,

  name: 'nbssi:verify',

  handler: async job => {
    try {
      const { user, body, votingId } = job.data
      const authRes: AuthResource = ctx.db.resource('auth')
      const auth = await authRes.service.authenticateWithHash(AUTH_TYPE_TOKEN_ONETIME_SEED, user._id) as TmpTokenAuthenticationMethod
      if (auth == null) {
        throw new AuthError('token.malformed')
      }

      if (!Array.isArray(body)) {
        throw new NewBelarusError('result.malformed')
      }

      const presentations = body.map(item => {
        if (item.presentation == null) {
          throw new NewBelarusError('result.malformed')
        }
        return Presentation.fromJSON(item.presentation)
      })

      const pollRes: PollResource = ctx.db.resource('poll')
      const poll = await pollRes.get(votingId)

      if (await buildProofService(ctx).authorizeNbResource(poll?.externalId ?? '', presentations)) {
        await authRes.service.createTmpToken(user._id, false)
      } else {
        throw new NewBelarusError('newbelarus.authorization')
      }
    } catch (e) {
      serializeError(e)
    }
  },

  wait: makeWaitMethod(ctx, QUEUE_DB_SYNC, 'nbssi:verify')
})
