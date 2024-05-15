import type { Collection } from 'mongodb'
import { ResourceError } from './errors'
import { v4 as uuid } from 'uuid'
import type { Connection, DbObject, EmptyResourceService, Resource, ResourceBuilder } from './types'
import { type Context } from '../types'

export const createResourceBuilder = (alias: string, context: Context): ResourceBuilder => {
  let _connection: Connection | undefined
  let _collection: Collection | undefined
  let _create: (data: Record<string, unknown>) => Record<string, unknown>
  const _resource: Partial<Resource> = {
    alias,

    name: alias,

    loadBy: '_id',

    indexes: [],

    service: undefined,

    makeId: _ => uuid(),

    init: connection => {
      _connection = connection
    },

    collectionName: () => `${_connection?.prefix() as string}${_resource.name as string}`,

    collection: async () => {
      if (_collection != null) {
        return _collection
      }
      if (_connection == null) {
        throw new ResourceError(_resource as Resource)
      }
      const db = await _connection.get()

      const name = (_resource as Resource).collectionName()
      const cursor = db.listCollections({ name })
      if (!await cursor.hasNext()) {
        console.debug(`Create collection ${name}`)
        _collection = await db.createCollection(name, {
          ...((_resource.schema != null) ? { validator: { $jsonSchema: _resource.schema } } : {}),
          ...((_resource.makeId != null) ? { pkFactory: { createPk: _resource.makeId } } : {})
        })
        if (_resource.indexes != null) {
          await Promise.all(_resource.indexes.map(
            async index => await _collection?.createIndex(index.index, {
              name: index.name, ...((index.options != null) ? index.options : {})
            })
          ))
        }
      } else if (!context.config.db.schemaLocked) {
        if (_resource.schema != null) {
          await db.command({ collMod: name, validator: { $jsonSchema: _resource.schema } })
        }
        _collection = db.collection(name)
        if (_resource.indexes != null) {
          await Promise.all(_resource.indexes.map(
            async index => {
              if (_collection == null) {
                return
              }
              const _index = (await _collection.indexes()).find(_index => _index.name === index.name)
              if (_index != null) {
                const existing = { ..._index }
                if ('name' in existing) {
                  delete existing.name
                }
                if ('v' in existing) {
                  delete existing.v
                }
                const propsed = { key: index.index, ...index.options }
                // We do not recreate text indexes
                if (JSON.stringify(existing) !== JSON.stringify(propsed) && !('weights' in existing)) {
                  console.info(JSON.stringify(existing))
                  console.info(JSON.stringify(propsed))
                  console.debug(`Recreate index ${name}.${index.name}`)
                  await _collection.dropIndex(index.name)
                  await _collection.createIndex(index.index, {
                    name: index.name, ...((index.options != null) ? index.options : {})
                  })
                }
              } else {
                console.debug(`Create index ${name}.${index.name}`)
                await _collection.createIndex(index.index, {
                  name: index.name, ...((index.options != null) ? index.options : {})
                })
              }
            }
          ))
        }
      } else {
        _collection = db.collection(name)
      }
      await cursor.close()

      return _collection
    },

    get: async (id, field) => {
      field = field === undefined || field === true
        ? (_resource.loadBy ?? '_id')
        : field === false ? '_id' : field

      if (_resource.collection != null) {
        const collection = await _resource.collection()

        return await collection.findOne({ [field]: _resource.str != null ? _resource.str(id) : id }) ?? undefined
      }

      return undefined
    },

    put: async data => {
      data = Object.fromEntries(Object.entries(data).map(([key, value]) => (
        [key, _resource.schema?.properties[key].bsonType === 'date' ? new Date(value) : value]
      )))
      if (_resource.collection != null) {
        const collection = await _resource.collection()
        if (data._id !== undefined) {
          const id = _resource.str != null ? _resource.str(data._id) : data._id
          const object = await collection.findOne({ _id: id })
          const update = { ...object, ...data }
          await collection.updateOne({ _id: id }, { $set: update })
          return update
        }
        const create = {
          ...((_resource.makeId != null) ? { _id: _resource.makeId() } : {}),
          ...Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as typeof data,
          ...(_create !== undefined ? _create(data) : {})
        }
        await collection.insertOne(create)
        return create
      }
      return data
    },

    str: value => `${value as string}`
  }

  const _builder: ResourceBuilder = {
    id: makeId => {
      _resource.makeId = data => makeId(data)
      return _builder
    },

    name: name => {
      _resource.name = name
      return _builder
    },

    schema: schema => {
      _resource.schema = schema
      return _builder
    },

    index: (name, index, options) => {
      _resource.indexes?.push({ name, index, options })
      return _builder
    },

    build: <T extends DbObject = DbObject, U extends EmptyResourceService = EmptyResourceService>() => {
      return _resource as unknown as Resource<T, U>
    },

    loadBy: field => {
      _resource.loadBy = field
      return _builder
    },

    resourceService: utils => {
      _resource.service = utils(_resource as Resource, context) as any
      return _builder
    },

    create: create => {
      _create = create
      return _builder
    }
  }

  return _builder
}
