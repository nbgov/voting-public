import { type IntegrationParams, MemberRole } from '@smartapps-poll/common'
import { IntegrationError } from './errors'
import type { Integration } from './types'

export const buildIntegration = (params: IntegrationParams): Integration => {
  const _int: Integration = {
    params,
    role: MemberRole.MEMBER,

    authenticate: async member => {
      if (member.role != null) {
        _int.role = member.role
      } else {
        throw new IntegrationError('integration.role')
      }
    }
  }

  return _int
}
