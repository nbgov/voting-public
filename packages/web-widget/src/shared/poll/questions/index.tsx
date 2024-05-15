import type { FC } from 'react'
import type { PollQuestionProps } from './types'
import type { PartyChoice, PollInfo } from '@smartapps-poll/common'
import { RENDERER_PARTY } from '@smartapps-poll/common'
import { PartyPollQuestions } from './party'
import { DefaultPollQuestion } from './default'

export const PollQuestion: FC<PollQuestionProps> = ({ field, index, poll }) => {
  switch (poll.uiType) {
    case RENDERER_PARTY:
      return <PartyPollQuestions field={field} index={index} poll={poll as PollInfo<PartyChoice>} />
  }
  return <DefaultPollQuestion field={field} index={index} poll={poll} />
}
