import { CRED_TYPE_NEWBELARUSPASSPORT, type IntegrationService, SERVICE_PK_NEWBELARUSPASSPORT, generateDockSignatureParams, newBelarusPassportDockJsonSchema, type NBServiceData } from '@smartapps-poll/common'
import { NEWBELARUS_DECENTRALIZED_SERVICE_PREFIX } from '../../model/newbelarus'
import { type ServiceResource } from '../../resources/service'
import { type CommonModule } from '../types'
import { BBSPlusKeypairG2, BBSPlusPublicKeyG2, BBSPlusSecretKey, BBSPlusSignatureParamsG1, BBS_PLUS_SIGNATURE_PARAMS_LABEL_BYTES, CredentialSchema, initializeWasm } from '@docknetwork/crypto-wasm-ts'
import { assertSystemUser } from '../utils'
import { buildDbSecurityHelper } from '../../db/security'
import { WRAPPED_PERFIX } from '../../db/consts'

export const passportCommand: DockPassportCommandModule = {
  command: 'passport',
  describe: 'initate or update a dock passport issuer params',
  builder: yargs => yargs.option('params', {
    alias: 'p',
    type: 'boolean',
    default: false,
    describe: 'Should we regenerate signature params. Ignored if service is touched for the first time'
  }).option('keypair', {
    alias: 'k',
    type: 'boolean',
    default: false,
    describe: 'Should we regenerate keypair. Ignored if service is touched for the first time'
  }).option('wrap', {
    alias: 'w',
    type: 'boolean',
    default: false,
    describe: 'Wrap secret key if unwrapped'
  }).option('auth', {
    alias: 'a',
    type: 'string',
    demandOption: true,
    describe: 'system user token to authorize dock services initialization'
  }).option('did', {
    alias: 'd',
    type: 'string',
    demandOption: false,
    describe: 'did id to idenitfy service'
  }),
  handler: async ({ params, keypair, auth, wrap, did, context }) => {
    await assertSystemUser(auth, context)
    await initializeWasm()
    const dbHelper = buildDbSecurityHelper(context)
    const servRes: ServiceResource = context.db.resource('service')
    const serviceId = `${NEWBELARUS_DECENTRALIZED_SERVICE_PREFIX}${CRED_TYPE_NEWBELARUSPASSPORT}`
    const secretId = `${NEWBELARUS_DECENTRALIZED_SERVICE_PREFIX}${SERVICE_PK_NEWBELARUSPASSPORT}`
    let passportService = await servRes.get(serviceId)
    if (passportService == null) {
      params = true
      keypair = true
      passportService = {
        serviceId,
        name: 'Dock.io - decentralized service - New Belarus Passport',
        createdAt: new Date()
      } as IntegrationService
    }
    let realParams: BBSPlusSignatureParamsG1
    if (params || passportService.description == null) {
      realParams = generateDockSignatureParams(
        BBSPlusSignatureParamsG1, newBelarusPassportDockJsonSchema, BBS_PLUS_SIGNATURE_PARAMS_LABEL_BYTES,
        CredentialSchema.essential()
      )
      passportService.description = Buffer.from(realParams.toBytes()).toString('base64')
    } else {
      realParams = new BBSPlusSignatureParamsG1(
        BBSPlusSignatureParamsG1.valueFromBytes(Buffer.from(passportService.description, 'base64'))
      )
    }
    let publicKey: BBSPlusPublicKeyG2
    let realKeypair: BBSPlusKeypairG2 | undefined
    if (keypair || passportService.apiUrl == null) {
      realKeypair = BBSPlusKeypairG2.generate(realParams)
      publicKey = realKeypair.publicKey
      passportService.apiUrl = JSON.stringify({ publicKey: publicKey.hex, did })

      await servRes.put({
        serviceId: secretId,
        name: 'Dock.io - Sercret key service - New Belarus Passport',
        createdAt: new Date(),
        description: 'Attention it\'s stored encrypt - make sure you have BBS wrapping key generated and provided via env variables',
        apiUrl: await dbHelper.encryptSecretKey(realKeypair.secretKey.hex)
      })
    } else if (did != null || !passportService.apiUrl.startsWith('{')) {
      const serviceData: NBServiceData = passportService.apiUrl.startsWith('{')
        ? JSON.parse(passportService.apiUrl)
        : { publicKey: passportService.apiUrl, did }
      if (did != null) {
        serviceData.did = did
      }
      params = true
      passportService.apiUrl = JSON.stringify(serviceData)
      publicKey = new BBSPlusPublicKeyG2(BBSPlusPublicKeyG2.fromHex(serviceData.publicKey).bytes)
    } else {
      const serviceData: NBServiceData = JSON.parse(passportService.apiUrl)
      publicKey = new BBSPlusPublicKeyG2(BBSPlusPublicKeyG2.fromHex(serviceData.publicKey).bytes)
    }
    if (wrap) {
      const secretService = await servRes.get(secretId)
      if (secretService != null && !secretService.apiUrl.startsWith(WRAPPED_PERFIX)) {
        secretService.apiUrl = await dbHelper.encryptSecretKey(secretService.apiUrl)
        await servRes.put(secretService)
        const rawSk = await dbHelper.decryptSecretKey(secretService.apiUrl)
        realKeypair = new BBSPlusKeypairG2(new BBSPlusSecretKey(rawSk), publicKey)
      }
    }
    if (params || keypair) {
      await servRes.put(passportService)
    }

    console.info('Signature params: \n')
    console.info(passportService.description)
    console.info('')
    console.info('Public key hex: \n')
    console.info(passportService.apiUrl)
    console.info('')

    if (realKeypair != null) {
      console.info('!!! Atention it\'s extremly private information !!! Private key hex: \n')
      console.info(realKeypair.secretKey.hex)
      console.info('')
    }

    process.exit()
  }
}

export interface DockPassportCommandModule extends CommonModule<{
  params: boolean
  keypair: boolean
  wrap: boolean
  auth: string
  did?: string
}> { }
