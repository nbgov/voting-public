import { Cluster, Redis, RedisOptions } from 'ioredis'
import { Context } from '../types'
import { buildDbSecurityHelper } from '../db/security'
import { hash, randomToken } from '@smartapps-poll/common'

export const createRedis = (ctx: Context, options?: RedisOptions) => {
  if (ctx.config.redisCluster != null) {
    const cluster = new Cluster([{
      host: ctx.config.redisCluster.host
    }], {
      dnsLookup: (address, callback) => {
        callback(null, address)
      },
      redisOptions: {
        tls: {
          rejectUnauthorized: false
        },
        password: ctx.config.redisCluster.key,
        ...options
      },
    })

    return cluster
  }

  return options == null ? new Redis(ctx.config.redisHost) : new Redis(ctx.config.redisHost, options)
}

export const buildStoreHelper = (ctx: Context): StoreHelper => {
  const _security = buildDbSecurityHelper(ctx)
  const _key = (key: string): string => hash(ctx.config.salt, `nbpoll:${key}`)
  const _encrypt = async (value: unknown) => {
    const cipher = await _security.encryptSecretKey(Buffer.from(JSON.stringify(value), 'utf8'))
    return cipher
  }
  const _decrypt = async (cipher: string) =>
    JSON.parse((await _security.decryptSecretKey(cipher)).toString('utf8')) as unknown

  const _helper: StoreHelper = {
    set: async (key, value, ttl) => {
      key = _key(key)
      await ctx.redis.set(key, await _encrypt(value))
      await ctx.redis.expire(key, ttl ?? 60)

      return true
    },

    tokenize: async (value, prefix, ttl = undefined) => {
      const token = randomToken()
      await _helper.set(prefix + ':' + token, value, ttl ?? 300)

      return token
    },

    get: async <T>(key: string) => {
      if (!await _helper.has(key)) {
        return undefined
      }

      key = _key(key)
      const cipher = await ctx.redis.get(key)

      if (cipher == null) {
        return undefined
      }

      const v = await _decrypt(cipher) as T

      return v
    },

    remove: async key => {
      if (!await _helper.has(key)) {
        return false
      }

      key = _key(key)

      return await ctx.redis.del(key) > 0
    },

    pick: async <T>(key: string) => {
      if (await _helper.has(key)) {
        const cipher = await ctx.redis.getdel(_key(key))

        if (cipher == null) {
          return undefined
        }

        const result = await _decrypt(cipher) as T

        return result as T
      }

      return undefined
    },

    save: async (key, value, tags, ttl) => {
      const k = _key(typeof key === 'string' ? key : JSON.stringify(key)) as string
      await ctx.redis.set(k, JSON.stringify(value))
      await ctx.redis.expire(k, ttl ?? 3600)

      if (tags != null) {
        await Promise.all(tags.map(async tag => ctx.redis.lpush(`tag:${tag}`, k)))
      }

      return true
    },

    load: async (key) => {
      const k = _key(typeof key === 'string' ? key : JSON.stringify(key)) as string

      if (!await ctx.redis.exists(k)) {
        return null
      }

      const value = await ctx.redis.get(k)
      if (value != null) {
        return JSON.parse(value)
      }

      return null
    },

    clean: async (key, tag) => {
      if (typeof key === 'string' && tag != null && tag) {
        while (await ctx.redis.llen(`tag:${key}`) > 0) {
          const k = await ctx.redis.lpop(`tag:${key}`) as string
          await ctx.redis.del(k)
        }
        return true
      }

      const k = _key(typeof key === 'string' ? key : JSON.stringify(key)) as string

      return await ctx.redis.del(k) > 0
    },

    has: async key => await ctx.redis.exists(_key(key)) > 0
  }

  return _helper
}

export interface StoreHelper {
  get: <T>(key: string) => Promise<T | undefined>
  tokenize: <T>(value: T, prefix: string, ttl?: number) => Promise<string>
  set: <T>(key: string, value: T, ttl?: number) => Promise<boolean>
  has: (key: string) => Promise<boolean>
  remove: (key: string) => Promise<boolean>
  pick: <T>(key: string) => Promise<T | undefined>
  save: <T>(key: string | unknown, value: T, tags?: string[], ttl?: number) => Promise<boolean>
  load: <T>(key: string | unknown) => Promise<T | null>
  clean: (key: string | unknown, tag?: boolean) => Promise<boolean>
}
