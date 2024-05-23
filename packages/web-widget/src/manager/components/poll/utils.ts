import {
  type Census, type Poll, type PollInfo, type RequiredProof,
  truncatePoll, EMPTY_ACTION, NEWBELARUS_STRATEGY, TELEGRAM_STRATEGY, type TgProofMeta,
  WEBPASS_STRATEGY,
  PollStatus
} from '@smartapps-poll/common'
import { type EditForm, type PollCreationForm } from './types'
import { type Context } from '../../../shared/types'
import { type TFunction } from 'i18next'
import { isCspCensus } from '../../../helpers'

export const buildEditFormData = (poll: PollInfo): EditForm => {
  const _poll = truncatePoll(poll) as EditForm
  if (poll.census?.size != null) {
    if (_poll.census == null) {
      _poll.census = {} as Census
    }
    _poll.census.size = poll.census?.size
  }

  return _poll
}

export const removePoll = async (_context: Context, _poll: PollInfo) => {
  _context.web
}

export const populateRequiredProofs = (_: Context, data: PollCreationForm): Partial<Poll> => {
  const requiredProofs: RequiredProof[] = []
  if (data.credSources != null && data.credSources.includes(NEWBELARUS_STRATEGY)) {
    requiredProofs.push(...data.credSources.map(
      (source, idx) => ({
        _id: data.requiredProofs[idx], type: source, guideUrl: data.proofGuideUrl
      })
    ))
  } else if (data.requiredProofs != null && data.requiredProofs.length > 0
    && data.requiredProofs[0] != '' && data.requiredProofs[0] != EMPTY_ACTION) {
    requiredProofs.push(...data.requiredProofs.map(
      (proof, idx) => ({
        _id: proof, type: data.credSources[idx], guideUrl: data.proofGuideUrl
      })
    ))
  }
  if (data.tg.requireId) {
    requiredProofs.push({
      _id: 'telegramId', type: TELEGRAM_STRATEGY, guideUrl: data.proofGuideUrl,
      isMandatory: false, meta: {
        botUrl: data.tg.botUrl,
        ...(data.tg.validators != null && data.tg.validators.length > 0 ? {
          allowAny: true,
          allowInstead: true,
          validators: data.tg.validators
        } : {})
      } as TgProofMeta
    })
  }
  if (data.allowWebPass) {
    requiredProofs.push({
      _id: "webPass", type: WEBPASS_STRATEGY, guideUrl: data.proofGuideUrl
    })
  }

  return { requiredProofs }
}

export const makeCodeValidationRules = (t: TFunction) => ({
  minLength: { value: 0, message: t('error.code') ?? '' },
  maxLength: { value: 12, message: t('error.code') ?? '' },
  pattern: { value: /^([A-Z]|[0-9]|[-:#])*$/, message: t('error.code') ?? '' }
})

export const isStatusEditable = (poll: PollInfo): boolean => !(
  isCspCensus(poll)
    ? [PollStatus.UNPUBLISHED, PollStatus.PUBLISHED].includes(poll.status)
    : PollStatus.UNPUBLISHED === poll.status
)
