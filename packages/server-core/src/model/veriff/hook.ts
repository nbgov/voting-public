import type { WorkerHandlerWithCtx } from '../../queue/types'
import { QUEUE_DB_SYNC, SERVICES_WORKER } from '../../queue/consts'
import { makeWaitMethod, serializeError } from '../../queue/utils'
import { PollVerification, VeiffDocStatus, VeriffActions, VeriffStatus, type VeriffHookRequest } from './types'
import { isVeriffAction, isVeriffDecision, isVeriffRecordSafe, stabPassportInDevMode } from './utils'
import type { AuthResource } from '../../resources/auth'
import { buildStoreHelper } from '../redis'
import { ERROR_EARLY_FAILURE, VeriffError } from '../errors'
import { buildProofService } from '../proof/service'
import { PollResource } from '../../resources/poll'
import { AuditOutcome } from '../audit/types'
import { AUTH_TYPE_TOKEN_ONETIME, OneTimePayload } from '@smartapps-poll/common'
import { VeriffResouce } from '../../resources/veriff'
import { VERIFF_ABUSE_TRESHOLD } from './consts'

export const buildVeriffHookHandler: WorkerHandlerWithCtx<VeriffHookRequest, AuditOutcome> = ctx => ({
  tags: [SERVICES_WORKER],

  queue: QUEUE_DB_SYNC,

  name: 'veriff:hook',

  handler: async job => {
    try {
      switch (true) {
        case isVeriffAction(job.data): {
          if (job.data != null) {
            const event = job.data
            if (event.action === VeriffActions.Started) {
              if (event.id != null) {
                const veriff: VeriffResouce = ctx.db.resource('veriff')
                await veriff.service.register(event.id)
              }
            }
          }
          return AuditOutcome.SUCCESS
        }
        case isVeriffDecision(job.data): {
          const store = buildStoreHelper(ctx)
          const auth: AuthResource = ctx.db.resource('auth')
          const token = auth.str(job.data.verification?.vendorData)
          if (job.data.status !== VeriffStatus.Success && job.data.verification?.status !== VeiffDocStatus.Approved) {
            await store.set('veriff-pickup:' + token, { status: 'failure' }, 1800)
            await store.remove('veriff-seed:' + token)
            return AuditOutcome.FAILUER
          }
          if (token.length > 255) {
            throw new VeriffError('veriff.malformed')
          }
          const verification = await store.pick<PollVerification>('veriff-seed:' + token)
          if (verification == null || verification.seed == null || verification.id == null) {
            throw new VeriffError()
          }

          const pollRes: PollResource = ctx.db.resource('poll')
          const poll = await pollRes.get(verification.id, 'externalId')
          if (poll == null) {
            throw new VeriffError('veriff.resource')
          }

          // @TODO safe but better to remove from prod
          const passport = stabPassportInDevMode(ctx.config, job.data) // job.data

          if (!await buildProofService(ctx).authorizeWpResource(verification.id, [passport], { poll })) {
            await store.set('veriff-pickup:' + token, {
              status: ctx.config.earlyFailure ? ERROR_EARLY_FAILURE : 'ok'
            }, 1800)
            return AuditOutcome.ABUSE
          }

          const payload: OneTimePayload = { externalId: verification.id }
          // One time token after deduplication is issued here
          await auth.service.createTmpToken(verification.seed, false, AUTH_TYPE_TOKEN_ONETIME, payload)
          await store.set('veriff-pickup:' + token, { status: 'ok' }, 1800)

          // We record when someone gets right to get bulletin with a suspicious passport
          const [safe, score] = isVeriffRecordSafe(passport.verification)
          if (!safe) {
            ctx.auditLogger.veriffRisk(
              passport.technicalData.ip, 'web-pass', passport.verification,
              score < VERIFF_ABUSE_TRESHOLD
            )
          }

          break
        }
      }
      return AuditOutcome.SUCCESS
    } catch (e) {
      serializeError(e)
      throw e
    }
  },

  wait: makeWaitMethod(ctx, QUEUE_DB_SYNC, 'veriff:hook')
})
