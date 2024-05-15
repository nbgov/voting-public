import type { Db } from 'mongodb'
import type { CreateDbOptions, Connection, Resource } from './types'
import { MongoClient } from 'mongodb'
import { DEFAULT_DB_ALIAS } from './types'

export const createDb = (options: CreateDbOptions): Connection => {
  const _client = new MongoClient(options.url, options.useUrl
    ? {}
    : {
        auth: {
          username: options.user,
          password: options.password
        }
      })
  const _db: Record<string, Db | undefined> = { [DEFAULT_DB_ALIAS]: undefined }
  let _connected: boolean = false

  const _resouces: Record<string, Resource> = {}

  const _connection: Connection = {
    get: async () => {
      if (!_connected) {
        _connected = true
        await _client.connect()
      }
      if (_db[DEFAULT_DB_ALIAS] == null) {
        _db[DEFAULT_DB_ALIAS] = options.useUrl ? _client.db() : _client.db(options.defaultDb)
      }

      return _db[DEFAULT_DB_ALIAS]
    },

    prefix: () => options.prefix ?? '',

    register: resource => {
      resource.init(_connection)
      _resouces[resource.alias] = resource

      return _connection
    },

    resource: <T>(alias: string) => _resouces[alias] as unknown as T,

    kickOff: async () => {
      await Promise.all(Object.entries(_resouces).map(async ([, res]) => await res.collection()))
    },

    disconnect: async () => {
      await _client.close(true)
    }
  }

  return _connection
}
