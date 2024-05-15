import { AUTH_ANONYMOUS, AUTH_TYPE_TOKEN, buildAnonymousUser, type TokenAuthenticationMethod } from '@smartapps-poll/common'
import { DB_WORKER, FREQUENT_WORKER, QUEUE_REMOTE_SYNC } from '../../queue/consts'
import type { WorkerHandlerWithCtx } from '../../queue/types'
import { makeWaitMethod, serializeError } from '../../queue/utils'
import type { AuthResource } from '../../resources/auth'
import type { UserTokenAuthData, UserTokenAuthResult } from './types'
import { buildStoreHelper } from '../redis'
import { AuthenticationWithUser } from '../../auth/method/types'
import days from 'dayjs'
import { MalformedError } from '../../routes/errors'

export const buildUserTokenAuth: WorkerHandlerWithCtx<UserTokenAuthData, UserTokenAuthResult> = ctx => ({
  tags: [DB_WORKER, FREQUENT_WORKER],

  queue: QUEUE_REMOTE_SYNC,

  name: 'user:token-auth',

  handler: async job => {
    try {      
      // console.log('start checking token')
      const { telegram, token } = job.data
      if (typeof token === 'string' && token.length > 512) {
        throw new MalformedError()
      }
      const authRes = ctx.db.resource<AuthResource<TokenAuthenticationMethod>>('auth')

      const store = buildStoreHelper(ctx)
      let auth: AuthenticationWithUser | null = await store.get('token:' + token) ?? null

      if (auth != null) {
        // console.log('got token from cache')
        // console.log('WE GOT AUTH', auth)
        return auth
      }

      const idRead = await authRes.service.extractSaltedId(token)
      if (telegram != null && idRead != null) {
        // console.log('store telegram info')
        await store.set(idRead[0], { tg: telegram }, 1800)
      }

      auth = await authRes.service.authenticateWithHash(AUTH_TYPE_TOKEN, token)
      if (auth == null && token != null) {
        try {
          // console.log('start authentication with salt')
          auth = await authRes.service.authenticateSalted(token)
        } catch {
        }
      }

      if (auth?.userId === AUTH_ANONYMOUS) {
        auth.user = [buildAnonymousUser(token)]
      }

      if (auth?.type === AUTH_TYPE_TOKEN) {
        // console.log('cache auth on token')
        // console.log('WE TRY TO STORE: ', auth)
        await store.set('token:' + token, auth, days(auth.expiredAt).diff(days(), 'seconds'))
      }
      // console.log('auth succeed')

      return auth
    } catch (e) {
      serializeError(e)
      throw e
    }
  },

  wait: makeWaitMethod(ctx, QUEUE_REMOTE_SYNC, 'user:token-auth')
})
