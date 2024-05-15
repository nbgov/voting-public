import type { IntegrationPayload, IntegrationService, MemberRole, User } from '@smartapps-poll/common'

export interface MembershipIntegrationRequest extends IntegrationPayload {
  service: IntegrationService
  user?: User
  role?: MemberRole
}
