import { AUTH_ANONYMOUS } from '../auth/types'
import { type User } from './types'

export const anonymousUser: User = {
  _id: '',
  name: AUTH_ANONYMOUS,
  createdAt: new Date(),
  votingAddress: AUTH_ANONYMOUS,
  active: true
}
