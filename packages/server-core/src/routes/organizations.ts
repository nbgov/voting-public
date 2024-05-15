import { constants as HTTP } from 'http2'
import { type Organization } from '@smartapps-poll/common'
import { type RequestHandler } from 'express'
import { MalformedError } from './errors'
import { type OrgResource } from '../resources/organization'
import { buildStoreHelper } from '../model/redis'
import { checkSchema, validationResult } from 'express-validator'
import { strValSchema } from './consts'

export const organizations = {
  /**
   * @cache ✅
   */
  load: (async (req, res) => {
    try {
      validationResult(req).throw()
      
      const store = buildStoreHelper(req.context)
      const cache = await store.load<Organization>(req.params)
      if (cache != null) {
        res.json(cache)
        return
      }
      if (req.params.service == null) {
        throw new MalformedError('malformed.service.id')
      }
      if (req.params.id == null) {
        throw new MalformedError('malformed.org.id')
      }
      const orgRes: OrgResource = req.context.db.resource('org')
      const org = await orgRes.service.load(req.params.service, req.params.id)
      if (org == null) {
        throw new MalformedError('missed.org')
      }

      await store.save(req.params, org)

      res.json(org)
    } catch (e) {
      console.error(e)
      if (e instanceof MalformedError) {
        res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
      } else {
        res.status(HTTP.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      }
      res.send()
    }
  }) as RequestHandler<OrgParams, Organization>,

  loadParams: checkSchema({
    service: strValSchema(true, 256),
    id: strValSchema(true, 256)
  }, ['params'])
}

interface OrgParams {
  service?: string
  id?: string
}
