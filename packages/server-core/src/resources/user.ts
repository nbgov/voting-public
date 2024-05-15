
import type { Context } from '../types'
import type { Resource, ResourceServiceBuilder } from '../db/types'
import { type TokenAuthenticationMethod, type User, randomToken } from '@smartapps-poll/common'

import { createResourceBuilder } from '../db/resource'
import type { AuthResource } from './auth'

export const createUserResource = (ctx: Context): Resource => createResourceBuilder('user', ctx)
  .schema({
    bsonType: 'object',
    title: 'Users',
    required: ['name', 'active', 'createdAt'],
    properties: {
      _id: {
        bsonType: 'string'
      },
      name: {
        bsonType: 'string',
        description: 'Displyaing name of the user'
      },
      active: {
        bsonType: 'bool',
        description: 'Is user active or not'
      },
      createdAt: {
        bsonType: 'date',
        description: 'Time of user creation'
      },
      votingAddress: {
        bsonType: 'string',
        description: 'Voter address that is used for voting'
      },
      system: {
        bsonType: 'bool',
        description: 'Is user eligable to perform system commands'
      }
    }
  })
  .index('name', { name: 1 })
  .index('active', { active: 1 })
  .index('system', { system: 1 })
  .index('votingAddress', { votingAddress: 1 })
  .resourceService(buildUserResourceService)
  .create(data => ({ createdAt: new Date(), system: data.system ?? false, active: data.active ?? false }))
  .build()

export interface UserResourceService extends Record<string, unknown> {
  createWithAuthToken: (params: CreateUserWithAuthTokenParams) => Promise<[User, string]>
  createWithTmpToken: (params: CreateUserWithTmpTokenParams) => Promise<User>
  createWithSaltedToken: (params: CreateUserWithTmpTokenParams) => Promise<User>
}

export interface CreateUserWithAuthTokenParams extends Partial<User>, Partial<TokenAuthenticationMethod> {
  name: string
  token?: string
  system?: boolean
}

export interface CreateUserWithTmpTokenParams extends Partial<User>, Partial<TokenAuthenticationMethod> {
  name: string
  token: string
}

export const buildUserResourceService: ResourceServiceBuilder = (res, ctx) => {
  const userRes = res as unknown as UserResource

  const _service: UserResourceService = {
    createWithAuthToken: async ({ name, token, system, votingAddress }) => {
      token = token ?? randomToken()
      const user = await userRes.put({ name, system, active: true, ...(votingAddress !== undefined ? { votingAddress } : {}) })
      const authRes = ctx.db.resource<AuthResource>('auth')
      await authRes.service.createToken(user, token, false)

      return [user, token]
    },

    createWithTmpToken: async ({ name, token, votingAddress }) => {
      const user = await userRes.put({ name, active: true, ...(votingAddress !== undefined ? { votingAddress } : {}) })
      const authRes = ctx.db.resource<AuthResource>('auth')
      await authRes.service.createToken(user, token)

      return user
    },

    createWithSaltedToken: async ({ name, token, votingAddress }) => {
      const user = await userRes.put({ name, active: true, ...(votingAddress !== undefined ? { votingAddress } : {}) })
      const authRes = ctx.db.resource<AuthResource>('auth')
      await authRes.service.createSaltedToken(user, token)

      return user
    }
  }

  return _service as unknown as Record<string, unknown>
}

export interface UserResource<U extends User = User> extends Resource<U, UserResourceService> { }
