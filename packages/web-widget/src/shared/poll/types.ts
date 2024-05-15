import { type IQuestion } from '@smartapps-poll/web-common'

export interface VoteForm {
  questions: IQuestion[]
}

export interface VoteIdForm {
  voteId: string
}
