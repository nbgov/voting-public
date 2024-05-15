import { POLL_CHOICE_MAX, POLL_QUESTION_MAX } from './consts'
import { type NewPoll, type Poll, type PollInfo, PollStatus, Choice, PartyChoice, ChoiceMeta, Question } from './types'
import 'dayjs/plugin/duration.js'
import days from 'dayjs'
import type { Duration } from 'dayjs/plugin/duration.js'
import { VOCDONI_CSP_CENSUSES } from '../vocdoni'
import { PROOFSPACE_STRATEGY } from '../proofspace'
import { TELEGRAM_STRATEGY } from '../telegram'
import { RENDERER_PARTY } from '../../ui'
import { ContentImageType } from '../utils'
import type { IQuestion } from '@vocdoni/sdk'

export const truncatePoll = (poll: PollInfo | NewPoll): PollInfo | NewPoll => {
  if (poll.questions == null) {
    return {
      ...poll,
      questions: [
        {
          title: '',
          description: '',
          choices: [
            prepareEmptyChoice(poll, 0),
            prepareEmptyChoice(poll, 1)
          ]
        }
      ]
    }
  }
  return {
    ...poll,
    questions: poll.questions.slice(0, POLL_QUESTION_MAX - 1).map(question => ({
      ...question, choices: question.choices.slice(0, POLL_CHOICE_MAX - 1)
    }))
  }
}

export const prepareEmptyChoice = <Meta extends ChoiceMeta>(poll: PollInfo<Meta> | NewPoll<Meta>, value: number): Choice<Meta> => {
  switch (poll.uiType) {
    case RENDERER_PARTY:
      return {
        title: '', value, meta: {
          avatar: { fullUrl: '', type: ContentImageType.Remote }
        }
      } as Choice<PartyChoice> as unknown as Choice<Meta>
  }

  return { title: '', value }
}

export const prepareQuestions = <Meta extends ChoiceMeta>(poll: PollInfo<Meta>): IQuestion[] => {
  switch (poll.uiType) {
    case RENDERER_PARTY:
      return [{
        title: { default: poll.title },
        description: { default: poll.description ?? '' },
        choices: poll.questions?.map((question, index) => ({
          title: { default: question.title },
          value: index
        })) ?? []
      }]
  }
  
  return poll.questions?.map(
    question => ({
      title: { default: question.title },
      description: { default: question.description ?? '' },
      choices: question.choices.map(choice => ({
        title: { default: choice.title },
        value: choice.value
      }))
    })
  ) ?? []
}

export const prepareViewQustions = <Meta extends ChoiceMeta>(poll: PollInfo<Meta>): Question[] => {
  const questions = prepareQuestions(poll)
  return questions.map(question => ({
    title: question.title.default,
    description: question.description?.default,
    choices: question.choices.map(choice => ({
      title: choice.title.default,
      value: choice.value
    }))
  }))
}

export const assertPoll = (poll: PollInfo | NewPoll): boolean => {
  if (poll.questions != null && poll.questions.length > POLL_QUESTION_MAX) {
    return false
  }

  return poll.questions?.some(question => question.choices.length > POLL_CHOICE_MAX) !== true
}

export const canAddQuestion = (poll: PollInfo | NewPoll): boolean => {
  return (poll.questions?.length ?? 0) < POLL_QUESTION_MAX
}

export const canAddChoice = (poll: PollInfo | NewPoll, index: number): boolean => {
  if (poll.questions == null || poll.questions[index] == null) {
    return false
  }
  return poll.questions[index].choices.length < POLL_CHOICE_MAX
}

export const isElectionOnline = (poll: Poll | PollInfo): boolean =>
  ![PollStatus.UNPUBLISHED, PollStatus.PUBLISHED].includes(poll.status)

export const isElectionEditable = (poll: Poll | PollInfo): boolean =>
  [PollStatus.UNPUBLISHED].includes(poll.status)

export const getRegistrationEndInterval = (poll: Poll | PollInfo): Duration =>
  days.duration(days(poll.registrationEnd).diff(days(new Date())))

export const getStartDateInterval = (poll: Poll | PollInfo): Duration =>
  days.duration(days(poll.startDate).diff(days(new Date())))

export const getEndDateInterval = (poll: Poll | PollInfo): Duration =>
  days.duration(days(poll.endDate).diff(days(new Date())))

export const isProofRequired = (poll: Poll | PollInfo): boolean =>
  poll.requiredProofs != null && poll.requiredProofs.length > 0

export const getProofStrategy = (poll: Poll | PollInfo, preferedStrategy?: string): string => {
  if (isProofRequired(poll) && poll.requiredProofs != null) {
    const proofs = poll.requiredProofs.filter(proof => proof.type !== TELEGRAM_STRATEGY).map(proof => proof.type)
    if (preferedStrategy != null && proofs.includes(preferedStrategy)) {
      return preferedStrategy
    }
    return proofs[0]
  }

  return PROOFSPACE_STRATEGY
}

export const isAuthroizationRequired = (poll: Poll | PollInfo): boolean =>
  isProofRequired(poll) && VOCDONI_CSP_CENSUSES.includes(poll.census?.type as string)
