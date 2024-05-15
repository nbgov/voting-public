import { type User, type Member, type MemberOfOrganization, type MemberRole } from '@smartapps-poll/common'
import { createResourceBuilder } from '../db/resource'
import type { Resource, ResourceServiceBuilder } from '../db/types'
import type { Context } from '../types'
import { type OrgMemberResource } from './org-member'

export const createMemberResource = (ctx: Context): Resource =>
  createResourceBuilder('member', ctx)
    .schema({
      bsonType: 'object',
      title: 'Member',
      required: ['name', 'active', 'userId', 'createdAt', 'serviceId', 'externalId'],
      properties: {
        _id: {
          bsonType: 'string'
        },
        active: {
          bsonType: 'bool',
          description: 'Is organization active'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Time of organization creation'
        },
        name: {
          bsonType: 'string',
          description: 'Organization title'
        },
        externalId: {
          bsonType: 'string',
          description: 'Id of the user from the integrated system'
        },
        userId: {
          bsonType: 'string',
          description: 'Id of the user from the voting system'
        },
        serviceId: {
          bsonType: 'string',
          description: 'Id of external service that the organization is linked to - it can be a human readable alias'
        }
      }
    })
    .index('serviceId', { serviceId: 1 })
    .index('userId', { userId: 1 })
    .index('serviceExternalId', { serviceId: 1, externalId: 1 }, { unique: true })
    .resourceService(buildMemberResourceService)
    .create(data => ({
      createdAt: new Date(), active: data.active !== undefined ? data.active : true
    })).build()

export interface MemberResourceService extends Record<string, unknown> {
  load: (serviceId: string, orgId?: string, id?: string) => Promise<NormalizedMember | undefined>
  loadLinked: (user: User, serviceId: string, orgId?: string) => Promise<NormalizedMember | undefined>
  authorize: (user: User, serviceId: string, orgId: string, memberId?: string) => Promise<Member | undefined>
  denormalize: (member: Member | NormalizedMember) => Member
}

export const buildMemberResourceService: ResourceServiceBuilder = (res, ctx) => {
  const _res: MemberResource = res as unknown as MemberResource
  const _service: MemberResourceService = {
    load: async (serviceId, orgId, id) => {
      const memCol = await _res.collection()
      const orgMember = ctx.db.resource<OrgMemberResource>('org.member')
      const memCursor = memCol.aggregate<NormalizedMember>([
        { $match: { serviceId: _res.str(serviceId), externalId: _res.str(id) } },
        {
          $lookup: {
            from: orgMember.collectionName(),
            localField: 'memberId',
            foreignField: 'externalId',
            pipeline: [{
              $match: {
                serviceId: _res.str(serviceId),
                orgId: _res.str(orgId),
                memberId: _res.str(id)
              }
            }],
            as: 'org'
          }
        }
      ])

      return await memCursor.next() ?? undefined
    },

    loadLinked: async (user, serviceId, orgId) => {
      const memCol = await _res.collection()
      const orgMember = ctx.db.resource<OrgMemberResource>('org.member')
      const memCursor = memCol.aggregate<NormalizedMember>([
        { $match: { serviceId: _res.str(serviceId), userId: _res.str(user._id) } },
        {
          $lookup: {
            from: orgMember.collectionName(),
            let: { memberId: '$externalId' },
            localField: 'memberId',
            foreignField: 'externalId',
            pipeline: [{
              $match: {
                serviceId: _res.str(serviceId),
                orgId: _res.str(orgId),
                $expr: { $eq: ['$memberId', '$$memberId'] }
              }
            }],
            as: 'org'
          }
        }
      ])

      return await memCursor.next() ?? undefined
    },

    denormalize: member => {
      member = { ...member }
      if ('org' in member) {
        if (member.org != null && member.org[0] != null) { // eslint-disable-line
          member.orgId = member.org[0].orgId
          member.role = member.org[0].role as MemberRole
        }
        delete (member as { org?: any }).org
      }

      return member
    },

    authorize: async (user, serviceId, orgId, memberId) => {
      const member = memberId == null
        ? await _service.loadLinked(user, serviceId, orgId)
        : await _service.load(serviceId, orgId, memberId)
      if (member == null) {
        return undefined
      }
      if (member?.userId === user._id) {
        return _service.denormalize(member)
      }
    }
  }

  return _service as unknown as Record<string, unknown>
}

export interface MemberResource extends Resource<NormalizedMember | Member, MemberResourceService> { }

export interface NormalizedMember extends Member {
  org: MemberOfOrganization[]
}
