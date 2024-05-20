import { constants as HTTP } from 'http2'
import { PollError, PollReadyError } from '@smartapps-poll/common'
import type { RequestHandler, Request } from 'express'
import { buildVocdoniStepHandler } from '../model/vocdoni/step'
import { buildVocdoniSignHandler } from '../model/vocdoni/sign'
import { checkSchema, validationResult } from 'express-validator'
import { strValSchema } from './consts'
import { AuditOutcome, AuditStage } from '../model/audit/types'

export const vocdoniCsp = {
  info: (async (_, res) => {
    res.json({
      title: 'New Belarus CSP Service',
      authType: 'auth',
      signatureType: ['ecdsa'],
      authSteps: [{ title: 'Receive pre-authorized signature', type: 'text' }]
    })
  }) as RequestHandler,

  infoBlind: (async (_, res) => {
    res.json({
      title: 'New Belarus CSP Service',
      authType: 'auth',
      signatureType: ['blind', 'ecdsa'],
      authSteps: [{ title: 'Receive blind signature token', type: 'text' }]
    })
  }) as RequestHandler,

  /**
   * @censsu csp
   * @queue ✅
   * @frequent ✅
   */
  step: (async (req, res) => {
    const _req = req as unknown as Request
    try {
      validationResult(req).throw()
      req.context.auditLogger.vocdoni(_req, 'step', AuditOutcome.UNKNOWN, AuditStage.INITIALIZATION)

      const result = await buildVocdoniStepHandler(req.context).wait({
        votingId: req.params.votingId, user: req.user, authType: req.params.authType,
        step: req.params.step, authData: req.body.authData
      })
      res.json(result)
      req.context.auditLogger.vocdoni(_req, 'step', true)
    } catch (e) {
      if (req.context.config.devMode) {
        console.error(e)
      }
      if (e instanceof PollReadyError) {
        res.status(HTTP.HTTP_STATUS_UNAUTHORIZED)
        req.context.auditLogger.vocdoni(_req, 'step', AuditOutcome.ABUSE)
      } else if (e instanceof PollError) {
        res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
        req.context.auditLogger.vocdoni(_req, 'step', AuditOutcome.ABUSE)
      } else {
        res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
        req.context.auditLogger.vocdoni(_req, 'step', AuditOutcome.ERROR)
      }
      res.send()
    }
  }) as RequestHandler<VocdoniSignatureRequestParams, VocdoniSignatureResponseBody, VocdoniSignatureRequestBody>,

  stepParams: checkSchema({
    votingId: strValSchema(),
    authType: strValSchema(false, 64),
    step: strValSchema(true, 32)
  }, ['params']),

  stepBody: checkSchema({ "*.payload": strValSchema(true, 1024) }, ['body']),

  /**
   * @censsu csp
   * @queue ✅
   * @frequent ✅
   */
  sign: (async (req, res) => {
    const _req = req as unknown as Request
    try {
      validationResult(req).throw()
      req.context.auditLogger.vocdoni(_req, 'sign', AuditOutcome.UNKNOWN, AuditStage.INITIALIZATION)

      const result = await buildVocdoniSignHandler(req.context).wait({
        votingId: req.params.votingId, user: req.user, authType: req.params.authType,
        token: req.body.token, payload: req.body.payload
      })
      res.json(result)
      req.context.auditLogger.vocdoni(_req, 'sign', true)
    } catch (e) {
      if (req.context.config.devMode) {
        console.error(e)
      }
      if (e instanceof PollReadyError) {
        res.status(HTTP.HTTP_STATUS_UNAUTHORIZED)
        req.context.auditLogger.vocdoni(_req, 'step', AuditOutcome.ABUSE)
      } else if (e instanceof PollError) {
        res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
        req.context.auditLogger.vocdoni(_req, 'step', AuditOutcome.ABUSE)
      } else {
        res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
        req.context.auditLogger.vocdoni(_req, 'step', AuditOutcome.ERROR)
      }
      res.send()
    }
  }) as RequestHandler<VocdoniSignatureRequestParams, VocdoniSignatureResponseBody, VocdoniSignatureBody>,

  signParams: checkSchema({
    votingId: strValSchema(),
    authType: strValSchema(false, 64),
  }, ['params']),

  signBody: checkSchema({
    token: strValSchema(),
    payload: strValSchema(false, 1024)
  }, ['body']),
}

interface VocdoniSignatureRequestParams {
  votingId: string
  authType: string
  step?: string
}

interface VocdoniSignatureRequestBody {
  authData: Array<{ payload: string } | string>
}

interface VocdoniSignatureBody {
  payload: string
  token: string
}

type VocdoniSignatureResponseBody = {
  signature: string
} | {
  token: string
}
