import type { Context } from '../../types'
import type { IntegrationService, NBServiceData, RequiredProof, TgProofMeta, NBTgSubject, PassportSubject } from '@smartapps-poll/common'
import { ALLOWED_COUNTRIES, CRED_TYPE_NEWBELARUSPASSPORT, CRED_TYPE_NEWBELARUSTELEGRAM, NEWBELARUS_STRATEGY, TELEGRAM_STRATEGY } from '@smartapps-poll/common'
import type { AuthorizeResourceHandler, ProofService } from '../../resources/types'
import type { PollResource } from '../../resources/poll'
import { DEDUPLICATION_FIELD_VALUE } from '../../resources/consts'
import type { ProofResouce } from '../../resources/proof'
import { BBSPlusPublicKeyG2, Presentation } from '@docknetwork/crypto-wasm-ts'
import { NEWBELARUS_DECENTRALIZED_SERVICE_PREFIX, findParticularCredInNbPresentation, prepareNewBelarusActionRequest, prepareNewBelarusActionTypes } from '../newbelarus'
import { ProofError, ServiceError } from '../../resources/errors'
import type { ServiceResource } from '../../resources/service'
import { assertTgCredSufficienty } from '../nb/tg-validators'
import dayjs from 'dayjs'

export const makeAuthorizeNbResourceHandler = (ctx: Context, proofService: ProofService): AuthorizeResourceHandler => async (resourceId, creds, options) => {
  const pollRes: PollResource = ctx.db.resource('poll')
  const poll = options?.poll ?? await pollRes.get(resourceId, 'externalId')
  if (poll == null) {
    return false
  }

  const presentations = creds as Presentation[]
  // Get all relevant conditions from proof list
  const conditions = prepareNewBelarusActionRequest(poll)
  if (conditions.length < 1) {
    throw new ServiceError('service.unsupported')
  }
  const credTypes = prepareNewBelarusActionTypes(poll)
  const srvRes: ServiceResource = ctx.db.resource('service')
  // Geting map of service types to service objects that allow to process respective relevant conditions
  const credServices: { [key: string]: IntegrationService } = (
    await srvRes.service.getCredPublicServices(credTypes.map(
      type => `${NEWBELARUS_DECENTRALIZED_SERVICE_PREFIX}${type}`
    ))
  ).reduce((list, service) => ({ ...list, [serviceIdToServiceType(service.serviceId, credTypes)]: service }), {})

  if (Object.entries(credServices).length == 0) {
    throw new ServiceError('service.no.cred')
  }
  // All supported processing services right now are offline crypto validators, 
  // so we just extract cripto materials from loaded service objects
  const servicesData: { [key: string]: NBServiceData } = Object.entries(credServices).reduce(
    (list, [, service]) => ({ ...list, [serviceIdToServiceType(service.serviceId, credTypes)]: JSON.parse(service.apiUrl) }), {}
  )

  // In current implementation we expect that all conditions should be equally met
  for (const condition of conditions) {
    // We pick a condition related presetantion from the wallet repsonse, considering one condition = one presentation
    const pres = presentations.find(pres => condition.credentialsRequired.every(
      (type, idx) => findParticularCredInNbPresentation([pres], type) != null
        || (condition.optionalCredentials != null && condition.optionalCredentials[idx] === true)
    ))
    if (pres == null) {
      throw new ProofError('no.proof')
    }

    // We validate presentation with crypto materials from respective service 
    const publicKeys: BBSPlusPublicKeyG2[] = []
    for (const type of condition.credentialsRequired) {
      const credService = credServices[type]
      if (credService == null) {
        throw new ProofError('service.no.cred')
      }
      const serviceData = servicesData[type]
      publicKeys.push(new BBSPlusPublicKeyG2(BBSPlusPublicKeyG2.fromHex(serviceData.publicKey).bytes))
    }
    const verifResult = pres.verify(publicKeys)
    if (!verifResult.verified) {
      throw new ProofError(verifResult.error)
    }

    /**
     * @TODO We disabled Tg cred mandatory request by never asking it to be merged in when we call:
     * * prepareNewBelarusActionRequest
     * * prepareNewBelarusActionTypes
     */
    const tgCred = poll.requiredProofs?.find(proof => proof.type === TELEGRAM_STRATEGY) as RequiredProof<TgProofMeta> | undefined
    // We validate and deduplicate separate creds from presentation one by one. 
    // We need to make sure that the request was properly satisfied.
    for (let idx = 0; idx < condition.credentialsRequired.length; ++idx) {
      const type = condition.credentialsRequired[idx]
      const credService = credServices[type]
      if (credService == null) {
        throw new ProofError('service.no.cred')
      }
      const serviceData = servicesData[type]
      // We check if the presetnation contains requested credential and it's issued by an expected issuer (issuers in the future)
      const cred = findParticularCredInNbPresentation([pres], type)
      /**
       * @TODO Remove tg related hardcoded behaviour
       * In cases when Tg creredential is requested alongside another creds, and this Tg cred satifies
       * person verification criteria, we can ignore absence of another credentials.
       */
      if (cred == null) {
        if (assertTgCredSufficienty(presentations, tgCred)) {
          continue
        }
      }
      if (cred?.issuer !== serviceData.did) {
        throw new ProofError('issuer.missed')
      }

      condition.fieldsToReveal[idx].forEach(field => {
        const value = reduceValue(cred, field)
        if (value == null) {
          throw new ProofError('presentation.malformed')
        }
      })

      let dedupHash: string
      let dedupSource: string
      // System support only two well structured creds right now so we just hardcoded validation
      // and deduplication of these credentials here.
      switch (cred.type) {
        case CRED_TYPE_NEWBELARUSPASSPORT: {
          const subject = cred.credentialSubject as unknown as PassportSubject

          const birthdate = dayjs(subject.dateOfBirth)
          if (!birthdate.isBefore(dayjs().subtract(18, 'years'))) {
            console.log('wrong age')
            throw new ProofError('unallowed.age')
          }
          if (!ALLOWED_COUNTRIES.includes(subject.country)) {
            console.log('wrong country')
            throw new ProofError('unallowed.country')
          }

          if (ctx.config.newbelarus.keyField in subject
            && typeof subject[ctx.config.newbelarus.keyField] === 'string') {
            dedupHash = await proofService.hash(resourceId, subject[ctx.config.newbelarus.keyField] as string)
            dedupSource = DEDUPLICATION_FIELD_VALUE
          } else {
            dedupHash = await proofService.hash(resourceId, cred)
            dedupSource = NEWBELARUS_STRATEGY
          }
          break
        }
        case CRED_TYPE_NEWBELARUSTELEGRAM: {
          const subject = cred.credentialSubject as unknown as NBTgSubject
          dedupHash = await proofService.hash(resourceId, subject.id.toString())
          dedupSource = TELEGRAM_STRATEGY
          break
        }
        default:
          throw new ProofError('unknown.credential')
      }
      // If deduplication materials are already presentated, the proof resource won't return
      // a new proof object. In this case we think that the deduplication is failed and we 
      // are safe to denie voting authorization.
      const proofRes: ProofResouce = ctx.db.resource('proof')
      const proof = await proofRes.service.createLasting(dedupHash, dedupSource, resourceId)
      if (proof == null) {
        return false
      }
    }
  }

  return true
}

const serviceIdToServiceType = (id: string, types: string[]): string => {
  return types.find(type => id.endsWith(type)) as string
}

const reduceValue = (cred: Record<string, unknown> | unknown, key: string): unknown | undefined | Record<string, unknown> => {
  const parts = key.split('.', 2)
  if (parts.length > 1) {
    if (typeof cred !== 'object' || cred == null) {
      return undefined
    }
    return reduceValue((cred as Record<string, unknown>)[parts[0]], parts[1])
  }
  if (typeof cred !== 'object' || cred == null) {
    return undefined
  }
  return (cred as Record<string, unknown>)[key]
}
