import { type RequiredProofAction } from '../strategy/types'

export interface PsHookRequest {
  publicServiceDid: string
  subscriberConnectDid: string
  actionId: string
  actionInstanceId: string
  actionEventId: string
  actionParams: PsField[]
  receivedCredentials: PsCredential[]
}

export interface PsHookResponse {
  serviceDid: string
  subscriberConnectDid: string
  actionEventId?: string
  subscriberEventId?: string
  messageType?: string
  issuedCredentials?: PsCredential[]
  credentials?: PsCredential[]
  revokedCredentials: PsCredential[]
  ok: boolean
  error?: {
    message: string
  }
}

export interface PsIssue extends Omit<PsHookResponse, "ok" | "revokedCredentials"> {
  actionTemplate?: string 
}

export interface PsCredential {
  schemaId?: string
  credentialId: string
  credWalletId?: string
  fields: PsField[]
  utcIssuedAt?: number
  revoked?: boolean
  utcRevokedAt?: number
}

export interface PsActionTemplate extends RequiredProofAction {
  actionId: string
  actionName: string
  description: string
  media: Array<{ type: string }>
  credentialsRequired: string[]
  credentialsIssued: string[]
  predicates: PsActionPredicate[]
  actionInstances: PsActionInstance[]
}

export interface PsActionInstance {
  id: string
}

export interface PsActionPredicate {
  onlyLast: boolean
  fromActionQRCode: boolean
  credentialId: string
  fields: string[]
}

export interface PsField {
  name: string
  value: string
}

export interface EmptyPsSubject extends Record<string, unknown> {
}

export interface CommonPsSubject extends EmptyPsSubject {
  issuedAt: string
}

export interface TelegramPsSubject extends CommonPsSubject {
  telegramId: string
  nickname: string
  name: string
  golos: number
  cyberVoter: number
}

export interface PassportPsSubject extends CommonPsSubject {
  nationalId: string,
  countryCode: string,
  birthdate: number
}

export interface KeystoreSubject extends CommonPsSubject {
  store: string
  address: string
}

export interface RegistrationPsSubject extends KeystoreSubject {
  token: string
}

export interface AsyncRegistrationPsSubject extends EmptyPsSubject {
  token: string
  address: string
}

export interface AuthPsSubject extends CommonPsSubject {
  token: string
  resource?: string
}
