import { createResourceBuilder } from '../db/resource'
import { Resource, ResourceServiceBuilder } from '../db/types'
import type { Context } from '../types'

export const createVeriffResource = (ctx: Context): Resource => createResourceBuilder('veriff', ctx).schema({
  bsonType: 'object',
  title: 'Veriff Session',
  required: ['sessionId', 'status'],
  properties: {
    _id: { bsonType: 'string' },
    sessionId: {
      bsonType: 'string',
      description: 'Session id from veriff for further processing'
    },
    status: {
      bsonType: 'string',
      description: 'Status of the record for further processing'
    },
    payload: {
      bsonType: 'object',
      description: 'additonal optional data for further use'
    }
  }
}).resourceService(buildVeriffResourceService)
  .index('sessionId', { sessionId: 1 }, { unique: true })
  .index('status', { status: 1 })
  .create(() => ({ status: VeriffStatus.Unprocessed }))
  .build()

export interface VeriffResourceService extends Record<string, unknown> {
  register: (id: string) => Promise<VeriffRecord>
}

export interface VeriffResouce extends Resource<VeriffRecord, VeriffResourceService> { }

export const buildVeriffResourceService: ResourceServiceBuilder = (res, _ctx) => {
  const _res: VeriffResouce = res as unknown as VeriffResouce
  const _service: VeriffResourceService = {
    register: async id => {
      return _res.put({ sessionId: id })
    }
  }

  return _service
}

export enum VeriffStatus {
  Unprocessed = 'unprocessed',
}

export interface VeriffRecord<T = unknown> {
  _id: string
  sessionId: string
  status: string
  payload?: Record<string, T>
}
