
import type { AuthenticationMethod } from '@smartapps-poll/common'
import type { Context } from '../../types'
import Strategy from 'passport-auth-token'
import { buildUserTokenAuth } from '../../model/user/auth'
import { checkSchema, validationResult } from 'express-validator'
import { strValSchema } from '../../routes/consts'

export const createStrategy = (context: Context): Strategy => new Strategy({
  session: false,
  optional: false,
  params: true,
  passReqToCallback: true,
  headerFields: ['Authorization', 'authorization'],
  tokenFields: ['authToken', 'token']
}, (req, token, done): void => {
  /**
   * @queue ✅ 
   * @frequent ✅
   * @session ✅
   */
  void (async () => {
    try {
      const result = checkSchema({ telegram: strValSchema(true, 128, 1024) }, ['headers']).run(req)
      validationResult(result).throw()

      const auth = await buildUserTokenAuth(context).wait({ token, telegram: req.headers.telegram as string })
      // console.log('auth successfull', auth)
      if (auth?.user[0] == null || !auth.user[0].active) {
        done(null, false)
      } else {
        done(null, auth.user[0])
      }
    } catch (e) {
      done(e)
    }
  })()
})

export type SaltedAuthenticationMethod = AuthenticationMethod<undefined> & {
  type: 'salted'
}

export const AUTH_TOKEN = 'token'

export const SALTED_AUTH_TYPE = 'salted'
