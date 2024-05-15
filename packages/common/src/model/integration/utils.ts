import { MemberRole } from '../organization'
import type { IntegrationParams, IntegrationPayload, IntegrationAuthorization } from './types'
import { DEFAULT_MEMBER_NAME } from './types'

export const integrationParamsToEntities = (config: IntegrationParams, name?: string): IntegrationPayload => {
  const _payload: IntegrationPayload = {
    token: config.authorization.userToken,
    member: {
      name: name ?? (config.org?.name !== undefined
        ? `${DEFAULT_MEMBER_NAME}}:${config.org?.name}`
        : DEFAULT_MEMBER_NAME),
      serviceId: config.serviceId,
      orgId: config.authorization.orgId,
      externalId: config.authorization.userId
    },
    ...(config.authorization.orgId != null && config.org != null
      ? {
          organization: {
            externalId: config.authorization.orgId,
            serviceId: config.serviceId,
            ...config.org
          }
        }
      : {})
  }

  return _payload
}

export const entitiesToIntegrationServiceAuthorization = (payload: IntegrationPayload): IntegrationAuthorization => {
  return {
    orgId: payload.organization?.externalId,
    userId: payload.member.externalId,
    userToken: payload.token
  }
}

export const checkRole = (role: MemberRole | undefined, need: MemberRole): boolean =>
  need === MemberRole.MANAGER ? role === need : true
