import type { RequiredProof } from '../poll/types'

export interface TgUser {
  telegramId: string
  username: string
  name: string
  golos?: boolean
  cyberVoter?: boolean
}

export interface TgOptimizedUser {
  id: number
  lg: string
  gs?: boolean
}

export interface TgCyberPartizan {
  id: number
  voter?: boolean
}

export interface TgProofMeta extends Record<string, unknown> {
  botUrl: string
  validators?: string[]
  allowAny?: boolean
  allowInstead?: boolean
}

export interface TelegramRequiredProof extends RequiredProof<TgProofMeta> {
}
