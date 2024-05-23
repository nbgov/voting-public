import type { Resource, ResourceServiceBuilder } from '../db/types'
import type { Context } from '../types'
import { createResourceBuilder } from '../db/resource'
import { AUTH_ANONYMOUS, AUTH_TYPE_TOKEN, AUTH_TYPE_TOKEN_ONETIME, AUTH_TYPE_TOKEN_ONETIME_SEED, buildAnonymousUser, fromBase64, hash, randomToken } from '@smartapps-poll/common'
import type { AuthTmpTokenType, AuthenticationMethod, OneTimePayload, TmpTokenAuthenticationMethod, TokenAuthenticationMethod, User } from '@smartapps-poll/common'
import days from 'dayjs'
import { AUTH_TYPE_PS, TERMINATION_PAYLOAD, type ProofspaceAuthenticationMethod } from '../auth/method/proofspace/types'
import { AUTH_PICKUP_KEY, type AuthenticationWithUser } from '../auth/method/types'
import type { UserResource } from './user'
import { AUTH_TOKEN, SALTED_AUTH_TYPE, type SaltedAuthenticationMethod } from '../auth/method/token'
import { makeUserModel } from '../model/user'
import { buildStoreHelper } from '../model/redis'
import { EarlyFailureError } from '../model/errors'

export const createAuthResource = (ctx: Context): Resource => createResourceBuilder('auth', ctx)
  .name('auth')
  .schema({
    bsonType: 'object',
    title: 'Authentication methods of users',
    required: ['id', 'userId', 'type'],
    properties: {
      _id: {
        bsonType: 'string'
      },
      id: {
        bsonType: 'string',
        description: 'Identifier of the authentication method'
      },
      userId: {
        bsonType: 'string',
        description: 'Owner id of the authentication method'
      },
      type: {
        bsonType: 'string',
        description: 'Type of the authentication method'
      },
      expiredAt: {
        bsonType: 'date',
        description: 'Optional date and time when the token is expired in UTC format'
      },
      credentials: {
        bsonType: 'object',
        description: 'Additional data for authentication method'
      }
    }
  })
  .index('id', { id: 1 }, { unique: true })
  .index('expiredAt', { expiredAt: 1 })
  .index('user', { userId: 1 })
  .resourceService(buildAuthUtils)
  .create(data => ({ type: data.type ?? AUTH_TYPE_TOKEN }))
  .build()

export interface AuthResourceService extends Record<string, unknown> {
  hash: (value: string) => string
  terminate: (token: string) => Promise<void>
  createToken: (user: User, token?: string, expiredAt?: Date | false) => Promise<[TokenAuthenticationMethod, string]>
  createTmpToken: (token?: string, expiredAt?: Date | false, type?: AuthTmpTokenType, credentials?: Record<string, string | undefined>) => Promise<[TmpTokenAuthenticationMethod, string]>
  cleanTmpToken: (token: string) => Promise<void>
  createSaltedToken: (user: User, token: string) => Promise<SaltedAuthenticationMethod>
  createTmpSaltedToken: (token: string, expiredAt?: Date | false) => Promise<SaltedAuthenticationMethod>
  cleanupSaltedToken: (token: string) => Promise<void>
  createProofspaceAuth: (user: User, subscriberDid: string) => Promise<ProofspaceAuthenticationMethod>
  authenticateWithHash: <Auth extends AuthenticationWithUser = AuthenticationWithUser>(type: string, id: string, preserve?: boolean) => Promise<Auth | null>
  authenticateSalted: (token: string) => Promise<AuthenticationWithUser | null>
  extractSaltedId: (token: string) => Promise<[string, string] | null>
  cleanUpExpired: () => Promise<void>
}

