import { constants as HTTP } from 'http2'
import { fillPagination, type Listed, type NewPoll, type Pager, type Poll, type PollInfo, PollStatus, type RequiredProof, type User, VOCDONI_CENSUS_OFFCHAIN } from '@smartapps-poll/common'
import { type Request, type RequestHandler } from 'express'
import { type MemberResource } from '../resources/member'
import { IntegrationError } from '../model/errors'
import { AuhtorizationError, MalformedError } from './errors'
import { PollAuthorization, type PollResource } from '../resources/poll'
import { PollManagerError } from '../resources/errors'
import { buildProofMeta } from '../model/proof'
import { buildStoreHelper } from '../model/redis'
import { POLLS_CACHE } from '../model/poll/cache'
import { checkSchema, validationResult } from 'express-validator'
import { strValSchema } from './consts'

export const polls = {
  /**
   * @admin
   * @queue
   */
  create: (async (req: Request<PollsParams, Poll, NewPoll>, res) => {
    try {
      const memRes: MemberResource = req.context.db.resource('member')
      const poll = req.body
      if (poll.serviceId == null || poll.orgId == null || poll.managerId == null) {
        throw new IntegrationError('integration.unknown')
      }
      const member = await memRes.service.authorize(req.user as User, poll.serviceId, poll.orgId, poll.managerId)
      if (member == null) {
        throw new AuhtorizationError()
      }
      const newPoll = { ...poll }
      delete newPoll.managerId

      const pollRes: PollResource = req.context.db.resource('poll')

      newPoll.requiredProofs = (await Promise.all(
        newPoll.requiredProofs?.map(async proof => await buildProofMeta(
          req.context, proof, newPoll.census?.type ?? VOCDONI_CENSUS_OFFCHAIN
        )) ?? []
      )).filter(proof => proof != null) as RequiredProof[]

      const result = await pollRes.service.create(newPoll, member)

      const store = buildStoreHelper(req.context)
      await store.clean(POLLS_CACHE, true)

      res.json(result)
    } catch (e) {
      console.error(e)
      if (e instanceof PollManagerError) {
        res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
      } else if (e instanceof IntegrationError) {
        res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
      } else if (e instanceof AuhtorizationError) {
        res.status(HTTP.HTTP_STATUS_UNAUTHORIZED)
      } else {
        res.status(HTTP.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      }
      res.send()
    }
  }) as RequestHandler,

  /**
   * @cache ✅
   */
  list: (async (req, res) => {
    try {
      validationResult(req).throw()
      req.context.auditLogger.view(req as Request, 'poll.list')
      const serviceId = req.params.service
      const orgId = req.params.org
      const strategy = req.query.strategy
      const store = buildStoreHelper(req.context)
      const key = { params: req.params, query: req.query, method: 'poll.list' }
      const cache = await store.load<Listed<Poll>>(key)
      if (cache != null) {
        res.json(cache)
        return
      }

      const pager = fillPagination(req.query)
      const pollRes: PollResource = req.context.db.resource('poll')
      const result = {
        pager,
        list: (await pollRes.service.list(pager, undefined, serviceId, orgId, strategy)).map(
          poll => {
            const result: Partial<Poll> = { ...poll }
            delete result.managerId
            delete result.census
            return result
          }
        )
      } as Listed<Poll>

      await store.save(key, result, [POLLS_CACHE])
      res.json(result)
    } catch (e) {
      console.error(e)
      if (e instanceof Error) {
        res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
      } else {
        res.status(HTTP.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      }
      res.send()
    }
  }) as RequestHandler<PollListParams, Listed<Poll>, undefined, PollListQuery>,


  listParams: checkSchema({
    service: strValSchema(true, 256),
    org: strValSchema(true, 256)
  }, ['params']),

  listQuery: checkSchema({
    strategy: strValSchema(true, 64),
    page: strValSchema(true, 64),
    size: strValSchema(true, 64),
    total: strValSchema(true, 64),
  }, ['query']),

  /**
   * @cache ✅
   */
  listAll: (async (req, res) => {
    try {
      validationResult(req).throw()
      req.context.auditLogger.view(req as Request, 'poll.list-all')
      const serviceId = req.params.service
      const orgId = req.params.org

      const store = buildStoreHelper(req.context)
      const key = { params: req.params, query: req.query, method: 'poll.list.all' }
      const cache = await store.load<Listed<Poll>>(key)
      if (cache != null) {
        res.json(cache)
        return
      }

      const pager = fillPagination(req.query)
      const strategy = req.query.strategy

      const pollRes: PollResource = req.context.db.resource('poll')
      const result = {
        pager,
        list: (await pollRes.service.list(pager, [
          PollStatus.FINISHED, PollStatus.PAUSED, PollStatus.STARTED, PollStatus.PUBLISHED
        ], serviceId, orgId, strategy)).map(
          poll => {
            const result: Partial<Poll> = { ...poll }
            delete result.managerId
            delete result.census
            return result
          }
        )
      } as Listed<Poll>

      await store.save(key, result, [POLLS_CACHE])

      res.json(result)
    } catch (e) {
      console.error(e)
      if (e instanceof Error) {
        res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
      } else {
        res.status(HTTP.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      }
      res.send()
    }
  }) as RequestHandler<PollListParams, Listed<Poll>, undefined, PollListQuery>,

  /**
   * @cache ✅
   */
  load: (async (req, res) => {
    try {
      validationResult(req).throw()
      req.context.auditLogger.view(req as Request, 'poll.load')

      if (req.params.id == null) {
        throw new MalformedError('malformed.poll.id')
      }

      const store = buildStoreHelper(req.context)
      const key = { id: req.params.id, method: 'poll' }
      if (req.query.manager !== 'true') {
        const cache = await store.load<PollInfo>(key)
        if (cache != null) {
          res.json(cache)
          return
        }
      }

      const pollRes: PollResource = req.context.db.resource('poll')
      const poll = await pollRes.get(req.params.id)
      if (poll == null) {
        throw new MalformedError('missed.poll')
      }
      const presentation = await pollRes.service.authorize(
        poll, req.user, req.query.manager === 'true' ? PollAuthorization.MANAGEMENT : PollAuthorization.PUBLIC
      )

      if (poll.census.token == null && (poll as PollInfo).manager == null) {
        await store.save(key, presentation, [POLLS_CACHE])
      }

      res.json(presentation)
    } catch (e) {
      console.error(e)
      if (e instanceof MalformedError) {
        res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
      } else if (e instanceof PollManagerError) {
        res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
      } else if (e instanceof IntegrationError) {
        res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
      } else if (e instanceof AuhtorizationError) {
        res.status(HTTP.HTTP_STATUS_UNAUTHORIZED)
      } else {
        res.status(HTTP.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      }
      res.send()
    }
  }) as RequestHandler<PollsParams, PollInfo, any, { manager?: string }>,

  loadParams: checkSchema({ id: strValSchema(true) }, ['params']),

  loadQuery: checkSchema({ manager: strValSchema(true, 4) }, ['query']),

  /**
   * @admin
   * @queue
   */
  delete: (async (req: Request<PollsParams>, res) => {
    try {
      if (req.params.id == null) {
        throw new MalformedError('malformed.poll.id')
      }
      if (req.user == null) {
        throw new AuhtorizationError('update.guest')
      }

      const memRes: MemberResource = req.context.db.resource('member')
      const pollRes: PollResource = req.context.db.resource('poll')
      const poll = await pollRes.get(req.params.id)
      if (poll == null) {
        throw new MalformedError('missed.poll')
      }
      const member = await memRes.service.authorize(req.user, poll.serviceId, poll.orgId)
      if (member == null) {
        throw new AuhtorizationError('member.unauthorized')
      }
      const presentation = await pollRes.service.authorize(poll, req.user, PollAuthorization.MANAGEMENT)
      if (presentation.manager == null) {
        throw new AuhtorizationError('poll.manager.unauthorized')
      }

      const deleted = await pollRes.service.delete(presentation, member)

      const store = buildStoreHelper(req.context)
      await store.clean(POLLS_CACHE, true)
      await store.clean({ id: req.params.id, method: 'poll' })

      res.json({ deleted })
    } catch (e) {
      console.error(e)
      if (e instanceof MalformedError) {
        res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
      } else if (e instanceof PollManagerError) {
        res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
      } else if (e instanceof IntegrationError) {
        res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
      } else if (e instanceof AuhtorizationError) {
        res.status(HTTP.HTTP_STATUS_UNAUTHORIZED)
      } else {
        res.status(HTTP.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      }
      res.send()
    }
  }) as RequestHandler,

  /**
   * @admin
   * @queue
   */
  update: (async (req: Request<PollsParams, PollInfo, Partial<Poll>>, res) => {
    try {
      if (req.params.id == null) {
        throw new MalformedError('malformed.poll.id')
      }
      if (req.user == null) {
        throw new AuhtorizationError('update.guest')
      }

      const memRes: MemberResource = req.context.db.resource('member')
      const pollRes: PollResource = req.context.db.resource('poll')
      const poll = await pollRes.get(req.params.id)
      if (poll == null) {
        throw new MalformedError('missed.poll')
      }
      const member = await memRes.service.authorize(req.user, poll.serviceId, poll.orgId)
      if (member == null) {
        throw new AuhtorizationError('member.unauthorized')
      }
      const presentation = await pollRes.service.authorize(poll, req.user, PollAuthorization.MANAGEMENT)
      if (presentation.manager == null) {
        throw new AuhtorizationError('poll.manager.unauthorized')
      }

      const updated = await pollRes.service.update(presentation, req.body, member, PollAuthorization.MANAGEMENT)

      const store = buildStoreHelper(req.context)
      await store.clean(POLLS_CACHE, true)
      await store.clean({ id: req.params.id, method: 'poll', manager: 'true' })
      await store.clean({ id: req.params.id, method: 'poll', manager: undefined })

      res.json(updated)
    } catch (e) {
      console.error(e)
      if (e instanceof MalformedError) {
        res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
      } else if (e instanceof PollManagerError) {
        res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
      } else if (e instanceof IntegrationError) {
        res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
      } else if (e instanceof AuhtorizationError) {
        res.status(HTTP.HTTP_STATUS_UNAUTHORIZED)
      } else {
        res.status(HTTP.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      }
      res.send()
    }
  }) as RequestHandler
}

interface PollsParams {
  id?: string
}

interface PollListParams {
  service?: string
  org?: string
}

interface PollListQuery extends Pager {
  strategy?: string
}
