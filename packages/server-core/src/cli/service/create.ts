import type { ServiceResource } from '../../resources/service'
import type { CommonModule } from '../types'
import { assertSystemUser } from '../utils'

export const createCommand: CreateServiceCommandModule = {
  command: 'create',
  describe: 'create a new service',
  builder: yargs => yargs.option('auth', {
    alias: 'a',
    type: 'string',
    demandOption: true,
    describe: 'system user token to authenticate service creation'
  }).option('name', {
    alias: 'n',
    type: 'string',
    demandOption: true,
    describe: 'user name (can be not unique)'
  }).option('apiUrl', {
    alias: 'u',
    type: 'string',
    demandOption: true,
    describe: 'API URL of the service'
  }).option('serviceId', {
    alias: 's',
    type: 'string',
    describe: 'Desirable service id. Can be human readable. Make sure it\'s URL compatible'
  }).option('descr', {
    alias: 'd',
    type: 'string',
    describe: 'Description of the service'
  }).option('logoUrl', {
    alias: 'l',
    type: 'string',
    describe: 'Logo URL of the service'
  }).option('onlyValue', {
    alias: 'o',
    type: 'boolean',
    default: false,
    describe: 'Should we output only resulting token'
  }),
  handler: async ({ auth, name, apiUrl, serviceId, descr, logoUrl, onlyValue, context }) => {
    await assertSystemUser(auth, context)

    const srvRes = context.db.resource<ServiceResource>('service')
    const service = await srvRes.put({ name, apiUrl, serviceId, description: descr, logoUrl })

    await context.db.disconnect()

    if (onlyValue == null) {
      console.info(`Service ID: ${service.serviceId}`)
    } else {
      console.info(service.serviceId)
    }

    process.exit()
  }
}

export interface CreateServiceCommandModule extends CommonModule<{
  auth: string
  name: string
  apiUrl: string
  serviceId?: string
  descr?: string
  logoUrl?: string
  onlyValue?: boolean
}> { }
