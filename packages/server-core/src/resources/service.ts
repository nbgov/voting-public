import { type IntegrationService, randomToken } from '@smartapps-poll/common'
import { createResourceBuilder } from '../db/resource'
import type { Resource, ResourceServiceBuilder } from '../db/types'
import type { Context } from '../types'

export const createIntegrationResource = (ctx: Context): Resource => createResourceBuilder('service', ctx)
  .schema({
    bsonType: 'object',
    title: 'Integration service',
    required: ['serviceId', 'name', 'createdAt', 'apiUrl'],
    properties: {
      _id: {
        bsonType: 'string'
      },
      serviceId: {
        bsonType: 'string',
        description: 'Id of external service that the organization is linked to'
      },
      name: {
        bsonType: 'string',
        description: 'Human readable name of the service'
      },
      description: {
        bsonType: 'string',
        description: 'Description of the service'
      },
      logoUrl: {
        bsonType: 'string',
        description: 'Logo url to represent service in the different systems'
      },
      apiUrl: {
        bsonType: 'string',
        description: 'API url to authenticate service users and interact with'
      },
      type: {
        bsonType: 'string',
        description: 'Serive type defines behaviour of the service'
      },
      createdAt: {
        bsonType: 'date',
        description: 'Time of service registration'
      }
    }
  })
  .loadBy('serviceId')
  .index('serviceId', { serviceId: 1 }, { unique: true })
  .resourceService(buildIntegrationResourceService)
  .create(data => ({ serviceId: data.serviceId ?? randomToken(), createdAt: new Date() }))
  .build()

export interface IntegrationResourceService extends Record<string, unknown> {
  getCredPublicServices: (serviceTypes: string[]) => Promise<IntegrationService[]>
}

export const buildIntegrationResourceService: ResourceServiceBuilder = (res, _ctx) => {
  const _service: IntegrationResourceService = {
    getCredPublicServices: async serviceIds => {
      const collection = await res.collection()
      const cursor = collection.find({ serviceId: { $in: serviceIds } })
      const result = await cursor.toArray()
      await cursor.close()

      return result as IntegrationService[]
    }
  }

  return _service as unknown as Record<string, unknown>
}

export interface ServiceResource extends Resource<IntegrationService, IntegrationResourceService> { }
