import { decrypt, importKey } from '@nbgov/json-crypto-token'
import { ALGO_WORKER, QUEUE_ALGO_SYNC } from '../../queue/consts'
import type { WorkerHandlerWithCtx } from '../../queue/types'
import { cleanToken, isCyberVoterToken, TgCyberPartizan, type TgOptimizedUser, type TgUser } from '@smartapps-poll/common'
import { buildStoreHelper } from '../redis'
import type { TelegramDecryptData, TelegramDecryptResult } from './types'
import { makeWaitMethod, serializeError } from '../../queue/utils'
import { Context } from '../../types'

/**
 * @remote ⚠️ (potenially - there is code that can request data from tg API - 
 * it should be precessed by more restrictive worker)
 */
export const buildTelegramDectyptHandler: WorkerHandlerWithCtx<TelegramDecryptData, TelegramDecryptResult> = ctx => ({
  tags: [ALGO_WORKER],

  queue: QUEUE_ALGO_SYNC,

  name: 'telegram:decrypt',

  handler: async job => {
    try {
      return await decryptTelegramToken(ctx, job.data)
    } catch (e) {
      serializeError(e)
      throw e
    }
  },

  wait: makeWaitMethod(ctx, QUEUE_ALGO_SYNC, 'telegram:decrypt')
})

export const decryptTelegramToken = async (ctx: Context, data: TelegramDecryptData) => {
  let user: TgUser
  try {
    const token = cleanToken(data.token)
    switch (true) {
      case isCyberVoterToken(data.token): {
        const key = importKey({
          privateKeyBase64: ctx.config.security.pk.main,
          remotePublicKeyBase64: ctx.config.telegram.cpPubKey
        })
        const part = decrypt<TgCyberPartizan>(key, token)
        user = {
          telegramId: part.id.toString(),
          username: '',
          name: '',
          ...(part.voter === undefined ? {} : { cyberVoter: part.voter })
        }
      }
      default: {
        const key = importKey({
          privateKeyBase64: ctx.config.security.pk.main,
          remotePublicKeyBase64: ctx.config.telegram.pubKey
        })
        const opt = decrypt<TgOptimizedUser>(key, token)
        user = {
          telegramId: opt.id.toString(),
          username: opt.lg,
          name: opt.lg,
          ...(opt.gs === undefined ? {} : { golos: opt.gs })
        }
      }
    }
  } catch (e) {
    throw e
    // const agent = new Agent({ rejectUnauthorized: false })
    // const url = req.context.config.telegram.apiUrl + '/user'
    // const userRes = await axios.post<TgUser>(url, { token: req.body.token, pin: req.body.pin }, { httpsAgent: agent })
    // user = userRes.data
  }

  const helper = buildStoreHelper(ctx)
  return { token: await helper.tokenize(user, 'tg-user'), golos: user.golos }
}
