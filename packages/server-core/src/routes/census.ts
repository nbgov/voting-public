import { constants as HTTP } from 'http2'
import { type RequestHandler } from 'express'
import { CensusRegistration } from '../model/errors'
import { AuhtorizationError, MalformedError } from './errors'
import { buildCensusRegisterHandler } from '../model/vocdoni/register'
import { buildCensusProofHandler } from '../model/vocdoni/proof'
import { checkSchema, validationResult } from 'express-validator'
import { strValSchema } from './consts'

export const census = {
  /**
   * @census list
   * @remote ✅
   */
  register: (async (req, res) => {
    try {
      validationResult(req).throw()
      const result = await buildCensusRegisterHandler(req.context).wait({ user: req.user, id: req.params.id })
      res.json(result)
    } catch (e) {
      console.error(e)
      if (e instanceof CensusRegistration) {
        res.status(HTTP.HTTP_STATUS_FORBIDDEN)
      } else if (e instanceof MalformedError) {
        res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
      } else if (e instanceof AuhtorizationError) {
        res.status(HTTP.HTTP_STATUS_UNAUTHORIZED)
      } else {
        res.status(HTTP.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      }
      res.send()
    }
  }) as RequestHandler<CensusParams, Registration>,

  /**
   * @census list
   * @remote ✅
   */
  proof: (async (req, res) => {
    try {
      validationResult(req).throw()
      const result = await buildCensusProofHandler(req.context).wait(
        { id: req.params.id, user: req.user, address: req.query.address }
      )
      if (result == null) {
        res.status(HTTP.HTTP_STATUS_NO_CONTENT).send()
      } else {
        res.json(result)
      }
    } catch (e) {
      console.error('error', e)
      if (e instanceof CensusRegistration) {
        res.status(HTTP.HTTP_STATUS_FORBIDDEN)
      } else if (e instanceof MalformedError) {
        res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
      } else if (e instanceof AuhtorizationError) {
        res.status(HTTP.HTTP_STATUS_UNAUTHORIZED)
      } else {
        res.status(HTTP.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      }
      res.send()
    }
  }) as RequestHandler<CensusParams, Registration, undefined, CensusCheckQuery>,

  censusParams: checkSchema({
    id: strValSchema(true, 256)
  }, ['params']),
  
  censusQuery: checkSchema({
    address: strValSchema(true, 256)
  }, ['params']),
}

interface CensusParams {
  id?: string
}

interface CensusCheckQuery {
  address?: string
}

interface Registration { // eslint-disable-line
}
