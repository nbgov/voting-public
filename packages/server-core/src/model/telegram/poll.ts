import { PollError, getTgMeta, type TgUser, TG_VALIDATOR_GOLOS, OneTimePayload, AUTH_TYPE_TOKEN_ONETIME } from '@smartapps-poll/common'
import { DB_WORKER, QUEUE_DB_SYNC } from '../../queue/consts'
import type { WorkerHandlerWithCtx } from '../../queue/types'
import { makeWaitMethod, serializeError } from '../../queue/utils'
import { buildStoreHelper } from '../redis'
import type { TelegramAuthPollData, TelegramAuthPollResult } from './types'
import { PollResource } from '../../resources/poll'
import { AuthError } from '../errors'
import { buildProofService } from '../proof/service'
import { AuthResource } from '../../resources/auth'

export const buildTelegramPollAuthHandler: WorkerHandlerWithCtx<TelegramAuthPollData, TelegramAuthPollResult> = ctx => ({
  tags: [DB_WORKER],

  queue: QUEUE_DB_SYNC,

  name: 'telegram:auth-poll',

  handler: async job => {
    try {
      const pollRes: PollResource = ctx.db.resource('poll')
      const poll = await pollRes.get(job.data.poll)
      if (poll == null) {
        throw new PollError('poll.notexists')
      }
      const tgMeta = getTgMeta(poll)
      if (tgMeta == null) {
        throw new PollError('poll.wrongtype')
      }
      const store = buildStoreHelper(ctx)
      const tgUser: TgUser | undefined = await store.get('tg-user:' + job.data.token)
      if (tgUser == null) {
        throw new AuthError('tg.validator.no')
      }

      if (!tgMeta.allowInstead || tgMeta.validators == null) {
        throw new PollError('auth.required')
      }

      const _validationPredicate = (validator: string): boolean => {
        switch (validator) {
          case TG_VALIDATOR_GOLOS:
            if (tgUser.golos) {
              return true
            }
        }

        return false
      }

      if (tgMeta.allowAny) {
        if (!tgMeta.validators.some(_validationPredicate)) {
          throw new AuthError('auth.tg')
        }
      } else {
        if (!tgMeta.validators.every(_validationPredicate)) {
          throw new AuthError('auth.tg')
        }
      }
      const tgCheck = await buildProofService(ctx).processTgCondition(poll, tgUser, true)
      if (tgCheck.required && !tgCheck.result) {
        throw new Error('deduplication.failed')
      }

      const authRes: AuthResource = ctx.db.resource('auth')
      const payload: OneTimePayload = { externalId: poll.externalId ?? 'unknown' }
      const [, token] = await authRes.service.createTmpToken(undefined, false, AUTH_TYPE_TOKEN_ONETIME, payload)

      if (!await buildProofService(ctx).commitTgCondition(poll, tgCheck)) {
        throw new Error('deduplication.failed')
      }

      return { token }
    } catch (e) {
      serializeError(e)
      throw e
    }
  },

  wait: makeWaitMethod(ctx, QUEUE_DB_SYNC, 'telegram:auth-poll')
})
