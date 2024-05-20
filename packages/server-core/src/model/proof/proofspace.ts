import type { Context } from '../../types'
import { PROOFSPACE_STRATEGY, castPassportFromPs, type PsCredential } from '@smartapps-poll/common'
import type { AuthorizeResourceHandler, ProofService } from '../../resources/types'
import type { PollResource } from '../../resources/poll'
import { DEDUPLICATION_FIELD_VALUE } from '../../resources/consts'
import type { ProofResouce } from '../../resources/proof'
import dayjs from 'dayjs'

export const makeAuthorizePsResourceHandler = (ctx: Context, proofService: ProofService): AuthorizeResourceHandler => async (resourceId, creds, options) => {
  const pollRes: PollResource = ctx.db.resource('poll')
  const poll = options?.poll ?? await pollRes.get(resourceId, 'externalId')

  if (poll == null) {
    return false
  }

  const _creds = creds as PsCredential[]
  // We extract all Proofspace verification conditions from the poll and check if all
  // required credentials are passed
  const conditions = proofService.getProofConditions(poll)
  if (conditions.every(descr => _creds.some(cred => descr.id === cred.credentialId))) {
    /**
     * @TODO Unhardcode
     * Right now we literally can support any credential as a whole or just Veriff
     * passport with some passport speicifc set of conditions.
     * So we just check if there is passport verification condition in the condition list
     * and process just passport or everything else as a whole. 
     */
    const passCondition = conditions.find(
      condition => condition.id === ctx.config.proofspace.passportCred.credentialId
    )
    let dedupHash: string
    let dedupSource: string
    if (passCondition != null) {
      // Verify and deduplicate just passport if it's requested
      const cred = _creds.find(
        cred => cred.schemaId === ctx.config.proofspace.passportCred.schemaId
          && cred.credentialId === ctx.config.proofspace.passportCred.credentialId
      )
      if (cred == null) {
        return false
      }
      const passField = cred.fields.find(field => field.name === ctx.config.proofspace.passportCred.keyField)
      if (passField == null) {
        return false
      }
      const passport = castPassportFromPs(cred)
      if (!ctx.config.proofspace.allowrdCountries.includes(passport.countryCode)) {
        console.log('wrong country')
        return false
      }
      const birthdate = dayjs(new Date(
        passport.birthdate * ctx.config.proofspace.passportCred.birthdateMultiplier * 1000
      ))
      if (!birthdate.isBefore(dayjs().subtract(18, 'years'))) {
        console.log('wrong age')
        return false
      }

      dedupHash = await proofService.hash(resourceId, passField.value)
      dedupSource = DEDUPLICATION_FIELD_VALUE
    } else {
      // Deduplicate by everything else (it's ok cause proofpsace authorizes only be predefined set of mandatory creds)
      dedupHash = await proofService.hash(resourceId, _creds)
      dedupSource = PROOFSPACE_STRATEGY
    }

    /**
     * @TODO Further development
     * Right now we make additional telegram verification by stored tg cred associated with user session.
     * Otherwise we need to implement support of multiple proofspace interactions for different combination
     * of credentials present (Proofspace supports only predefined mandatory set of creds within on interaction boundaries)
     * 
     * @TODO We disabled Tg cred mandatory check by never asking it to be really checked in this call:
     * * processTgCondition
     */
    const tgCheck = await proofService.processTgCondition(poll, options?.tgUser)
    if (tgCheck.required && !tgCheck.result) {
      console.log('tg check failed')
      return false
    }

    // If deduplication materials are already presentated, the proof resource won't return
    // a new proof object. In this case we think that the deduplication is failed and we 
    // are safe to denie voting authorization.
    const proofRes: ProofResouce = ctx.db.resource('proof')
    const proof = await proofRes.service.createLasting(dedupHash, dedupSource, resourceId, poll.endDate)
    if (proof == null) {
      console.log('voting proof failed')
      return false
    }
    if (!await proofService.commitTgCondition(poll, tgCheck)) {
      console.log('tg commit failed')
      return false
    }

    return true
  }

  return false
}
