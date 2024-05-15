import { type Organization } from '@smartapps-poll/common'
import { createResourceBuilder } from '../db/resource'
import type { Resource, ResourceServiceBuilder } from '../db/types'
import type { Context } from '../types'

export const createOrgResource = (ctx: Context): Resource => createResourceBuilder('org', ctx)
  .schema({
    bsonType: 'object',
    title: 'Organization',
    required: ['name', 'active', 'createdAt', 'serviceId', 'externalId'],
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
        description: 'Id that is used by external system to identify the organization'
      },
      serviceId: {
        bsonType: 'string',
        description: 'Id of external service that the organization is linked to - it can be a human readable alias'
      },
      shortDescr: {
        bsonType: 'string',
        description: 'Punch line of the organization'
      },
      logoUrl: {
        bsonType: 'string',
        description: 'Url to logo image to display polls some nice way'
      }
    }
  })
  .index('serviceId', { serviceId: 1 })
  .index('serviceOrgId', { serviceId: 1, externalId: 1 }, { unique: true })
  .resourceService(buildOrgResourceService)
  .create(data => ({
    createdAt: new Date(),
    active: data.active !== undefined ? data.active : true
  }))
  .build()

export interface OrgResourceService extends Record<string, unknown> {
  load: (serviceId: string, id?: string) => Promise<Organization | undefined>
}

export const buildOrgResourceService: ResourceServiceBuilder = (res, _ctx) => {
  const _res: OrgResource = res as unknown as OrgResource
  const _service: OrgResourceService = {
    load: async (serviceId, id) => {
      const collection = await _res.collection()

      return await collection.findOne({
        serviceId: _res.str(serviceId),
        externalId: _res.str(id)
      }) ?? undefined
    }
  }

  return _service as unknown as Record<string, unknown>
}

export interface OrgResource extends Resource<Organization, OrgResourceService> { }
