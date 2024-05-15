import type { Request } from 'express'
import { type PsCredential, type AuthenticationMethod, type PsHookResponse, type User, type PsHookRequest, type PsIssue } from '@smartapps-poll/common'
import { type AuthenticationWithUser } from '../types'
import { type Context } from '../../../types'

export interface PsPubKeyJson {
  name: string
  publicKey: string
}

export interface UserWithPayload extends User {
  _payload: Partial<PsHookResponse>
}

export interface ProofspaceAuthenticationMethod extends AuthenticationMethod<undefined> {
  type: 'proofspace'
}

export type PsProcessPayload = (ctx: Context, params: PsProcessPayloadParams) => Promise<UserWithPayload>
export type PsLegayProcessPayload = (ctx: Context, params: PsProcessPayloadParams & { done: PsDoneCallback }) => Promise<void>

export interface PsProcessPayloadParams {
  request: PsHookRequest
  authCred?: PsCredential
  keystoreCred?: PsCredential
  auth?: AuthenticationWithUser
}

export type AllResponsesToPs = PsHookResponse | PsIssue

export type PsAuthCallback = (req: Request, done: PsDoneCallback) => Promise<void>

export type PsDoneCallback = (error: Error | null, user?: UserWithPayload) => void

export const AUTH_TYPE_PS = 'proofspace'

export const AUTH_PS_PUBNAME_PARAM = 'pubname'

export const DEFAULT_PROOFSPACE_NAME = 'Proofpsace Voter'

export const TERMINATION_PAYLOAD = 'terminate'
