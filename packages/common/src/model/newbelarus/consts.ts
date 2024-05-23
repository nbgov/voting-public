import { VOCDONI_CENSUS_CSP_BLINDNS, VOCDONI_CENSUS_CSP_NBNS } from '../vocdoni'
import { type DockActionTemplate } from './types'

export const NEWBELARUS_STRATEGY = 'newbelarus'

export const newbelarusAllowedCensus = [VOCDONI_CENSUS_CSP_NBNS, VOCDONI_CENSUS_CSP_BLINDNS]

export const CRED_TYPE_NEWBELARUSPASSPORT = 'NewBelarusPassport'

export const CRED_TYPE_NEWBELARUSTELEGRAM = 'NewBelarusTelegram'

export const SERVICE_PK_NEWBELARUSPASSPORT = 'Service:NewBelarusPassport:SecretKey'

/**
 * @TODO align with https://w3c-ccg.github.io/vp-request-spec/
 */
export const dockNBPasswportAction: DockActionTemplate = {
  type: NEWBELARUS_STRATEGY,
  actionId: 'NewBelarusPassportPersonalNumber',
  title: 'Passport personal number verification',
  credentialsRequired: [CRED_TYPE_NEWBELARUSPASSPORT],
  fieldsToReveal: [[
    'credentialSubject.personId', 
    'credentialSubject.dateOfBirth', 
    'credentialSubject.country', 
    'credentialSubject.meta',
    'type', 'holder', 'issuer'
  ]],
  allowedIssuers: [] // Put issuers public keys here during app initialization
}

export const dockNBTelegramAction: DockActionTemplate = {
  type: NEWBELARUS_STRATEGY,
  actionId: 'NewBelarusTelegramId',
  title: 'Telegram ID verification',
  credentialsRequired: [CRED_TYPE_NEWBELARUSTELEGRAM],
  fieldsToReveal: [['credentialSubject.id', 'credentialSubject.hasGolos', 'type', 'holder', 'issuer']],
  allowedIssuers: []
}

export const dockNBPrefedinedActions = [dockNBPasswportAction]

export const NEWBELARUS_MEDIATED_REQUEST_TYPE = 'MediatedMobileWalletPluginIteraction2023'
