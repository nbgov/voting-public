import { VoteError } from '@smartapps-poll/common'
import { type IChoice, type IQuestion } from '@smartapps-poll/web-common'
import { AXIOS_ERROR_CODE_ONDUPLICATION } from './consts'
import { type AxiosError } from 'axios'

export const filterAnswers = (questions: IQuestion[]): IQuestion[] => questions.map(
  question => ({ ...question, choices: question.choices.filter(choice => (choice as IChoice).selected) })
)

export const assertProofspaceErrorAboutPossibleDuplication = (error: Error): void => {
  if (error instanceof Error && Object.hasOwn(error, 'raw')) {
    const axe = (error as unknown as Record<string, unknown>)['raw'] as AxiosError
    if (axe?.response?.status === AXIOS_ERROR_CODE_ONDUPLICATION) {
      throw new VoteError('duplication')
    }
  }
}
