import type { MemberData, MemberRole, OrganizationData, OrgInfo } from '../organization/types'

export interface IntegrationParams {
  serviceId: string
  authorization: IntegrationAuthorization
  org?: OrgInfo
}

export interface IntegrationAuthorization {
  orgId?: string
  userId: string
  userToken: string
}

export interface IntegrationPayload {
  token: string
  member: MemberData
  organization?: OrganizationData
}

export interface IntegrationResponse {
  status: string
  role: MemberRole
}

export interface IntegrationService {
  _id: string
  serviceId: string
  name: string
  description?: string
  logoUrl?: string
  apiUrl: string
  type?: ServiceType
  createdAt: Date
}

export enum ServiceType {
  ONLINE = 'online',
  OFFLINE = 'offline'
}


export const DEFAULT_MEMBER_NAME = 'voter'

export const INTEGRATION_OK = 'Ok'
