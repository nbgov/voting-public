import { CRED_TYPE_NEWBELARUSTELEGRAM, NBServiceData } from '@smartapps-poll/common'
import { NEWBELARUS_DECENTRALIZED_SERVICE_PREFIX } from '../../model/newbelarus'
import type { ServiceResource } from '../../resources/service'
import type { CommonModule } from '../types'
import { assertSystemUser } from '../utils'

export const telegramCommand: DockTelegramCommandModule = {
  command: 'telegram',
  describe: 'initate or update a dock telegram issuer params',
  builder: yargs => yargs.option('auth', {
    alias: 'a',
    type: 'string',
    demandOption: true,
    describe: 'authentication token that is required to perform action'
  }).option('pub', {
    alias: 'p',
    type: 'string',
    default: undefined,
    demandOption: false,
    describe: 'public key to validate credenatial with'
  }).option('did', {
    alias: 'd',
    type: 'string',
    default: undefined,
    demandOption: false,
    describe: 'issuer did to properly request credential'
  }),
  handler: async ({ auth, did, pub, context }) => {
    await assertSystemUser(auth, context)
    const servRes: ServiceResource = context.db.resource('service')
    const serviceId = `${NEWBELARUS_DECENTRALIZED_SERVICE_PREFIX}${CRED_TYPE_NEWBELARUSTELEGRAM}`

    if (did == null && pub == null) {
      throw 'did or pub should be specified'
    }

    let tgSrv = await servRes.get(serviceId) ?? {
      serviceId,
      name: 'Dock.io - decentralized service - New Belarus Telegram',
      createdAt: new Date(),
      apiUrl: JSON.stringify({ publicKey: pub, did })
    }
    if (!("_id" in tgSrv)) {
      if (pub == null || did == null) {
        throw 'specify both pub and did when the service is first created'
      }
    } else {
      const serviceData: NBServiceData = JSON.parse(tgSrv.apiUrl)
      if (pub != null) {
        serviceData.publicKey = pub
      }
      if (did != null) {
        serviceData.did = did
      }
      tgSrv.apiUrl = JSON.stringify(serviceData)
    }

    await servRes.put(tgSrv)

    process.exit()
  }
}

export interface DockTelegramCommandModule extends CommonModule<{
  auth: string
  pub?: string
  did?: string
}> { }
