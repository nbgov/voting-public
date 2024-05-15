
export interface Organization extends OrganizationData {
  _id: string
  active: boolean
  createdAt: Date
}

export interface OrganizationData extends OrgInfo {
  externalId: string
  serviceId: string
}

export interface OrgInfo {
  name: string
  shortDescr?: string
  logoUrl?: string
}

export interface Member extends MemberData {
  _id: string
  userId: string
  active: boolean
  role?: MemberRole
  createdAt: Date
}

export interface MemberData {
  orgId?: string
  name: string
  externalId: string
  serviceId: string
}

export interface MemberOfOrganization {
  _id: string
  serviceId: string
  orgId: string
  memberId: string
  role: string
  createdAt: Date
}

export enum MemberRole {
  MEMBER = 'member',
  MANAGER = 'manager'
}
