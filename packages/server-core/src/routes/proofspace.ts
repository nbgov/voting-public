import { constants as HTTP } from 'http2'
import { type KeystoreSubject, type PsHookRequest, type PsHookResponse, keystoreType, makeProofspaceNow } from '@smartapps-poll/common'
import { AxiosError } from 'axios'
import type { RequestHandler } from 'express'
import { makeUserModel } from '../model/user'
import { AuhtorizationError, SequenceError } from './errors'
import { REG_PICKUP_KEY } from '../auth/method/types'
import { buildSendToPsHandler } from '../auth/method/proofspace/utils'
import { checkSchema, validationResult } from 'express-validator'
import { strValSchema } from './consts'

export const proofspace = {
  /**
   * @remote ✅
   */
  sendWallet: (async (req, res) => {
    try {
      validationResult(req).throw()
      if (req.user == null) {
        throw new AuhtorizationError()
      }
      const userHelper = makeUserModel(req.context, req.user)
      const store = await userHelper.takeForUser(REG_PICKUP_KEY)
      if (store == null) {
        throw new SequenceError()
      }
      if (req.context.config.proofspace.pk == null) {
        throw new AuhtorizationError('pk.no')
      }
      const request: PsHookRequest = JSON.parse(store)

      const response: PsHookResponse = {
        serviceDid: request.publicServiceDid,
        subscriberConnectDid: request.subscriberConnectDid,
        subscriberEventId: request.actionEventId,
        credentials: [{
          ...req.context.config.proofspace.keystoreCred,
          fields: [
            { name: keystoreType.store, value: req.body.store },
            { name: keystoreType.address, value: req.body.address },
            { name: keystoreType.issuedAt, value: `${makeProofspaceNow()}` }
          ],
          utcIssuedAt: new Date().getTime(),
          revoked: false
        }],
        revokedCredentials: [],
        ok: true
      }

      await buildSendToPsHandler(req.context).wait(response)

      res.json({ ok: true })
    } catch (e) {
      if (req.context.config.devMode) {
        console.error(e)
      }
      if (e instanceof AuhtorizationError) {
        res.status(HTTP.HTTP_STATUS_UNAUTHORIZED)
      } else if (e instanceof AxiosError) {
        res.status(e.status ?? HTTP.HTTP_STATUS_FAILED_DEPENDENCY)
      } else if (e instanceof SequenceError) {
        res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
      } else {
        res.status(HTTP.HTTP_STATUS_FORBIDDEN)
      }
      res.send()
    }
  }) as RequestHandler<any, any, KeystoreSubject>,

  sendWalletBody: checkSchema({
    store: strValSchema(false, 2048),
    address: strValSchema()
  }, ['body'])
}
