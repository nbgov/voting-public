import { DB_WORKER, QUEUE_DB_SYNC } from '../../queue/consts'
import type { WorkerHandlerWithCtx } from '../../queue/types'
import { makeWaitMethod, serializeError } from '../../queue/utils'
import {
  CensusStatus, PollError, PollReadyError, PollStatus, type TmpTokenAuthenticationMethod, getWalletUtils,
  VOCDONI_CENSUS_CSP_NBNS, VOCDONI_CENSUS_CSP_BLINDNS, AUTH_TYPE_TOKEN_ONETIME,
  OneTimePayload
} from '@smartapps-poll/common'
import type { PollResource } from '../../resources/poll'
import type { VocdoniStepData, VocdoniStepResult } from './types'
import type { AuthResource } from '../../resources/auth'
import { newRequestParameters, pointToHex } from 'blindsecp256k1'
import { MalformedError } from '../../routes/errors'
import { buildDbSecurityHelper } from '../../db/security'

export const buildVocdoniStepHandler: WorkerHandlerWithCtx<VocdoniStepData, VocdoniStepResult> = ctx => ({
  tags: [DB_WORKER],

  queue: QUEUE_DB_SYNC,

  name: 'vocdoni:csp-step',

  handler: async job => {
    try {
      const { votingId, user, authType, step, authData } = job.data
      const Wallet = getWalletUtils()
      // const utils = getWalletUtils()

      const pollRes: PollResource = ctx.db.resource('poll')

      const poll = await pollRes.get(votingId, 'externalId')
      if (poll == null || poll.externalId == null) {
        throw new PollError('poll.notexists')
      }
      if (poll.status !== PollStatus.STARTED) {
        throw new PollReadyError()
      }
      if (poll.census.status !== CensusStatus.PUBLISHED) {
        throw new PollReadyError('census.notpublished')
      }
      if (user?._id == null) {
        throw new PollError('auth.required')
      }

      const authRes: AuthResource = ctx.db.resource('auth')
      const auth = await authRes.service.authenticateWithHash(AUTH_TYPE_TOKEN_ONETIME, user._id ?? '') as TmpTokenAuthenticationMethod
      // Actually this method is called just for legacy consistancy when ontime token were stored in the database
      await authRes.service.cleanTmpToken(user._id)
      if (auth == null) {
        throw new PollError('auth.insecure')
      }

      const payload: OneTimePayload | undefined = auth.credentials as OneTimePayload
      if (payload.externalId == null || payload.externalId !== poll.externalId) {
        throw new PollError('auth.abuse')
      }

      switch (authType) {
        case 'ecdsa':
          switch (step) {
            case '0':
              if (poll.census.type !== VOCDONI_CENSUS_CSP_NBNS) {
                throw new PollError('poll.wrongtype')
              }
              if (poll.census.token == null) {
                throw new PollReadyError()
              }

              const skHelper = buildDbSecurityHelper(ctx)
              const _token = (await skHelper.decryptSecretKey(poll.census.token)).toString('utf8')

              const serverWallet = await Wallet.fromEncryptedJson(_token, ctx.config.salt)

              const signature = serverWallet.signMessageSync(
                Buffer.from((authData[0] as { payload: string }).payload ?? '', 'hex')
              )

              return { signature }
          }
          break
        case 'blind':
          switch (step) {
            case '0':
              if (poll.census.type !== VOCDONI_CENSUS_CSP_BLINDNS) {
                throw new PollError('poll.wrongtype')
              }
              if (poll.census.token == null) {
                throw new PollReadyError()
              }

              const blindingParams = newRequestParameters()
              const token = pointToHex(blindingParams.signerR)

              await authRes.service.createTmpToken(token, undefined, AUTH_TYPE_TOKEN_ONETIME, { 
                k: blindingParams.k.toHex(32),
                externalId: poll.externalId
              })

              return { token }
          }
          break
      }
      throw new MalformedError()
    } catch (e) {
      serializeError(e)
      throw e
    }
  },

  wait: makeWaitMethod(ctx, QUEUE_DB_SYNC, 'vocdoni:csp-step')
})
