import { randomToken } from '@smartapps-poll/common'
import type { CommonModule } from '../types'
import type { UserResource } from '../../resources/user'
import { assertSystemUser } from '../utils'

export const createCommand: CreateUserCommandModule = {
  command: 'create',
  describe: 'create a new user',
  builder: yargs => yargs.option('token', {
    alias: 't',
    type: 'string',
    describe: 'prefered authentication token'
  }).option('auth', {
    alias: 'a',
    type: 'string',
    demandOption: true,
    describe: 'system user token to authenticate another user creation'
  }).option('name', {
    alias: 'n',
    type: 'string',
    demandOption: true,
    describe: 'user name (can be not unique)'
  }).option('system', {
    alias: 's',
    type: 'boolean',
    default: false,
    describe: 'Should user have system priviliges or not'
  }).option('onlyValue', {
    alias: 'o',
    type: 'boolean',
    default: false,
    describe: 'Should we output only resulting token'
  }),
  handler: async ({ auth, token, name, system, onlyValue, context }) => {
    await assertSystemUser(auth, context)

    token = token ?? randomToken()
    const userRes = context.db.resource<UserResource>('user')
    const [, resToken] = await userRes.service.createWithAuthToken({ name, token, system })
    await context.db.disconnect()

    if (onlyValue != null && onlyValue) {
      console.info(resToken)
    } else {
      console.info(`Token to authenticate system user: ${resToken}`)
    }

    process.exit()
  }
}

export interface CreateUserCommandModule extends CommonModule<{
  token?: string
  auth: string
  name: string
  system?: boolean
  onlyValue?: boolean
}> { }
