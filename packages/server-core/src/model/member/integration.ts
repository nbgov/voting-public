import { DB_WORKER, QUEUE_REMOTE_SYNC, SERVICES_WORKER } from '../../queue/consts'
import type { WorkerHandlerWithCtx } from '../../queue/types'
import { ServiceType, type Member, MemberRole } from '@smartapps-poll/common'
import type { MembershipIntegrationRequest } from './types'
import { IntegrationError } from '../errors'
import type { MemberResource, NormalizedMember } from '../../resources/member'
import type { OrgMemberResource } from '../../resources/org-member'
import type { OrgResource } from '../../resources/organization'
import { makeWaitMethod, serializeError } from '../../queue/utils'

export const buildMembershipIntegrationRequest: WorkerHandlerWithCtx<MembershipIntegrationRequest, Member> = ctx => ({
  tags: [DB_WORKER, SERVICES_WORKER],

  queue: QUEUE_REMOTE_SYNC,

  name: 'membership:integration',

  handler: async job => {
    const { service, member: memberData, user, role } = job.data
    let { organization } = job.data
    try {
      const memRes = ctx.db.resource<MemberResource>('member')
      const mem = await memRes.service.load(memberData.serviceId, memberData.orgId, memberData.externalId)
      if (mem == null && service.type === ServiceType.OFFLINE) {
        throw new IntegrationError('integration.unautorized.offline')
      }
      if (mem != null && mem.userId !== user?._id) {
        throw new IntegrationError('integration.unautorized')
      }
      let member = mem ?? await memRes.put({
        name: memberData.name,
        externalId: memberData.externalId,
        serviceId: memberData.serviceId,
        userId: user?._id
      })

      const m2oRes = ctx.db.resource<OrgMemberResource>('org.member')
      if (mem?.org[0] != null) {
        member = memRes.service.denormalize(mem) as NormalizedMember
        if (member.role !== role && service.type !== ServiceType.OFFLINE) {
          mem.org[0] = await m2oRes.put({ ...mem.org[0], role })
        }
      } else {
        member.orgId = organization?.externalId
      }
      if (service.type == null || service.type === ServiceType.ONLINE) {
        member.role = role
      }

      if (organization != null) {
        const orgRes = ctx.db.resource<OrgResource>('org')
        const org = await orgRes.service.load(organization.serviceId, organization.externalId)
        if (member.role !== MemberRole.MANAGER && org == null) {
          throw new IntegrationError('integration.notauthorized')
        }
        organization = org ?? await orgRes.put(organization)

        if (member.serviceId !== organization.serviceId || member.orgId !== organization.externalId) {
          throw new IntegrationError('integration.missmatch')
        }

        if (mem?.org[0] == null) {
          await m2oRes.put({
            serviceId: member.serviceId,
            orgId: organization.externalId,
            memberId: member.externalId,
            role: member.role
          })
        } else if (mem.org[0].orgId !== organization.externalId) {
          throw new IntegrationError('integration.missmatch')
        }
      }

      return member
    } catch (e) {
      serializeError(e)
      throw e
    }
  },

  wait: makeWaitMethod(ctx, QUEUE_REMOTE_SYNC, 'membership:integration')
})
