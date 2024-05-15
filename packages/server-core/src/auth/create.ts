import type { Context } from '../types'
import type { Authentication } from './types'
import type { User } from '@smartapps-poll/common'

import { castPaylod } from './method/proofspace/utils'
import { constants as HTTP } from 'http2'
import { Authenticator } from 'passport'
import { AUTH_TOKEN, createStrategy as createTokenStrategy } from './method/token'
import { AUTH_PS_SIG, createStrategy as createPsJwtStartegy } from './method/ps-sig'
import { makeUserModel } from '../model/user'
import { AUTH_PICKUP_KEY } from './method/types'
import { buildAuthCleanUpHandler } from '../model/user/clenup'

export const createAuth = (context: Context): Authentication => {
  const auth = new Authenticator()
  const cleanUp = buildAuthCleanUpHandler(context)
  if (cleanUp.repeat != null) {
    void cleanUp.repeat()
  }

  auth.use(AUTH_TOKEN, createTokenStrategy(context))
  auth.use(AUTH_PS_SIG, createPsJwtStartegy(context))

  const _auth: Authentication = {
    plugin: () => _ => auth.initialize(),

    ensure: (code, optional) =>
      [auth.authenticate(AUTH_TOKEN, { session: false, optional, failWithError: true } as any), (req, res, next) => {
        // console.log('ensure authentication is ok')
        if (req.isAuthenticated()) {
          next()
        } else {
          res.status(code ?? HTTP.HTTP_STATUS_FORBIDDEN).send()
        }
      }],

    pass: (optional) => auth.authenticate(AUTH_TOKEN, { session: false, optional } as any),

    auth: method => {
      switch (method) {
        case AUTH_PS_SIG:
          return [
            auth.authenticate(AUTH_PS_SIG, { session: false }), (req, res) => {
              if (req.isAuthenticated()) {
                res.json(castPaylod(req.user))
              } else {
                res.json({ ok: false, error: { message: 'auth.failed' } })
              }
            }
          ]
        case AUTH_TOKEN:
        default:
          return [auth.authenticate(AUTH_TOKEN, { session: false }), (req, res) => {
            if (req.isAuthenticated()) {
              res.json(req.user)
            } else {
              res.status(HTTP.HTTP_STATUS_BAD_REQUEST).send()
            }
          }]
      }
    },

    /**
     * @shared
     */
    pickUp: () => {
      return [..._auth.ensure(HTTP.HTTP_STATUS_NO_CONTENT, true), async (req, res) => {
        const userModel = makeUserModel(context, req.user as User)
        const pickup = await userModel.takeForUser(AUTH_PICKUP_KEY)
        res.json({ pickup })
      }]
    }
  }

  return _auth
}
