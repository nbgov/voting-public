import type { Db, Collection, IndexSpecification, CreateIndexesOptions } from 'mongodb'
import { type Context } from '../types'

export interface Connection {
  get: () => Promise<Db>
  prefix: () => string
  resource: <T extends Resource<any, any> = Resource<DbObject, EmptyResourceService>>(alias: string) => T
  register: (resource: Resource) => Connection
  kickOff: () => Promise<void>
  disconnect: () => Promise<void>
}

export type EmptyResourceService = Record<string, unknown> | undefined

export interface Resource<T extends DbObject = DbObject, U extends EmptyResourceService = undefined> {
  alias: string
  name: string
  schema?: Record<string, any>
  indexes: Array<{ name: string, index: IndexSpecification, options?: CreateIndexesOptions }>
  service: U
  loadBy: string
  init: (connection: Connection) => void
  makeId: (data?: Record<string, any>) => string
  collectionName: () => string
  collection: () => Promise<Collection<T>>
  get: (id: string | number, field?: boolean | string) => Promise<T | undefined>
  put: (object: Partial<T>) => Promise<T>
  str: (value: string | number | undefined | null) => string
}

export interface ResourceBuilder {
  id: (makeId: (data?: Record<string, any>) => string) => ResourceBuilder

  name: (name: string) => ResourceBuilder

  schema: (schema: Record<string, any>) => ResourceBuilder

  index: (name: string, index: IndexSpecification, options?: CreateIndexesOptions) => ResourceBuilder

  create: (create: (data: Record<string, unknown>) => Record<string, unknown>) => ResourceBuilder

  loadBy: (field: string) => ResourceBuilder

  resourceService: (resourceService: ResourceServiceBuilder) => ResourceBuilder

  build: <T extends DbObject = DbObject, U extends EmptyResourceService = undefined>() => Resource<T, U>
}

export type ResourceServiceBuilder = (res: Resource, ctx: Context) => Record<string, unknown>

export interface CreateDbOptions {
  useUrl: boolean
  schemaLocked: boolean
  url: string
  user: string
  password: string
  defaultDb: string
  prefix?: string
}

export const DEFAULT_DB_ALIAS = 'default'

export interface DbObject { _id?: string }

export interface DbSecurityHelper {
  encryptSecretKey: (key: Buffer | string) => Promise<string>
  decryptSecretKey: (encryptedKey: string) => Promise<Buffer>

  // encryptSecretKey: (key: Buffer | string) => Promise<string>
  // decryptSecretKey: (encryptedKey: string) => Promise<Buffer>
}
