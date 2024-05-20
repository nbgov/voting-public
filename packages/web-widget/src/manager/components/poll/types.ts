import type { PollInfo,CensusTypeValues, Poll, ChoiceMeta } from '@smartapps-poll/common'
import type { UseFieldArrayRemove, FieldArrayWithId } from 'react-hook-form'

export interface EditForm<Meta extends ChoiceMeta = ChoiceMeta> extends Omit<Partial<Poll<Meta>>, '_id' | 'serviceId' | 'managerId' | 'orgId' | 'externalId' | 'createdAt'> {
}

export interface PollQuestionProps<Meta extends ChoiceMeta = ChoiceMeta> {
  poll: PollInfo
  index: number
  field: FieldArrayWithId<EditForm<Meta>>
  remove: UseFieldArrayRemove
}

export interface PollChoiceProps<Meta extends ChoiceMeta = ChoiceMeta> extends PollQuestionProps<Meta> {
  parent: number
}

export interface PollCreationForm {
  title: string
  code: string
  credSources: CensusTypeValues[]
  requiredProofs: string[]
  proofGuideUrl: string
  uiType: boolean
  allowWebPass: boolean
  tg: {
    requireId: boolean
    botUrl: string
    validators: string[]
  }
  census: {
    size: number
    type: string
  }
}
