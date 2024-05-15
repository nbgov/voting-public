import type { CommonModule } from './types'
import { SystemSecuredError } from './errors'
import type { UserResource } from '../resources/user'

export const kickoffCommand: ServeCommandModule = {
  command: 'kickoff',
  describe: 'kick off the server',
  builder: yargs => yargs.option('token', {
    alias: 't',
    describe: 'Authentication token of system user',
    type: 'string'
  }).option('onlyValue', {
    alias: 'o',
    default: false,
    describe: 'Should we output only resulting token',
    type: 'boolean'
  }),
  handler: async ({ context, token, onlyValue }) => {
    await context.db.kickOff()
    const userRes = context.db.resource<UserResource>('user')
    const userColl = await userRes.collection()
    const userStats = await userColl.stats()
    if (userStats.count > 0) {
      throw new SystemSecuredError()
    }
    const [,resToken] = await userRes.service.createWithAuthToken({ name: 'System', system: true, token })

    await context.db.disconnect()

    if (onlyValue) {
      console.info(resToken)
    } else {
      console.info(`Token to authenticate system user: ${resToken}`)
    }

    process.exit()
  }
}

export interface ServeCommandModule extends CommonModule<{ token?: string, onlyValue: boolean }> { }
