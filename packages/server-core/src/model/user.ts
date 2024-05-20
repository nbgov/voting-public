import type { User } from '@smartapps-poll/common'
import type { Context } from '../types'
import { buildStoreHelper } from './redis'

export const makeUserModel = (ctx: Context, user: User): UserModel => {
  const _key = (key: string): string => `user-data:${user._id}:${key}`
  const store = buildStoreHelper(ctx)

  const _utils: UserModel = {
    storeForUser: async (key, value, ttl) => store.set(_key(key), value, ttl),

    takeForUser: async key => store.pick(_key(key)),

    getForUser: async key => store.get(_key(key))
  }

  return _utils
}

export interface UserModel {
  storeForUser: (key: string, value: string, ttl?: number) => Promise<boolean>
  takeForUser: (key: string) => Promise<string | undefined>
  getForUser: (key: string) => Promise<string | undefined>
}
