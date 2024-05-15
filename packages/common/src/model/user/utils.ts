import { anonymousUser } from './consts'
import { type User } from './types'

export const buildAnonymousUser = (token: string): User => {
  return { ...anonymousUser, _id: token, createdAt: new Date() }
}
