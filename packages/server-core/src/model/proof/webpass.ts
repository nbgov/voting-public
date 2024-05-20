import { ALLOWED_COUNTRIES, WEBPASS_STRATEGY } from '@smartapps-poll/common'
import { PollResource } from '../../resources/poll'
import type { AuthorizeResourceHandler, ProofService } from '../../resources/types'
import type { Context } from '../../types'
import { VeriffStatus, type VeriffHookDecision } from '../veriff/types'
import { ProofError, ServiceError } from '../../resources/errors'
import type { ProofResouce } from '../../resources/proof'
import { DEDUPLICATION_FIELD_VALUE } from '../../resources/consts'
import dayjs from 'dayjs'

export const makeAuthorizeWpResourceHandler = (ctx: Context, proofService: ProofService): AuthorizeResourceHandler => async (resourceId, creds, options) => {
  const pollRes: PollResource = ctx.db.resource('poll')
  const poll = options?.poll ?? await pollRes.get(resourceId, 'externalId')
  if (poll == null) {
    return false
  }
  if (creds[0] == null) {
    return false
  }
  const decision = creds[0] as VeriffHookDecision
  if (decision?.status !== VeriffStatus.Success) {
    return false
  }
  const requiredProof = poll.requiredProofs?.find(proof => proof.type === WEBPASS_STRATEGY)
  if (requiredProof == null) {
    throw new ServiceError('service.unsupported')
  }
  // @TODO Double check service signature — ideally all KYC 
  // services should be presented as other authorization services in the system

  // Verify if the person parameters match criteria
  const birthdate = dayjs(decision?.verification?.person?.dateOfBirth)
  if (!birthdate.isBefore(dayjs().subtract(18, 'years'))) {
    console.log('wrong age')
    throw new ProofError('unallowed.age')
  }
  if (!ALLOWED_COUNTRIES.includes(decision?.verification?.document?.country)) {
    console.log('wrong country')
    throw new ProofError('unallowed.country')
  }

  // Start dediplication
  if (decision?.verification?.person?.idNumber == null) {
    throw new ProofError('document.malformed')
  }
  const hash = await proofService.hash(resourceId, decision.verification.person.idNumber)
  const proofRes: ProofResouce = ctx.db.resource('proof')
  const proof = await proofRes.service.createLasting(hash, DEDUPLICATION_FIELD_VALUE, resourceId)

  if (proof != null) {
    return true
  }

  return false
}
