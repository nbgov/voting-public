import type { FieldArrayWithId } from 'react-hook-form'
import type { VoteForm } from '../types'
import type { ChoiceMeta, PollInfo } from '@smartapps-poll/common'

export interface PollQuestionProps<Meta extends ChoiceMeta = ChoiceMeta> {
  index: number
  field: FieldArrayWithId<VoteForm, 'questions'>
  poll: PollInfo<Meta>
}
