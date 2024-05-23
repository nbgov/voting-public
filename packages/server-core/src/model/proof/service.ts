import { NEWBELARUS_STRATEGY, PROOFSPACE_STRATEGY, filterProofspaceRequiredCreds, advancedHash, TELEGRAM_STRATEGY, WEBPASS_STRATEGY } from '@smartapps-poll/common'
import type { PsActionTemplate, TelegramRequiredProof } from '@smartapps-poll/common'
import type { Context } from '../../types'
import type { PollResource } from '../../resources/poll'
import type { ProofResouce } from '../../resources/proof'
import type { ProofService } from './types'
import { makeAuthorizePsResourceHandler } from './proofspace'
import { makeAuthorizeNbResourceHandler } from './newbelarus'
import { makeAuthorizeWpResourceHandler } from './webpass'

export const buildProofService = (ctx: Context): ProofService => {
  const _service: ProofService = {
    hash: (resourceId, value) =>
      advancedHash(ctx.config.salt, `${resourceId}.${typeof value === 'string' ? value : JSON.stringify(value)}`),

    processTgCondition: async (poll, user, shouldCheck) => {
      if (shouldCheck != null && shouldCheck) {
        const tgProof = poll.requiredProofs?.find(proof => proof.type === TELEGRAM_STRATEGY) as TelegramRequiredProof
        if (tgProof != null) {
          if (user?.telegramId == null) {
            return { result: false, required: true, dedup: '' }
          }
          const reosourceId = poll.externalId ?? poll._id
          const dedup = await _service.hash(reosourceId, user.telegramId)
          const proofRes: ProofResouce = ctx.db.resource('proof')
          const proof = await proofRes.service.load(dedup, TELEGRAM_STRATEGY, poll.externalId ?? poll._id)
          if (proof != null) {
            return { result: false, required: true, dedup }
          }

          return { result: true, required: true, dedup }
        }
      }

      return { result: true, required: false, dedup: '' }
    },

    commitTgCondition: async (poll, check) => {
      const proofRes: ProofResouce = ctx.db.resource('proof')
      if (poll.externalId == null) {
        return false
      }
      if (check.dedup != null && check.dedup != '') {
        const proof = await proofRes.service.createLasting(check.dedup, TELEGRAM_STRATEGY, poll.externalId, poll.endDate)
        if (proof == null) {
          return false
        }
      }

      return true
    },

    authorizeNbResource: async () => false,

    authorizePsResource: async () => false,

    authorizeWpResource: async () => false,

    authorizeResource: async (resourceId, creds, options) => {
      let strategy = options?.strategy
      const pollRes: PollResource = ctx.db.resource('poll')
      const poll = await pollRes.get(resourceId, 'externalId')

      if (poll != null && poll.requiredProofs != null) {
        if (strategy == null) {
          if (poll.requiredProofs.every(proof => proof.type === PROOFSPACE_STRATEGY)) {
            strategy = PROOFSPACE_STRATEGY
          } else if (poll.requiredProofs.every(proof => proof.type === NEWBELARUS_STRATEGY)) {
            strategy = NEWBELARUS_STRATEGY
          } else if (poll.requiredProofs.every(proof => proof.type === WEBPASS_STRATEGY)) {
            strategy = WEBPASS_STRATEGY
          }
        }

        switch (strategy) {
          case PROOFSPACE_STRATEGY:
            return _service.authorizePsResource(resourceId, creds, { ...options, poll })
          case NEWBELARUS_STRATEGY:
            return _service.authorizeNbResource(resourceId, creds, { ...options, poll })
          case WEBPASS_STRATEGY:
            return _service.authorizeWpResource(resourceId, creds, { ...options, poll })
        }
      }

      return false
    },

    getProofConditions: poll => {
      const conditions = poll.requiredProofs?.flatMap(proof => {
        switch (proof.type) {
          case PROOFSPACE_STRATEGY: {
            const action = proof.meta as PsActionTemplate
            return filterProofspaceRequiredCreds(action, [
              ctx.config.proofspace.keystoreCred.credentialId,
              ctx.config.proofspace.authCred.credentialId,
              ctx.config.proofspace.regCred.credentialId
            ]).map(id => ({ source: PROOFSPACE_STRATEGY, id }))
          }
          default:
            return []
        }
      })

      return conditions ?? []
    }
  }

  _service.authorizeNbResource = makeAuthorizeNbResourceHandler(ctx, _service)
  _service.authorizePsResource = makeAuthorizePsResourceHandler(ctx, _service)
  _service.authorizeWpResource = makeAuthorizeWpResourceHandler(ctx, _service)

  return _service
}
