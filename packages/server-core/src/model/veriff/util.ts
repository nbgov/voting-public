import type { Request } from 'express'
import type { VeriffHookAction, VeriffHookDecision, VeriffHookRequest } from './types'
import { signVeriffPayload } from './hmac-sign'
import type { Config } from '../../types'
import dayjs from 'dayjs'

export const isVeriffAction = (request: VeriffHookRequest): request is VeriffHookAction =>
  (request as VeriffHookAction).action != null

export const isVeriffDecision = (request: VeriffHookRequest): request is VeriffHookDecision =>
  (request as VeriffHookAction).action == null && (request as VeriffHookDecision).status != null

export const verifyHookRequest = (request: Request) => {
  const signature = request.header('x-hmac-signature')
  if (signature == null) {
    return false
  }
  const key = request.header('x-auth-client')
  if (key == null) {
    return false
  }
  if (request.context.config.veriff.key !== key) {
    return false
  }

  return signVeriffPayload(request.context.config.veriff.secret, JSON.stringify(request.body)) === signature
}

export const stabPassportInDevMode = (config: Config, decision: VeriffHookDecision): VeriffHookDecision => {
  const { document, person } = decision.verification
  if (config.devMode && document?.validUntil == null && document != null && person != null) {
    document.validUntil = dayjs().add(1, 'year').toISOString()
    person.dateOfBirth = dayjs().subtract(19, 'years').toISOString()
    person.idNumber = '4190686A040PB3' + Math.random()
  }

  return decision
}
