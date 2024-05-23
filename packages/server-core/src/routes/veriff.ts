import { constants as HTTP } from 'http2'
import type { RequestHandler } from 'express'
import type { VeriffFinalDecision, VeriffInitResponse } from '@smartapps-poll/common'
import { buildVeriffInitHandler } from '../model/veriff/init'
import { AxiosError } from 'axios'
import { VeriffHookRequest } from '../model/veriff/types'
import { buildVeriffHookHandler } from '../model/veriff/hook'
import { verifyHookRequest } from '../model/veriff/utils'
import { AuthError, ERROR_EARLY_FAILURE, EarlyFailureError, VeriffError } from '../model/errors'
import { buildStoreHelper } from '../model/redis'
import { AuditOutcome, AuditStage } from '../model/audit/types'
import { checkSchema } from 'express-validator'
import { strValSchema } from './consts'

export const veriff = {
  init: (async (req, res) => {
    try {
      // @TODO add resource id validation
      req.context.auditLogger.webPass(req, 'init', AuditOutcome.UNKNOWN, AuditStage.INITIALIZATION)
      const response = await buildVeriffInitHandler(req.context).wait({ pollId: req.params.pollId })
      res.json(response)
      req.context.auditLogger.webPass(req, 'init', true)
    } catch (e) {
      if (req.context.config.devMode) {
        console.error(e)
      }
      if (e instanceof AxiosError) {
        res.status(HTTP.HTTP_STATUS_FAILED_DEPENDENCY)
        req.context.auditLogger.webPass(req, 'init', AuditOutcome.ERROR)
      } else {
        res.status(HTTP.HTTP_STATUS_INTERNAL_SERVER_ERROR)
        req.context.auditLogger.webPass(req, 'init')
      }
      res.send()
    }
  }) as RequestHandler<{ pollId: string }, VeriffInitResponse>,

  initParams: checkSchema({ pollId: strValSchema(false, 128) }, ['params']),

  hook: (async (req, res) => {
    try {
      if (!verifyHookRequest(req)) {
        throw new AuthError('veriff.signature')
      }
      req.context.auditLogger.webPass(req, 'hook', AuditOutcome.UNKNOWN, AuditStage.INITIALIZATION)
      const result = await buildVeriffHookHandler(req.context).wait(req.body)
      req.context.auditLogger.webPass(req, 'hook', result)
    } catch (e) {
      if (req.context.config.devMode) {
        console.error(e)
      }
      if (e instanceof AuthError) {
        req.context.auditLogger.webPass(req, 'hook', AuditOutcome.RISK)
        res.status(HTTP.HTTP_STATUS_UNAUTHORIZED)
      } else if (e instanceof VeriffError) {
        req.context.auditLogger.webPass(req, 'hook', AuditOutcome.ABUSE)
      } else {
        res.status(HTTP.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      }
    } finally {
      res.send()
    }
  }) as RequestHandler<{}, {}, VeriffHookRequest>,

  pickUp: (async (req, res) => {
    try {
      const token = req.header('Authorization') ?? ''
      const store = buildStoreHelper(req.context)
      const pickup = await store.pick<VeriffFinalDecision>('veriff-pickup:' + token)
      if (pickup != null) {
        if (pickup.status === ERROR_EARLY_FAILURE) {
          throw new EarlyFailureError()
        }
        res.send({ pickup })
        req.context.auditLogger.webPass(req, 'pickup', true)
        return
      }
      res.status(HTTP.HTTP_STATUS_NO_CONTENT)
      res.send()
    } catch (e) {
      if (req.context.config.devMode) {
        console.error(e)
      }
      if (e instanceof EarlyFailureError) {
        res.status(HTTP.HTTP_STATUS_INTERNAL_SERVER_ERROR)
        req.context.auditLogger.webPass(req, 'pickup', AuditOutcome.ABUSE)
      } else {
        res.status(HTTP.HTTP_STATUS_INTERNAL_SERVER_ERROR)
        req.context.auditLogger.webPass(req, 'pickup')
      }
      res.send()
    }
  }) as RequestHandler<{}, { pickup: VeriffFinalDecision }>
}
