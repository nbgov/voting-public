import { DB_WORKER, QUEUE_DB_SYNC } from '../../queue/consts'
import type { WorkerHandlerWithCtx } from '../../queue/types'
import type { NBVerifyData } from './types'
import { makeWaitMethod, serializeError } from '../../queue/utils'
import type { AuthResource } from '../../resources/auth'
import {
  AUTH_TYPE_TOKEN_ONETIME, AUTH_TYPE_TOKEN_ONETIME_SEED, CRED_TYPE_NEWBELARUSPASSPORT,
  type OneTimePayload, type PassportSubject, PollError, type TmpTokenAuthenticationMethod,
} from '@smartapps-poll/common'
import { AuthError, NewBelarusError } from '../errors'
import { Presentation } from '@docknetwork/crypto-wasm-ts'
import type { PollResource } from '../../resources/poll'
import { buildProofService } from '../proof/service'
import { findParticularCredInNbPresentation } from '../newbelarus'
import { extractNBRisks, stabNBMeta } from './utils'
import { isVeriffRecordSafe } from '../veriff/utils'
import { VERIFF_ABUSE_TRESHOLD } from '../veriff/consts'

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
      if (poll?.externalId == null) {
        throw new PollError('poll.no')
      }

      if (await buildProofService(ctx).authorizeNbResource(poll.externalId, presentations)) {
        const payload: OneTimePayload = { externalId: poll?.externalId ?? 'unknown' }
        await authRes.service.createTmpToken(user._id, false, AUTH_TYPE_TOKEN_ONETIME, payload)

        // We record when someone gets right to get bulletin with a suspicious passport

        const passport = stabNBMeta( // @TODO safe but better to remove from prod
          ctx,
          findParticularCredInNbPresentation<PassportSubject>(presentations, CRED_TYPE_NEWBELARUSPASSPORT)
        )
        if (passport != null && passport.credentialSubject?.meta != null) {
          const risk = extractNBRisks(passport.credentialSubject)
          const [safe, score] = isVeriffRecordSafe(risk)
          if (ctx.config.devMode) {
            console.log(safe, score, risk)
          }
          if (!safe) {
            ctx.auditLogger.veriffRisk(job.data.ip, 'nbssi-verify', risk, score < VERIFF_ABUSE_TRESHOLD)
          }
        }
      } else {
        throw ctx.config.earlyFailure ? new PollError() : new NewBelarusError('newbelarus.authorization')
      }
    } catch (e) {
      serializeError(e)
    }
  },

  wait: makeWaitMethod(ctx, QUEUE_DB_SYNC, 'nbssi:verify')
})
