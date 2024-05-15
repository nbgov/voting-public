import type { AuthenticationWithUser } from '../../auth/method/types'

export interface UserTokenAuthData {
  token: string
  telegram: string
}

export type UserTokenAuthResult = AuthenticationWithUser | null
