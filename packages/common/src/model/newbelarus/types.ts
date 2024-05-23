import { type RequiredProofAction } from '../strategy'

export interface DockActionTemplate extends RequiredProofAction {
  actionId: string
  credentialsRequired: string[]
  fieldsToReveal: string[][]
  allowedIssuers?: string[]
  optionalCredentials?: boolean[]
}

export interface DockActionRequest extends DockActionTemplate {
  challenge: string // hex string of the nonce
}

export interface DockCredential<Subject extends {} = {}> extends Record<string, unknown> {
  holder?: string
  issuer?: string
  id: string
  type: string
  credentialSubject: Subject & {
    id: string
  }
}

export interface PassportSubject extends Record<string, unknown> {
  personId: string
  dateOfBirth: string
  country: string
  meta?: string
}

export interface NBTgSubject extends Record<string, unknown> {
  id: number
  hasGolos: boolean
}

export interface NBServiceData {
  publicKey: string
  did: string
}

export interface DockActionToW3CReason extends Record<string, string> { }

export interface NBRiskPayload {
  risk?: {
    score?: number
    labels?: NBRiskLabel[]
  }
}

export interface NBRiskLabel {
  name: string
  label?: string
  category: string
}
