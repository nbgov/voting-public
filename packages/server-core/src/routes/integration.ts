import { constants as HTTP } from 'http2'
import {
  type IntegrationPayload, MemberRole, entitiesToIntegrationServiceAuthorization, INTEGRATION_OK, ServiceType
} from '@smartapps-poll/common'
// import { type IntegrationPayload, MemberRole, INTEGRATION_OK } from '@smartapps-poll/common'
import { AxiosError } from 'axios'
import type { RequestHandler, Request } from 'express'
import { IntegrationError, ProofspaceError } from '../model/errors'
import type { ServiceResource } from '../resources/service'
import { serviceAuthenticationRequest } from '../model/services/remote'
import { buildMembershipIntegrationRequest } from '../model/member/integration'
import { checkSchema, validationResult } from 'express-validator'
import { strValSchema } from './consts'
import { AuditOutcome, AuditStage } from '../model/audit/types'

export const integration = {
  /**
   * @queue ✅
   * @remote ✅
   * @vulnarability ✅
   */
  postToId: (async (req: Request<PostByIdRequestParams, string, IntegrationPayload>, res) => {
    try {
      validationResult(req).throw()
      const srvRes = req.context.db.resource<ServiceResource>('service')
      const service = await srvRes.get(req.params.id)

      if (service == null) {
        throw new IntegrationError('integration.service')
      }

      let role: MemberRole | undefined = undefined
      if (service.type == null || service.type === ServiceType.ONLINE) {
        const result = await serviceAuthenticationRequest(req.context).wait({
          url: service.apiUrl,
          payload: entitiesToIntegrationServiceAuthorization(req.body)
        })
        // const result = await axios.post<IntegrationResponse>(
        //   service.apiUrl, entitiesToIntegrationServiceAuthorization(req.body)
        // )
        if (result.status !== INTEGRATION_OK) {
          throw new IntegrationError('integration.failed')
        }
        role = result.role
      }

      let { member: memberData, organization } = req.body

      if (service.serviceId !== memberData.serviceId) {
        throw new IntegrationError('integration.missmatch')
      }

      if (organization != null && memberData.serviceId !== organization?.serviceId) {
        throw new IntegrationError('integration.missmatch')
      }

      const member = await buildMembershipIntegrationRequest(req.context).wait({
        member: req.body.member, organization: req.body.organization, token: req.body.token,
        service, user: req.user, role
      })
      res.send(member)
    } catch (e) {
      if (req.context.config.devMode) {
        console.error(e)
      }
      req.context.auditLogger.push(req as unknown as Request, {
        process: 'integration.check',
        stage: AuditStage.PROGRESS,
        outcome: AuditOutcome.RISK
      })
      if (e instanceof IntegrationError) {
        if (e.message === 'integration.notauthorized') {
          res.status(HTTP.HTTP_STATUS_UNAUTHORIZED)
        } else {
          res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
        }
      } else if (e instanceof AxiosError) {
        res.status(e.status ?? HTTP.HTTP_STATUS_FAILED_DEPENDENCY)
      } else if (e instanceof ProofspaceError) {
        res.status(HTTP.HTTP_STATUS_FAILED_DEPENDENCY)
      } else {
        res.status(HTTP.HTTP_STATUS_FORBIDDEN)
      }
      res.send()
    }
  }) as RequestHandler<PostByIdRequestParams>,

  postToIdBody: checkSchema({
    token: strValSchema(),
    "member.orgId": strValSchema(true),
    "member.name": strValSchema(),
    "member.externalId": strValSchema(),
    "member.serviceId": strValSchema(),
    "organization.externalId": strValSchema(true),
    "organization.serviceId": strValSchema(true),
  }, ['body']),

  postIdParams: checkSchema({ id: strValSchema() }, ['params'])
}

interface PostByIdRequestParams { id: string }