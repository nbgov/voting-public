import { constants as HTTP } from 'http2'
import type { RequestHandler } from 'express'
import { buildStoreHelper } from '../model/redis'
import { AuditInfo, AuditInfoParams, buildAuditInfoHandler } from '../model/audit/info'
import { strValSchema } from './consts'
import { AUDIT_CACHE } from '../model/audit/cache'
import { checkSchema, validationResult } from 'express-validator'
import { MalformedError } from './errors'

export const audit = {
  info: (async (req, res) => {
    try {
      validationResult(req).throw()
      const store = buildStoreHelper(req.context)
      const key = { method: 'audit.info', id: req.params.id }
      const cache = await store.load<AuditInfo>(key)
      if (cache != null) {
        res.json(cache)
        return
      }

      const audit = await buildAuditInfoHandler(req.context).wait({ id: req.params.id })
      await store.save(key, audit, [AUDIT_CACHE], 10)

      res.json(audit)
    } catch (e) {
      console.error(e)
      if (e instanceof MalformedError) {
        res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
      } else {
        res.status(HTTP.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      }
      res.send()
    }
  }) as RequestHandler<AuditInfoParams, AuditInfo>,

  infoParams: checkSchema({ id: strValSchema(false, 256) }, ['params'])
}
