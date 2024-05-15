import { type Choice, type ChoiceResult, type PollInfo, type Question } from '@smartapps-poll/common'

export interface PollHelper {
  getPollStrategy: (poll: PollInfo | undefined) => Promise<string>
  challenge: (poll: PollInfo | undefined) => Promise<boolean>
  isPsAuthenticationRequired: (poll: PollInfo | undefined) => Promise<boolean>
  vote: (poll: PollInfo | undefined, answers: IQuestion[]) => Promise<[boolean, string]>
}

export interface IChoice extends Choice {
  selected: boolean
  result?: string
}

export interface IQuestion extends Question {
  choices: Array<IChoice | ChoiceResult>
}

export interface StoreHelper {
  save: <T>(key: string, value: T) => Promise<boolean>

  get: <T>(key: string) => Promise<T>

  has: (key: string) => Promise<boolean>

  storeVote: (poll: PollInfo, voteId: string, votes?: Question[]) => Promise<boolean>

  loadVote: (poll: PollInfo) => Promise<string>

  loadVotes: (voteId: string) => Promise<Question[]>
}
