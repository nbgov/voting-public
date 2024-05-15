import type { User } from '@smartapps-poll/common'

export interface VocdoniStepData {
  votingId: string
  user?: User
  authType: string
  step?: string
  authData: Array<{ payload: string } | string>
}

export type VocdoniStepResult = { signature: string } | { token: string }

export interface VocdoniSignData {
  votingId: string
  user?: User
  authType: string
  token: string
  payload: string
}

export interface CensusRegisterData {
  user?: User
  id?: string
}

export interface CensusProofData {
  address?: string
  user?: User
  id?: string
}

export type CensusProofResult = {} | null
