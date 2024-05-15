import type { TokenAuthenticationMethod } from '@smartapps-poll/common'
import { AUTH_TYPE_TOKEN } from '@smartapps-poll/common'
import type { AuthResource } from '../resources/auth'
import type { Context } from '../types'
import { SystemUserError } from './errors'

export const assertSystemUser = async (token: string, context: Context): Promise<void> => {
  const authRes = context.db.resource<AuthResource<TokenAuthenticationMethod>>('auth')
  const admin = await authRes.service.authenticateWithHash(AUTH_TYPE_TOKEN, token)
  if (admin?.user[0]?.system == null || !admin.user[0].system) {
    throw new SystemUserError()
  }
}
