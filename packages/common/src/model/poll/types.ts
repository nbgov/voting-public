import { type Member } from '../organization'
import { type ContentImage } from '../utils/types'

export interface Poll<Meta extends ChoiceMeta = ChoiceMeta> {
  _id: string
  title: string
  code?: string
  header: string
  description?: string
  serviceId: string
  orgId: string
  managerId?: string
  status: PollStatus
  uiType?: string
  manual: boolean
  strictRegistration: boolean
  registrationEnd: Date
  startDate: Date
  endDate: Date
  createdAt: Date
  externalId?: string
  census: Census
  requiredProofs?: RequiredProof[]
  questions?: Question<Meta>[]
}

export interface RequiredProof<T extends Record<string, unknown> = Record<string, unknown>> {
  _id: string
  type: string
  guideUrl?: string
  isMandatory?: boolean
  meta?: T
}

export interface NewPoll<Meta extends ChoiceMeta = ChoiceMeta> extends Partial<Poll<Meta>> {
  title: string
}

export interface PollInfo<Meta extends ChoiceMeta = ChoiceMeta> extends Omit<Poll<Meta>, 'census'> {
  census?: Census
  manager?: Member
}

export enum PollStatus {
  UNPUBLISHED = 'unpublished',
  PUBLISHED = 'published',
  STARTED = 'started',
  PAUSED = 'paused',
  CANCELED = 'canceled',
  FINISHED = 'finished'
}

export interface Census {
  url?: string
  token?: string
  externalId: string
  type?: string
  size?: number
  status: CensusStatus
}

export enum CensusStatus {
  UNPUBLISHED = 'unpublished',
  PUBLISHED = 'published'
}

export interface Question<Meta extends ChoiceMeta = ChoiceMeta> {
  title: string
  description?: string
  choices: Choice<Meta>[]
}

export interface Choice<Meta extends ChoiceMeta = ChoiceMeta> {
  title: string
  value: number
  meta?: Meta
}

export interface ChoiceMeta {}

export interface PartyChoice {
  avatar: ContentImage
}

export interface PollResult {
  externalId: string
  startDate: Date
  endDate: Date
  census: Census & {
    size: number
    weight: bigint
  }
  maxCensusSize?: number
  status: string
  voteCount: number
  finished: boolean
  electionCount: number
  questions: QuestionResult[]
}

export interface QuestionResult extends Question {
  choices: ChoiceResult[]
}

export interface ChoiceResult extends Choice {
  result: string
  share: number
  winner: boolean | undefined
  count: number
  selected?: boolean
}

export interface PollRegistrationInfo {
  valid: boolean
  exists: boolean
  voted: boolean
  allowed: boolean
}

export interface VoteInfo {
  tx: string
  externalId: string
  result: number[] // Array<Array<string>>
  externalPollID: string
  overwriteCount: number
  date: Date
}
