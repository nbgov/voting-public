import type { RequestHandler } from 'express'
import { MalformedError } from './errors'
import { processHttpError } from './utils'
import { decryptTelegramToken } from '../model/telegram/crypto'
import { checkSchema, validationResult } from 'express-validator'
import { strValSchema } from './consts'
import { buildTelegramPollAuthHandler } from '../model/telegram/poll'

export const telegram = {
  /**
   * @queue ⛔️ - actually queue isn't required here
   * @session ✅
   * @frequent ✅
   * @vulnarability ✅ huge encrypted token may overload the process
   */
  authenticate: (async (req, res) => {
    validationResult(req).throw()
    try {
      if (req.body.token == null && req.body.pin == null) {
        throw new MalformedError('malformed.request')
      }

      res.send(await decryptTelegramToken(req.context, { token: req.body.token! }))
    } catch (e) {
      processHttpError(e, res)
    }
  }) as RequestHandler<any, any, TokenRequest>,

  authenticateBody: checkSchema({
    pin: strValSchema(true),
    token: strValSchema(true)
  }),

  authenticatePoll: (async (req, res) => {
    validationResult(req).throw()
    try {
      res.send(await buildTelegramPollAuthHandler(req.context).wait(req.body))
    } catch (e) {
      processHttpError(e, res)
    }
  }) as RequestHandler<any, any, AuthPollRequest>,

  authenticatePollBody: checkSchema({
    token: strValSchema(),
    poll: strValSchema(),
  })
}

interface TokenRequest {
  token?: string
  pin?: string
}

interface AuthPollRequest {
  token: string
  poll: string
}
