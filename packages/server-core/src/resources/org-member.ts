import { type MemberOfOrganization, MemberRole } from '@smartapps-poll/common'
import { createResourceBuilder } from '../db/resource'
import type { Resource, ResourceServiceBuilder } from '../db/types'
import type { Context } from '../types'

export const createOrgMemberResource = (ctx: Context): Resource => createResourceBuilder('org.member', ctx)
  .name('org_member')
  .schema({
    bsonType: 'object',
    title: 'Member',
    required: ['serviceId', 'orgId', 'memberId', 'createdAt'],
    properties: {
      _id: {
        bsonType: 'string'
      },
      serviceId: {
        bsonType: 'string',
        description: 'Id of external service that the organization and member belong to'
      },
      orgId: {
        bsonType: 'string',
        description: 'Id of the organization from the external service'
      },
      role: {
        enum: [MemberRole.MEMBER, MemberRole.MANAGER],
        description: 'Role that is performed by the memember'
      },
      memberId: {
        bsonType: 'string',
        description: 'Id of the member from the external service'
      },
      createdAt: {
        bsonType: 'date',
        description: 'Time of interpolation creation'
      }
    }
  })
  .index('serviceOrgId', { serviceId: 1, orgId: 1 })
  .index('serviceMemberId', { serviceId: 1, memberId: 1 })
  .index('exactMemberId', { serviceId: 1, memberId: 1, orgId: 1 }, { unique: true })
  .resourceService(buildOrgMemberResourceService)
  .create(_ => ({ createdAt: new Date() }))
  .build()

export interface OrgMemberResourceService extends Record<string, unknown> {
  load: (serviceId: string, orgId: string, memberId: string) => Promise<MemberOfOrganization | undefined>
}

export const buildOrgMemberResourceService: ResourceServiceBuilder = (res, _ctx) => {
  const _res: OrgMemberResource = res as unknown as OrgMemberResource
  const _service: OrgMemberResourceService = {
    load: async (serviceId, orgId, memberId) => {
      const col = await _res.collection()
      return await col.findOne({
        serviceId: _res.str(serviceId),
        orgId: _res.str(orgId),
        memberId: _res.str(memberId)
      }) ?? undefined
    }
  }

  return _service
}

export interface OrgMemberResource extends Resource<MemberOfOrganization, OrgMemberResourceService> { }
