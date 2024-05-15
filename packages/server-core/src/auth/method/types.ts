import type { AuthenticationMethod, User } from '@smartapps-poll/common'

export const AUTH_PICKUP_KEY = 'auth-pickup'
export const REG_PICKUP_KEY = 'reg-pickup'

export interface AuthenticationWithUser<
  Credentials extends Record<string, unknown> | undefined = Record<string, unknown>
> extends AuthenticationMethod<Credentials> {
  user: User[]
}