export const buildAuthUtils: ResourceServiceBuilder = (res, ctx) => {
  const _service: AuthResourceService = {
    hash: value => hash(ctx.config.salt, value),

    terminate: async (token): Promise<void> => {
      const authRes = res as unknown as AuthResource<TokenAuthenticationMethod>
      const collection = await authRes.collection()
      await collection.deleteOne({ id: _service.hash(token) })
    },

    createToken: async (user, token, expiredAt) => {
      if (expiredAt === undefined) {
        expiredAt = days().add(1, 'day').toDate()
      }
      token = token ?? randomToken()
      const authRes = res as unknown as AuthResource<TokenAuthenticationMethod>
      const auth = await authRes.put({
        userId: user._id, id: _service.hash(token), ...(expiredAt !== false ? { expiredAt } : {})
      })

      return [auth, token]
    },

    createTmpToken: async (token, expiredAt, type, credentials) => {
      if (expiredAt === false) {
        expiredAt = days().add(5, 'minutes').toDate()
      } else if (expiredAt == null) {
        expiredAt = days().add(1, 'hour').toDate()
      }

      token = token ?? randomToken()

      type = type ?? AUTH_TYPE_TOKEN_ONETIME

      const authObj: Omit<TmpTokenAuthenticationMethod, "_id"> = {
        userId: AUTH_ANONYMOUS,
        id: _service.hash(token),
        expiredAt,
        type: type ?? AUTH_TYPE_TOKEN_ONETIME,
        credentials: credentials ?? {}
      }

      if (shortLiving.includes(type)) {
        const tmpStore = buildStoreHelper(ctx)
        await tmpStore.set('auth:' + authObj.id, authObj, days(expiredAt).diff(days(), "seconds"))
        return [{ ...authObj, '_id': 'REDIS' }, token]
      }

      const authRes = res as unknown as AuthResource<TmpTokenAuthenticationMethod>
      const auth = await authRes.put(authObj)

      return [auth, token]
    },

    cleanTmpToken: async token => {
      const tmpStore = buildStoreHelper(ctx)
      const id = _service.hash(token)
      const key = 'auth:' + id
      if (await tmpStore.has(key)) {
        await tmpStore.remove(key)
      }
      const authRes = res as unknown as AuthResource<TokenAuthenticationMethod>
      const coll = await authRes.collection()
      await coll.deleteOne({ id })
    },

    createTmpSaltedToken: async (token, expiredAt) => {
      if (expiredAt === false) {
        expiredAt = days().add(5, 'minutes').toDate()
      } else if (expiredAt == null) {
        expiredAt = days().add(1, 'hour').toDate()
      }
      token = token.startsWith(SALTED_AUTH_TYPE + ':') ? token.substring(token.indexOf(':') + 1) : token
      const authRes = res as unknown as AuthResource<SaltedAuthenticationMethod>

      const auth = await authRes.put({
        userId: AUTH_ANONYMOUS, id: _service.hash(token), expiredAt, type: SALTED_AUTH_TYPE
      })

      return auth
    },

    createSaltedToken: async (user, token) => {
      token = token.startsWith(SALTED_AUTH_TYPE + ':') ? token.substring(token.indexOf(':') + 1) : token
      const authRes = res as unknown as AuthResource<SaltedAuthenticationMethod>
      const auth = await authRes.put({
        userId: user._id, id: _service.hash(token), expiredAt: days().add(1, 'hour').toDate(), type: SALTED_AUTH_TYPE
      })

      return auth
    },

    createProofspaceAuth: async (user, subscriberDid) => {
      const authRes = res as unknown as AuthResource<ProofspaceAuthenticationMethod>
      try {
        return await authRes.put({ userId: user._id, id: _service.hash(subscriberDid), type: AUTH_TYPE_PS })
      } catch (e) {
        const collection = await authRes.collection()
        return await collection.findOne({ id: _service.hash(subscriberDid), type: AUTH_TYPE_PS }) as ProofspaceAuthenticationMethod
      }
    },

    authenticateWithHash: async <Auth extends AuthenticationWithUser = AuthenticationWithUser>(type: string, id: string, preserve?: boolean) => {
      const userRes = ctx.db.resource<UserResource>('user')
      if ([AUTH_TOKEN, ...shortLiving].includes(type)) {
        const tmpStore = buildStoreHelper(ctx)
        const key = _service.hash(id)

        const authObj: Auth | undefined = shortLiving.includes(type) && (preserve == null || preserve === false)
          ? await tmpStore.pick('auth:' + key)
          : await tmpStore.get('auth:' + key)

        if (authObj != null) {
          if (shortLiving.includes(type)) {
            if (authObj.type !== type) {
              console.log('hit the fan')
              return null
            } else {
              if (ctx.config.devMode) {
                console.log('smooth')
              }
            }
          }
          if (authObj.userId !== AUTH_ANONYMOUS) {
            const user = await userRes.get(authObj.userId)
            if (user != null) {
              authObj.user = [user]
            }
          }

          return authObj
        }
      }

      const authRes = res as unknown as AuthResource
      const authColl = await authRes.collection()
      const queryType = type === AUTH_TYPE_TOKEN ? {
        $in: [AUTH_TYPE_TOKEN, ...shortLiving]
      } : type
      const authCursor = authColl.aggregate<Auth>([
        { $match: { id: authRes.service.hash(id), type: queryType } },
        {
          $lookup: {
            from: userRes.collectionName(),
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        }
      ])

      const authWithUser = await authCursor.next()
      await authCursor.close()

      return authWithUser
    },

    cleanupSaltedToken: async token => {
      const decoded = fromBase64(token)
      if (!decoded.includes(':')) {
        return
      }
      const [auth, salt] = decoded.split(':', 2)
      const id = hash(salt, auth)
      const authRes = res as unknown as AuthResource
      const coll = await authRes.collection()
      await coll.deleteOne({ id: authRes.service.hash(id) })
    },

    extractSaltedId: async token => {
      try {
        const decoded = fromBase64(token)
        if (!decoded.includes(':')) {
          return null
        }
        const [auth, salt] = decoded.split(':', 2)

        return [hash(salt, auth), auth]
      } catch {
        return null
      }
    },

    authenticateSalted: async token => {
      const result = await _service.extractSaltedId(token)
      if (result == null) {
        return null
      }
      const [id, auth] = result
      // await _service.cleanUpExpired()
      const userRes = ctx.db.resource<UserResource>('user')
      const authRes = res as unknown as AuthResource
      const authColl = await authRes.collection()
      // console.log({ id: authRes.service.hash(id) })
      const authCursor = authColl.aggregate<AuthenticationWithUser>([
        { $match: { id: authRes.service.hash(id), type: SALTED_AUTH_TYPE } },
        {
          $lookup: {
            from: userRes.collectionName(),
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        }
      ])

      const authWithUser = await authCursor.next()
      await authCursor.close()

      if (authWithUser?.user[0] == null && authWithUser?.userId === AUTH_ANONYMOUS) {
        const userModel = makeUserModel(ctx, buildAnonymousUser(authWithUser.id))
        const pickup = await userModel.getForUser(AUTH_PICKUP_KEY)
        await _service.cleanupSaltedToken(token)
        if (pickup === TERMINATION_PAYLOAD) {
          await userModel.takeForUser(AUTH_PICKUP_KEY)
          if (ctx.config.earlyFailure) {
            throw new EarlyFailureError()
          }
          return authWithUser
        }
        const payload: OneTimePayload = { externalId: pickup ?? 'unknown' }
        await authRes.service.createTmpToken(auth, false, AUTH_TYPE_TOKEN_ONETIME, payload)
      } else if (authWithUser?.user[0] != null) {
        await authRes.service.createToken(authWithUser.user[0], auth)
      }

      return authWithUser
    },

    cleanUpExpired: async (): Promise<void> => {
      const authRes = res as unknown as AuthResource
      const authCall = await authRes.collection()
      const result = await authCall.deleteMany({ expiredAt: { $lt: new Date() } })
      if (result.deletedCount > 0) {
        console.info(`Auth cleaned up: ${result.deletedCount}`)
      }
    }
  }

  return _service as unknown as Record<string, unknown>
}

export interface AuthResource<T extends AuthenticationMethod = AuthenticationMethod> extends Resource<T, AuthResourceService> { }

const shortLiving = [AUTH_TYPE_TOKEN_ONETIME, AUTH_TYPE_TOKEN_ONETIME_SEED]
