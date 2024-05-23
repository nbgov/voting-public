import type { User } from '@smartapps-poll/common'

export interface NBStartData {
  votingId: string
}

export interface NBVerifyData {
  votingId: string
  ip: string
  user: User
  body: Record<string, unknown>[]
}
