import type { Request } from 'express'
import type { VeriffHookAction, VeriffHookDecision, VeriffHookRequest, VeriffRiskPart } from './types'
import { signVeriffPayload } from './hmac-sign'
import type { Config } from '../../types'
import dayjs from 'dayjs'
import { VERIFF_MISSED_RISK_LABEL, VERIFF_SUSPICIOUS_THRESHOLD, veriffAllCateogries, veriffSuspiciousLabels } from './consts'

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

export const isVeriffRecordSafe = (risk: VeriffRiskPart): [boolean, number] => {
  if (risk == null) {
    return [true, -1]
  }
  if (risk.riskScore != null) {
    if (risk.riskScore.score > VERIFF_SUSPICIOUS_THRESHOLD) {
      return [false, risk.riskScore.score]
    }
  }
  if (risk.riskLabels != null) {
    if (risk.riskLabels.some(
      label => label.label == null || label.label === '' || label.label === VERIFF_MISSED_RISK_LABEL
    )) {
      return [false, risk.riskScore?.score ?? -1]
    }
    if (risk.riskLabels.some(label => veriffSuspiciousLabels.includes(label?.label))) {
      return [false, risk.riskScore?.score ?? -1]
    }
  }

  return [true, risk.riskScore?.score ?? -1]
}

export const filterVeriffRecord = (risk: VeriffRiskPart): VeriffRiskPart => {
  if (risk == null) {
    return {}
  }
  return {
    riskScore: risk.riskScore,
    riskLabels: risk.riskLabels?.map(label => ({ label: label.label, category: label.category })) ?? []
  }
}

export const stabPassportInDevMode = (config: Config, decision: VeriffHookDecision): VeriffHookDecision => {
  const { document, person } = decision.verification
  if (config.devMode && document?.validUntil == null && document != null && person != null) {
    console.log('STAB DEV PASSPORT')
    document.validUntil = dayjs().add(1, 'year').toISOString()
    person.dateOfBirth = dayjs().subtract(19, 'years').toISOString()
    person.idNumber = '4190686A040PB3'
    if (Math.random() < 0.5) {
      console.log('ADD RISK TO STAB PASSPORT')
      decision.verification.riskScore = { score: Math.random() }
      decision.verification.riskLabels = []
      const count = veriffSuspiciousLabels.length
      for (let i = 0; i <= Math.floor(Math.random() * count); ++i) {
        decision.verification.riskLabels.push({
          label: veriffSuspiciousLabels[Math.floor(Math.random() * count)],
          category: veriffAllCateogries[Math.floor(Math.random() * 3)]
        })
      }
    }
  }

  return decision
}
