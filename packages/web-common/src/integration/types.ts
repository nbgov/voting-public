import { type MemberRole, type IntegrationParams, type Member } from '@smartapps-poll/common'

export interface Integration {
  params: IntegrationParams
  role: MemberRole

  authenticate: (member: Member) => Promise<void>
}
