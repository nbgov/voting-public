
export interface AuthenticationMethod<
  Credentials extends Record<string, unknown> | undefined = Record<string, unknown>
> {
  _id: string
  id: string
  userId: string
  type: string
  expiredAt?: Date
  credentials?: Credentials
}

export type TokenAuthenticationMethod = AuthenticationMethod<undefined> & {
  type: typeof AUTH_TYPE_TOKEN
}

export type TmpTokenAuthenticationMethod = AuthenticationMethod<Record<string, string | undefined>> & {
  type: AuthTmpTokenType
}

export interface OneTimePayload extends Record<string, string> {
  externalId: string
}

export type AuthTmpTokenType = typeof AUTH_TYPE_TOKEN | typeof AUTH_TYPE_TOKEN_ONETIME | typeof AUTH_TYPE_TOKEN_ONETIME_SEED

export const AUTH_TYPE_TOKEN = 'token'

export const AUTH_ANONYMOUS = 'anonymous'

export const AUTH_TYPE_TOKEN_ONETIME = 'token.onetime'

export const AUTH_TYPE_TOKEN_ONETIME_SEED = 'token.onetime.seed'
