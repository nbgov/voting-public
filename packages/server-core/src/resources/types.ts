import type { Presentation } from '@docknetwork/crypto-wasm-ts'
import type { Poll, PollInfo, PsCredential, TgUser } from '@smartapps-poll/common'
import { VeriffHookDecision } from '../model/veriff/types'

export interface AuthResourceOptions {
  strategy?: string
  tgUser?: TgUser
  poll?: Poll
}

export interface TgConditionResults {
  result: boolean
  required: boolean
  dedup: string
}

export interface ProofService {
  hash: (resourceId: string, value: Object | string) => Promise<string>
  processTgCondition: (poll: Poll, user?: TgUser, shouldCheck?: boolean) => Promise<TgConditionResults>
  commitTgCondition: (poll: Poll, check: TgConditionResults) => Promise<boolean>
  authorizeResource: AuthorizeResourceHandler
  authorizePsResource: AuthorizeResourceHandler
  authorizeNbResource: AuthorizeResourceHandler
  authorizeWpResource: AuthorizeResourceHandler
  getProofConditions: (poll: Poll | PollInfo) => Array<{ source: string, id: string }>
}

export interface AuthorizeResourceHandler {
  (resourceId: string, creds: Presentation[] | PsCredential[] | VeriffHookDecision[], options?: AuthResourceOptions): Promise<boolean>
}
