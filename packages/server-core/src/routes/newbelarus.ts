import { constants as HTTP } from 'http2'
import { type DockActionRequest } from '@smartapps-poll/common'
import type { RequestHandler, Request } from 'express'
import { AuthError, NewBelarusError } from '../model/errors'
import { ProofError, ServiceError } from '../resources/errors'
import { buildNBStartHandler } from '../model/nb/start'
import { buildNBVerifyHandler } from '../model/nb/verify'
import { checkSchema, validationResult } from 'express-validator'
import { strValSchema } from './consts'
import { AuditOutcome, AuditStage } from '../model/audit/types'

export const newbelarusChallenge = {
  /**
   * @queue ✅
   * @frequent ✅
   */
  start: (async (req, res) => {
    const _req = req as unknown as Request
    try {
      validationResult(req).throw()
      req.context.auditLogger.nb(_req, 'start', AuditOutcome.UNKNOWN, AuditStage.INITIALIZATION)

      const result = await buildNBStartHandler(req.context).wait({ votingId: req.params.votingId })
      res.json(result)
      req.context.auditLogger.nb(_req, 'start', true)
    } catch (e) {
      req.context.auditLogger.nb(_req, 'start', AuditOutcome.ERROR)
      if (req.context.config.devMode) {
        console.error(e)
      }
      res.status(HTTP.HTTP_STATUS_BAD_REQUEST).send()
    }
  }) as RequestHandler<DockChallngeStartRequestParams, DockActionRequest[]>,

  startParams: checkSchema({ votingId: strValSchema() }, ['params']),

  /**
   * @queue ✅
   * @frequent ✅
   */
  verify: (async (req, res) => {
    const _req = req as unknown as Request
    try {
      validationResult(req).throw()
      req.context.auditLogger.nb(_req, 'verify', AuditOutcome.UNKNOWN, AuditStage.INITIALIZATION)

      if (req.user == null) {
        req.context.auditLogger.nb(_req, 'verify', AuditOutcome.ABUSE, AuditStage.INITIALIZATION)
        throw new AuthError()
      }
      await buildNBVerifyHandler(req.context).wait({ 
        user: req.user, body: req.body, votingId: req.params.votingId, 
        ip: req.ip ?? req.header('x-forwarded-for') ?? '' 
      })

      res.send()
      req.context.auditLogger.nb(_req, 'verify', true)
    } catch (e) {
      if (req.context.config.devMode) {
        console.error(e)
      }
      if (e instanceof AuthError) {
        res.status(HTTP.HTTP_STATUS_FORBIDDEN)
        req.context.auditLogger.nb(_req, 'verify', AuditOutcome.ABUSE)
      } else if (e instanceof ProofError) {
        res.status(HTTP.HTTP_STATUS_EXPECTATION_FAILED).json({ message: e.message })
        req.context.auditLogger.nb(_req, 'verify', AuditOutcome.ABUSE)
      } else if (e instanceof ServiceError) {
        res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
        req.context.auditLogger.nb(_req, 'verify', AuditOutcome.ERROR)
      } else if (e instanceof NewBelarusError) {
        res.status(HTTP.HTTP_STATUS_UNAUTHORIZED).json({ message: e.message })
        req.context.auditLogger.nb(_req, 'verify', AuditOutcome.ABUSE)
      } else {
        res.status(HTTP.HTTP_STATUS_INTERNAL_SERVER_ERROR)
        req.context.auditLogger.nb(_req, 'verify', req.context.config.earlyFailure ? AuditOutcome.ABUSE : AuditOutcome.ERROR)
      }
      res.send()
    }
  }) as RequestHandler<DockChallengeVerifyRequestParams, {}, Record<string, unknown>[]>,

  verifyParams: checkSchema({ votingId: strValSchema() }, ['params']),
}

interface DockChallngeStartRequestParams {
  votingId: string
}

interface DockChallengeVerifyRequestParams {
  votingId: string
}
